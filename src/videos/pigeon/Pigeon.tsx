// "The Pigeons Who Flew a Bomb": copied from the bridge example (src/videos/bridge/), with the pigeon narration.
// World, shots and cameras are still the bridge ones until the pigeon world and shot plan replace them.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, shotAt, dofAt } from "./story";
import { PSHOTS, PFLASH, pLayersAt } from "./shots";
import { storyFrame } from "./warp";
import { LabWorld, labDof } from "./lab";
import { loadProps } from "./props";
import { OfficeWorld, officeDof } from "./office";
import { SkyWorld, skyDof } from "./sky";
import { LivingWorld, livingDof } from "./living";
// the finished mix (voice + music + effects, scripts/pigeon_mix.py) and the captions render with the picture
import mix from "../../../projects/pigeon/audio/mix.wav";
import { Captions } from "./Captions";

export const PIGEON_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

/** the CC0 furniture models (props.ts), loaded once before the first frame */
export const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("furniture props"));
  useEffect(() => { loadProps().then(setKit); }, []);
  // released only after the commit that mounted the canvases, whose warm-up holds (ShotView) already exist by then
  useEffect(() => { if (kit) continueRender(handle); }, [kit, handle]);
  return kit;
};

type Warm = { h: number; done: boolean };
const release = (w: Warm) => { if (!w.done) { w.done = true; continueRender(w.h); } };
const Inner: React.FC<{ id: number; kit: Kit; warm: Warm }> = ({ id, kit, warm }) => {
  const f = storyFrame(useCurrentFrame()); // authoring frame (warp.ts)
  const { camera, scene } = useThree();
  // built sets get their own world; the rest still shows the bridge world (bridge shot at the same frame) as a stand-in
  const set = PSHOTS[id - 1].set, room = set === "lab" || set === "office" || set === "sky" || set === "living";
  const world = useMemo(() => (set === "lab" ? new LabWorld(kit) : set === "office" ? new OfficeWorld(kit) : set === "sky" ? new SkyWorld() : set === "living" ? new LivingWorld(kit) : new World(kit)),
    [kit, room ? set : "bridge"]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    // from the cartoon-short-kit grade: a soft vignette that pulls the eye to the middle, and a little more saturation
    sat: new HueSaturationEffect({ saturation: 0.1 }),
    vig: new VignetteEffect({ offset: 0.32, darkness: 0.42 }),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  // a fresh canvas or world draws garbage on its first frame (post targets not sized yet). ShotView takes a hold
  // while it renders (before the canvas even exists); release it once this canvas (frameloop "always") has drawn
  // three frames of the new world
  useEffect(() => {
    let n = 0;
    const step = () => { if (++n < 3) requestAnimationFrame(step); else release(warm); };
    requestAnimationFrame(step);
    // never hang a render tab: if animation frames stall, let go after 2 s (a garbage frame is repaired afterwards)
    const t = setTimeout(() => release(warm), 2000);
    return () => clearTimeout(t);
  }, [world, fx, warm]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {([
        on.ink && <primitive key="ink" object={fx.ink} dispose={null} />,
        on.lens && on.pre && <primitive key="pre" object={fx.lens.pre} dispose={null} />,
        on.lens && <primitive key="lens" object={fx.lens.main} dispose={null} />,
        on.bloom && <primitive key="bloom" object={fx.bloom} dispose={null} />,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        on.grade && <primitive key="grade" object={fx.grade} dispose={null} />,
        <primitive key="sat" object={fx.sat} dispose={null} />,
        <primitive key="vig" object={fx.vig} dispose={null} />,
        on.grain && <primitive key="grain" object={fx.grain} dispose={null} />,
      ].filter(Boolean) as React.JSX.Element[])}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(room ? id : shotAt(f).id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = set === "lab" ? labDof(id, f) : set === "office" ? officeDof(id, f) : set === "sky" ? skyDof(id, f) : set === "living" ? livingDof(id, f) : dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  // our sets light their evenings with warm lamps (room.ts EVENING), so they all take the day grade
  const gl = PSHOTS[id - 1].light;
  gradeFor(fx.grade, room || gl === "night" ? "day" : gl);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive key={world.root.uuid} object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => {
  // one hold per mounted canvas and per set change, taken synchronously during render (see Inner)
  const set = PSHOTS[id - 1].set;
  const warm = useMemo<Warm>(() => ({ h: delayRender("warm up " + set), done: false }), [set]);
  // a layer that is removed (a tab jumping past a crossfade) must not leave its hold open, or the tab hangs
  useEffect(() => () => release(warm), [warm]);
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.2, far: 1500 }}>
        <Inner id={id} kit={kit} warm={warm} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const PigeonShort: React.FC = () => {
  const f = storyFrame(useCurrentFrame()); // authoring frame (warp.ts)
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= PFLASH && f < PFLASH + 4 ? [1, 0.75, 0.45, 0.2][Math.floor(f - PFLASH)] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {pLayersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Captions />
      <Audio src={mix} />
    </AbsoluteFill>
  );
};
