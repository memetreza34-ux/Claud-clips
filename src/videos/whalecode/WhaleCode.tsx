// Code-only test of the whale short (10 s, no voice, no captions): the beach set (beach.ts) on the pigeon engine's
// three.js pipeline: ink lines, lens blur, bloom, tone map, grade, vignette. The blast gets a white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect } from "postprocessing";
import { InkPass, noInkFallback } from "../pigeon/ink";
import { LensBlur } from "../pigeon/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../pigeon/grade";
import { BeachWorld, beachDof } from "./beach";
import { PSHOTS, TOTAL, BANG } from "./shots";

export const WHALECODE_FRAMES = TOTAL;

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
type Warm = { h: number; done: boolean };
const release = (w: Warm) => { if (!w.done) { w.done = true; continueRender(w.h); } };

const Inner: React.FC<{ id: number; f: number; warm: Warm }> = ({ id, f, warm }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => new BeachWorld(), []);
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
  const d = beachDof(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, "day");
  // the sand cloud is a stack of soft cards: fade the world's ink lines while it is thick, so no lines show through it

  return (
    <>
      <primitive key={world.root.uuid} object={world.root} dispose={null} />
      {post}
    </>
  );
};

const ShotView: React.FC<{ id: number; from: number }> = ({ id, from }) => {
  const t = useCurrentFrame();
  const warm = useMemo<Warm>(() => ({ h: delayRender("warm up beach " + id), done: false }), [id]);
  useEffect(() => () => release(warm), [warm]);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.2, far: 1500 }}>
        <Inner id={id} f={from + t} warm={warm} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const WhaleCodeShort: React.FC = () => {
  const f = useCurrentFrame();
  const flash = f >= BANG && f < BANG + 5 ? [1, 0.8, 0.55, 0.3, 0.12][f - BANG] : 0;
  const glow = f >= BANG + 3 && f < BANG + 12 ? 0.35 * (1 - (f - BANG - 3) / 9) : 0;
  return (
    <AbsoluteFill style={{ background: "#f2c79a" }}>
      {PSHOTS.map((s) => (
        <Sequence key={s.id} from={s.a} durationInFrames={s.b - s.a}>
          <ShotView id={s.id} from={s.a} />
        </Sequence>
      ))}
      {glow > 0 && <AbsoluteFill style={{ background: "#ff9a3c", opacity: glow, mixBlendMode: "screen" }} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#fff8e8", opacity: flash }} />}
    </AbsoluteFill>
  );
};
