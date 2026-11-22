// "Die Fledermausbombe" on the three.js engine of the pigeon short (2D character cards in a 3D world, ink lines, lens
// blur, bloom, grade), with the German voice and captions. Every shot has its own set (OWN below), played in bat
// frames. Place changes crossfade over 8 frames; the incoming shot mounts 10 frames earlier, invisible, so its fresh
// canvas has drawn real frames before it shows. The hook ends on a white flash, shot 9 opens on a hard cut.
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
import { PSHOTS } from "../pigeon/shots";
import { loadProps } from "../pigeon/props";
import { LabWorld, labDof } from "../pigeon/lab";
import { OfficeWorld, officeDof } from "../pigeon/office";
import { SkyWorld, skyDof } from "../pigeon/sky";
import { LivingWorld, livingDof } from "../pigeon/living";
// the finished mix (voice + music + effects, scripts/bats_audio.py)
import voice from "../../../projects/bats/audio/mix.wav";
import { Captions } from "../bats/Captions";
import { DesertWorld, desertDof } from "./desert";
import { AirbaseWorld, airbaseDof } from "./airbase";
import { CarWorld, carDof } from "./car";
import { FLASH, SHOTS, TOTAL } from "../bats/timing";
import { OvalWorld, ovalDof, DentistWorld, dentistDof, ReportWorld, reportDof, MapWorld, mapDof } from "./rooms";
import { BatLabWorld, labDof as batLabDof, CutawayWorld, cutDof, BedroomWorld, bedDof } from "./rooms2";

export const BATS3D_FRAMES = TOTAL;

/** bat shot id -> pigeon shot id whose set and camera stand in for it until the bat set exists */
const MAP: Record<number, number> = { 1: 1, 2: 9, 3: 14, 4: 14, 5: 4, 6: 2, 7: 7, 8: 8, 9: 9, 10: 1, 11: 15, 12: 14, 13: 13, 14: 16, 15: 17 };

/** bat shots that already have their own set: world + depth of field, played in bat frames */
type OwnSet = { key: string; make: (kit: Kit) => { root: THREE.Object3D; update: (id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) => THREE.Vector3 }; dof: (id: number, f: number) => { cInf: number; focus?: (f: number) => [number, number, number] } };
const OWN: Record<number, OwnSet> = {
  1: { key: "airbase", make: () => new AirbaseWorld(), dof: airbaseDof },
  2: { key: "desert", make: () => new DesertWorld(), dof: desertDof },
  3: { key: "car", make: () => new CarWorld(), dof: carDof },
  4: { key: "car", make: () => new CarWorld(), dof: carDof },
  5: { key: "oval", make: (k) => new OvalWorld(k), dof: ovalDof },
  6: { key: "dentist", make: (k) => new DentistWorld(k), dof: dentistDof },
  7: { key: "lab", make: (k) => new BatLabWorld(k), dof: batLabDof },
  8: { key: "lab", make: (k) => new BatLabWorld(k), dof: batLabDof },
  9: { key: "airbase", make: () => new AirbaseWorld(), dof: airbaseDof },
  10: { key: "airbase", make: () => new AirbaseWorld(), dof: airbaseDof },
  11: { key: "cutaway", make: () => new CutawayWorld(), dof: cutDof },
  12: { key: "bedroom", make: (k) => new BedroomWorld(k), dof: bedDof },
  13: { key: "report", make: (k) => new ReportWorld(k), dof: reportDof },
  14: { key: "report", make: (k) => new ReportWorld(k), dof: reportDof },
  15: { key: "map", make: (k) => new MapWorld(k), dof: mapDof },
};
/** shots that crossfade in (place changes); the others start on a cut */
const XF = new Set([3, 5, 6, 7, 11, 12, 13, 15]);
const FADE = 8, PRE = 10;

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("furniture props"));
  useEffect(() => { loadProps().then(setKit); }, []);
  useEffect(() => { if (kit) continueRender(handle); }, [kit, handle]);
  return kit;
};

type Warm = { h: number; done: boolean };
const release = (w: Warm) => { if (!w.done) { w.done = true; continueRender(w.h); } };

/** renders pigeon shot `pid` at pigeon (authoring) frame `pf` */
const Inner: React.FC<{ pid: number; pf: number; kit: Kit; warm: Warm; own?: OwnSet }> = ({ pid, pf, kit, warm, own }) => {
  const { camera, scene } = useThree();
  const set = own ? own.key : PSHOTS[pid - 1].set;
  const world = useMemo(() => (own ? own.make(kit) : set === "lab" ? new LabWorld(kit) : set === "office" ? new OfficeWorld(kit) : set === "sky" ? new SkyWorld() : new LivingWorld(kit)), [kit, set]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    sat: new HueSaturationEffect({ saturation: 0.1 }),
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
  const target = world.update(pid, pf, cam, scene);
  noInkFallback(world.root);
  const d = own ? own.dof(pid, pf) : set === "lab" ? labDof(pid, pf) : set === "office" ? officeDof(pid, pf) : set === "sky" ? skyDof(pid, pf) : livingDof(pid, pf);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(pf)); else fpt.copy(target);
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
  const t = useCurrentFrame(); // shot-local frame (inside its Sequence)
  const own = OWN[id];
  const pid = own ? id : MAP[id], ps = PSHOTS[MAP[id] - 1];
  // own set: bat frames; stand-in: play the pigeon shot from its start, hold its last frame if the bat shot is longer
  const pf = own ? from + t : Math.min(ps.a + t, ps.b - 1);
  const a = SHOTS[id - 1].a, alpha = XF.has(id) ? Math.max(0, Math.min(1, (pf - (a - FADE) + 1) / (FADE + 1))) : 1;
  const wkey = own ? own.key : ps.set;
  const warm = useMemo<Warm>(() => ({ h: delayRender("warm up " + wkey), done: false }), [wkey]);
  useEffect(() => () => release(warm), [warm]);
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.2, far: 1500 }}>
        <Inner pid={pid} pf={pf} kit={kit} warm={warm} own={own} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Bats3DShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH && f < FLASH + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {SHOTS.map((s) => {
        const from = s.a - (XF.has(s.id) ? FADE + PRE : 0);
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.b - from}>
            <ShotView id={s.id} kit={kit} from={from} />
          </Sequence>
        );
      })}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Captions />
      <Audio src={voice} />
    </AbsoluteFill>
  );
};
