// A clip built entirely in code: every shot plays a three.js set (a RoomWorld subclass) through the pigeon engine's
// pipeline (ink lines, lens blur, bloom, tone map, grade, vignette) with flat 2D Pen characters as lit cards; captions
// and the finished mix on top. Works for vertical shorts (1080x1920) and 16:9 long videos (1920x1080): the size comes
// from the Composition. Place changes crossfade over 8 frames; the incoming shot mounts 10 frames early, invisible, so
// its canvas has drawn real frames before it shows. White flashes and an orange afterglow on the frames you pass.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect } from "postprocessing";
import { InkPass, noInkFallback } from "../videos/pigeon/ink";
import { LensBlur } from "../videos/pigeon/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../videos/pigeon/grade";
import { Kit } from "../videos/pigeon/build";
import { loadProps } from "../videos/pigeon/props";
import { Captions } from "./Captions";
import { ShotRow } from "./room";

type World = { root: THREE.Object3D; update: (id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) => THREE.Vector3 };
type Dof = (id: number, f: number) => { cInf: number; focus?: (f: number) => [number, number, number] };
/** one place: a key (shots with the same key share nothing but the code), how to build it, its depth of field */
export type OwnSet = { key: string; make: (kit: Kit) => World; dof: Dof };
type Word = { w: string; s: number; e: number };
export type CodeShortProps = {
  shots: ShotRow[]; sets: Record<number, OwnSet>; xf: Set<number>; audio: string; words: Word[];
  captions?: "short" | "long" | "none"; flashes?: number[]; glowAt?: number; background?: string;
};
const FADE = 8, PRE = 10;

const makeBloom = (h: number) => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, hh: number) => setSize(Math.round((h * w) / Math.max(hh, 1)), h);
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

const Inner: React.FC<{ id: number; f: number; kit: Kit; warm: Warm; set: OwnSet; h: number }> = ({ id, f, kit, warm, set, h }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => set.make(kit), [kit, set]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(h),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    sat: new HueSaturationEffect({ saturation: 0.12 }),
    vig: new VignetteEffect({ offset: 0.32, darkness: 0.42 }),
  }), [camera, scene, h]);
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

const ShotView: React.FC<{ id: number; kit: Kit; from: number; p: CodeShortProps }> = ({ id, kit, from, p }) => {
  const t = useCurrentFrame(), { width, height } = useVideoConfig();
  const f = from + t, a = p.shots[id - 1].a, set = p.sets[id];
  const alpha = p.xf.has(id) ? Math.max(0, Math.min(1, (f - (a - FADE) + 1) / (FADE + 1))) : 1;
  const warm = useMemo<Warm>(() => ({ h: delayRender("warm up " + set.key + id), done: false }), [set, id]);
  useEffect(() => () => release(warm), [warm]);
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.2, far: 1500 }}>
        <Inner id={id} f={Math.max(a, f)} kit={kit} warm={warm} set={set} h={height} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const CodeShort: React.FC<CodeShortProps> = (p) => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const fl = (p.flashes ?? []).find((x) => f >= x && f < x + 5);
  const flash = fl === undefined ? 0 : [1, 0.8, 0.55, 0.3, 0.12][f - fl];
  const g0 = p.glowAt ?? -1e9, glow = f >= g0 + 3 && f < g0 + 12 ? 0.35 * (1 - (f - g0 - 3) / 9) : 0;
  return (
    <AbsoluteFill style={{ background: p.background ?? "#f2c79a" }}>
      {p.shots.map((s) => {
        const from = Math.max(0, s.a - (p.xf.has(s.id) ? FADE + PRE : 0));
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.b - from}>
            <ShotView id={s.id} kit={kit} from={from} p={p} />
          </Sequence>
        );
      })}
      {glow > 0 && <AbsoluteFill style={{ background: "#ff9a3c", opacity: glow, mixBlendMode: "screen" }} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#fff8e8", opacity: flash }} />}
      {p.captions !== "none" && <Captions words={p.words} mode={p.captions ?? "short"} />}
      <Audio src={p.audio} />
    </AbsoluteFill>
  );
};
