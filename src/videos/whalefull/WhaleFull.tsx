// "Der explodierende Wal", built entirely in code: every shot is a three.js set (sets.ts) on the pigeon engine's
// pipeline (ink lines, lens blur, bloom, tone map, grade, vignette) with flat 2D Pen characters as lit cards.
// Place changes crossfade over 8 frames; the incoming shot mounts 10 frames earlier, invisible, so its canvas has drawn
// real frames before it shows. White flashes after the hook and on the blast, an orange afterglow on the blast;
// captions and the finished mix (scripts/whale_audio.py) on top.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect } from "postprocessing";
import { InkPass, noInkFallback } from "../pigeon/ink";
import { LensBlur } from "../pigeon/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../pigeon/grade";
import { Kit } from "../pigeon/build";
import { loadProps } from "../pigeon/props";
import mix from "../../../projects/whale/audio/mix.wav";
import { Captions } from "../whale/Captions";
import { PSHOTS, TOTAL, FLASHES } from "./shots";
import { SETS, XF, OwnSet } from "./sets";

export const WHALEFULL_FRAMES = TOTAL;
const FADE = 8, PRE = 10;
const BANG = FLASHES[1];

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
type Warm = { h: number; done: boolean };
const release = (w: Warm) => { if (!w.done) { w.done = true; continueRender(w.h); } };

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("furniture props"));
  useEffect(() => { loadProps().then(setKit); }, []);
  useEffect(() => { if (kit) continueRender(handle); }, [kit, handle]);
  return kit;
};

const Inner: React.FC<{ id: number; f: number; kit: Kit; warm: Warm; set: OwnSet }> = ({ id, f, kit, warm, set }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => set.make(kit), [kit, set]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    sat: new HueSaturationEffect({ saturation: 0.12 }),
    vig: new VignetteEffect({ offset: 0.32, darkness: 0.42 }),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  useEffect(() => {
    let n = 0;
    const step = () => { if (++n < 3) requestAnimationFrame(step); else release(warm); };
    requestAnimationFrame(step);
    const t = setTimeout(() => release(warm), 2000);
    return () => clearTimeout(t);
  }, [world, fx, warm]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
      <primitive object={fx.sat} dispose={null} />
      <primitive object={fx.vig} dispose={null} />
    </EffectComposer>
  ), [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = set.dof(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, "day");
  return (
    <>
      <primitive key={world.root.uuid} object={world.root} dispose={null} />
      {post}
    </>
  );
};

const ShotView: React.FC<{ id: number; kit: Kit; from: number }> = ({ id, kit, from }) => {
  const t = useCurrentFrame();
  const f = from + t, a = PSHOTS[id - 1].a, set = SETS[id];
  const alpha = XF.has(id) ? Math.max(0, Math.min(1, (f - (a - FADE) + 1) / (FADE + 1))) : 1;
  const warm = useMemo<Warm>(() => ({ h: delayRender("warm up " + set.key + id), done: false }), [set, id]);
  useEffect(() => () => release(warm), [warm]);
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.2, far: 1500 }}>
        <Inner id={id} f={Math.max(a, f)} kit={kit} warm={warm} set={set} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const WhaleFullShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const fl = FLASHES.find((x) => f >= x && f < x + 5);
  const flash = fl === undefined ? 0 : [1, 0.8, 0.55, 0.3, 0.12][f - fl];
  const glow = f >= BANG + 3 && f < BANG + 12 ? 0.35 * (1 - (f - BANG - 3) / 9) : 0;
  return (
    <AbsoluteFill style={{ background: "#f2c79a" }}>
      {PSHOTS.map((s) => {
        const from = s.a - (XF.has(s.id) ? FADE + PRE : 0);
        return (
          <Sequence key={s.id} from={Math.max(0, from)} durationInFrames={s.b - Math.max(0, from)}>
            <ShotView id={s.id} kit={kit} from={Math.max(0, from)} />
          </Sequence>
        );
      })}
      {glow > 0 && <AbsoluteFill style={{ background: "#ff9a3c", opacity: glow, mixBlendMode: "screen" }} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#fff8e8", opacity: flash }} />}
      <Captions />
      <Audio src={mix} />
    </AbsoluteFill>
  );
};
