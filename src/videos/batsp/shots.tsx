// The 15 shots of "Die Fledermausbombe" in the 2.5D look: painted plate + our characters + calm camera.
// Every shot gets its local frame t (0 = shot start) and the global frame f; beat frames come from ../bats/timing.
// Medium framing by default, small pushes on the beats, every readable thing fully in frame (CHECKLIST).
import React from "react";
import { AbsoluteFill } from "remotion";
import { bodyFront, Pen } from "../pigeon/toon";
import { drawLytle, drawBat, BatOpts, LYTLE } from "../bats3d/bcast";
import { PRES, GENERAL, CLERK, drawCat, fxEyes, fxLetter, fxHands, fxNote, fxStamp, fxFrame, fxReport, REPORT, fxBurntSign, fxMap, fxFlag, fxTarget, fxThought, fxFrost, fxSpeed, fxThermo } from "../bats3d/bcast2";
import { BEAT, SHOTS } from "../bats/timing";
import { Layer, Plate, Sprite, Shadow, Glow, Grade, camAt, punch, lerp, clamp01, back, CamKey, W, H } from "./kit";
import { drawFlame, drawEmber, drawSmoke, drawScale, scalePans, drawCrate } from "./draw";

type S = { t: number; f: number };
const A = (id: number) => SHOTS[id - 1].a, LEN = (id: number) => SHOTS[id - 1].b - SHOTS[id - 1].a;
const L = (id: number, beat: number) => beat - A(id); // beat in shot-local frames
const LIGHT = -2.1; // key light from the upper left (canvas angle)
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const blink = (f: number, seed: number) => ((f + seed * 17) % 70) < 3;

/** a person (600 x 1000 design, soles at 975) standing with the soles at (x, y), h px tall canvas */
const Person: React.FC<{ id: string; draw: (p: Pen) => void; x: number; y: number; h: number; flip?: boolean; shadow?: boolean }> = ({ id, draw, x, y, h, flip, shadow = true }) => (
  <>
    {shadow && <Shadow x={x} y={y} w={h * 0.32} />}
    <Sprite k={id} cw={600} ch={1000} draw={draw} x={x} y={y + h * 0.025} w={h * 0.6} flip={flip} />
  </>
);
const lytle = (o: Parameters<typeof drawLytle>[1]) => (p: Pen) => drawLytle(p, { light: LIGHT, ...o });
const bat = (o: BatOpts) => (p: Pen) => drawBat(p, { light: LIGHT, ...o });
const batKey = (o: BatOpts) => "bat" + JSON.stringify(o);
const flap = (f: number, s = 0) => Math.round((0.5 + 0.5 * Math.sin(f * 0.9 + s)) * 4) / 4;

const Flames: React.FC<{ f: number; pts: [number, number, number][]; seed?: number }> = ({ f, pts, seed = 0 }) => (
  <>{pts.map(([x, y, w], i) => { const ph = Math.floor((f / 3 + i * 1.3 + seed) % 4); return <Sprite key={i} k={"fl" + ph} cw={256} ch={384} draw={drawFlame(ph)} x={x} y={y} w={w} />; })}</>
);
const Embers: React.FC<{ f: number; n?: number }> = ({ f, n = 24 }) => (
  <>{Array.from({ length: n }, (_, i) => { const u = (hash(i, 4) + f * 0.004 * (1 + hash(i, 5))) % 1; return <Sprite key={i} k="ember" cw={64} ch={64} draw={drawEmber} x={W * hash(i, 6) + 40 * Math.sin(f / 20 + i)} y={H * (1 - u)} w={22 + 14 * hash(i, 7)} ay={0.5} />; })}</>
);
/** foreground copy of the plate below a line: things behind a desk or a bed get covered by it */
const Front: React.FC<{ id: string; from: number }> = ({ id, from }) => (
  <div style={{ position: "absolute", inset: 0, clipPath: `inset(${(from / H) * 100}% 0 0 0)` }}><Plate id={id} /></div>
);

// ---------------- 1: hook, the burning base ----------------
export const Shot1: React.FC<S> = ({ t, f }) => {
  const rev = L(1, BEAT.american);
  const cam = camAt([{ t: 0, z: 1.25, x: 560, y: 1180 }, { t: rev - 6, z: 1.0, x: 540, y: 960, dur: 26 }], t, LEN(1), 0.02);
  cam.z += punch(t, L(1, BEAT.bats));
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="p01_base_fire" />
        <Flames f={f} pts={[[190, 1030, 90], [470, 1010, 100], [610, 1040, 80]]} />
        {Array.from({ length: 6 }, (_, i) => { const u = (hash(i, 2) + f * 0.004) % 1; return <Sprite key={i} k="smoke" cw={256} ch={256} draw={drawSmoke} x={300 + 200 * hash(i, 3) + u * 120} y={900 - u * 700} w={260 + u * 400} ay={0.5} />; })}
      </Layer>
      <Layer cam={cam} depth={1.15}>
        <Sprite k={"hero" + flap(f) + blink(f, 1)} cw={600} ch={1000} draw={bat({ look: "smug", hero: true, bomb: true, flap: flap(f), blink: blink(f, 1) })} x={560} y={1780 + 12 * Math.sin(f / 9)} w={640} />
        <Embers f={f} />
      </Layer>
      <Grade tint="#ff7040" tintO={0.12} />
    </AbsoluteFill>
  );
};

// ---------------- 2: the cave, millions of bats ----------------
export const Shot2: React.FC<S> = ({ t, f }) => {
  const close = L(2, BEAT.millionen) - 12;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }, { t: close, z: 1.3, x: 320, y: 1230, dur: 20 }], t, LEN(2), 0.03);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.8}><Plate id="p02_cave" />
      </Layer>
      <Layer cam={cam}>
        <Person id={"ly2" + (t >= close) + blink(f, 2)} draw={lytle({ mode: "stand", expr: t >= close ? "shock" : "neutral", look: 0.6, blink: blink(f, 2) })} x={250} y={1860} h={820} />
      </Layer>
      <Grade tint="#ff9060" tintO={0.08} />
    </AbsoluteFill>
  );
};

// ---------------- 3/4: the drive home, the idea ----------------
export const Shot3: React.FC<S> = ({ t, f }) => {
  const cut = L(3, BEAT.pearl) - 8;
  if (t < cut) {
    const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }], t, cut, 0.04);
    return (
      <AbsoluteFill>
        <Layer cam={cam}><Plate id="p03_car_pov" /><Glow x={760} y={1380} r={160} color="#9effc0" o={0.35 + 0.15 * Math.sin(f / 4)} /></Layer>
        <Grade tint="#ff9060" tintO={0.08} />
      </AbsoluteFill>
    );
  }
  return <CarSide t={t - cut} f={f} expr={t >= L(3, BEAT.pearl) ? "stern" : "neutral"} len={LEN(3) - cut} bubble={0} />;
};
export const Shot4: React.FC<S> = ({ t, f }) => {
  const grow = back((t - 5) / 10), pop = t >= 61 ? Math.max(0, 1 - (t - 61) / 6) : 1;
  return <CarSide t={t} f={f} expr={t >= L(4, BEAT.daechern) - 2 ? "grin" : "neutral"} len={LEN(4)} bubble={grow * pop} punchAt={L(4, BEAT.daechern)} />;
};
const CarSide: React.FC<{ t: number; f: number; expr: "stern" | "neutral" | "grin"; len: number; bubble: number; punchAt?: number }> = ({ t, f, expr, len, bubble, punchAt }) => {
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1000 }], t, len, 0.03);
  if (punchAt) cam.z += punch(t, punchAt);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.7}><Plate id="p04_car_side" blur={2} /></Layer>
      <Layer cam={cam}>
        <Person id={"ly3" + expr + blink(f, 3)} draw={lytle({ mode: "sit", expr, look: -0.4, blink: blink(f, 3), facing: -1 })} x={560} y={2010} h={1150} shadow={false} />
        {bubble > 0.02 && <Sprite k="thought" cw={520} ch={420} draw={fxThought(sleepBat)} x={700} y={620} w={620 * bubble} ay={0.6} />}
      </Layer>
      <Grade tint="#ff9060" tintO={0.08} />
    </AbsoluteFill>
  );
};
const sleepBat = (p: Pen, x: number, y: number) => {
  p.stroke([[x, y], [x, y + 14]], 4); p.ell(x, y + 40, 20, 24, "#5b4470", 4);
  for (const s of [-1, 1]) p.poly([[x + s * 6, y + 58], [x + s * 22, y + 80], [x + s * 18, y + 54]], "#5b4470", 3);
  for (const s of [-1, 1]) p.arc(x + s * 8, y + 38, 6, 3, 200, 340, 3);
};

// ---------------- 5: the President ----------------
const DESK5 = 1430; // top edge of the desk in p05_office (shot space)
export const Shot5: React.FC<S> = ({ t, f }) => {
  const up = L(5, BEAT.zahnarzt) - 6, down = 72, stamp = L(5, BEAT.spinner);
  if (t < down) {
    const cam = camAt([{ t: 0, z: 1.15, x: 540, y: 1250 }, { t: up, z: 1.15, x: 540, y: 1000, dur: 14 }], t, down, 0.03);
    return (
      <AbsoluteFill>
        <Layer cam={cam} depth={0.85}><Plate id="p05_office" /></Layer>
        <Layer cam={cam}>
          <Person id={"pres" + (t >= up) + blink(f, 4)} draw={(p) => bodyFront(p, PRES, { mode: "stand", expr: t >= up ? "stern" : "neutral", look: 0, blink: blink(f, 4), light: LIGHT, seed: 5 })} x={540} y={1760} h={1000} shadow={false} />
          <Front id="p05_office" from={DESK5} />
          <Sprite k="letter" cw={360} ch={480} draw={fxLetter} x={540} y={1560} w={330} />
          <Sprite k="hands" cw={520} ch={300} draw={fxHands} x={540} y={1610} w={470} />
        </Layer>
        <Grade tintO={0.05} />
      </AbsoluteFill>
    );
  }
  const k = clamp01((t - down - 6) / (stamp - down - 14)), drop = clamp01((t - (stamp - 6)) / 6);
  const cam = camAt([{ t: down, z: 1.0, x: 540, y: 960 }], t, LEN(5), 0.03);
  cam.z += punch(t, stamp);
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="p05b_desk" />
        <Sprite k={"note" + Math.round(k * 5)} cw={420} ch={260} draw={fxNote(k)} x={540} y={960} w={700} ay={0.5} />
        {t >= stamp - 6 && (drop < 1
          ? <Sprite k="stamp" cw={300} ch={140} draw={fxStamp} x={700} y={900 - 300 * (1 - drop)} w={380} ay={0.5} opacity={0.4 + 0.6 * drop} />
          : <Sprite k="stamp" cw={300} ch={140} draw={fxStamp} x={700} y={1060} w={380} ay={0.5} />)}
      </Layer>
      <Grade tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 6: the frame in the practice ----------------
export const Shot6: React.FC<S> = ({ t, f }) => {
  const hung = 27, zoom = L(6, BEAT.einrahmen);
  const cam = camAt([{ t: 0, z: 1.05, x: 540, y: 980 }], t, LEN(6), 0.03);
  cam.z += punch(t, zoom);
  const backK = clamp01((t - hung) / 16), proud = t >= zoom - 2;
  const lx = 780 - 60 * backK;
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="p06_dentist" />
        {t >= hung && <Sprite k="frameN" cw={320} ch={400} draw={fxFrame("note")} x={420} y={560} w={220} ay={0.5} />}
      </Layer>
      <Layer cam={cam}>
        {t < hung && <Sprite k="frameN" cw={320} ch={400} draw={fxFrame("note")} x={560} y={900 + 6 * Math.sin(t / 3)} w={250} ay={0.5} />}
        <Person id={"ly6" + proud + (t < hung) + blink(f, 5)} draw={lytle({ mode: "stand", expr: proud ? "grin" : "smile", arms: t < hung ? ["lift", "lift"] : proud ? ["hip", "thumb"] : ["hang", "hang"], reachLift: 1, look: -0.5, blink: blink(f, 5) })} x={lx} y={1820} h={900} />
      </Layer>
      <Grade tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 7/8: the lab, the fridge ----------------
const tilt7 = (t: number) => 0.24 * back((t - (L(7, BEAT.schwerer) - 6)) / 10);
export const Shot7: React.FC<S> = ({ t, f }) => {
  const toFridge = 118;
  if (t < toFridge) {
    const tl = tilt7(t), pans = scalePans(tl), sx = 540, sy = 1500, sw = 760, k = sw / 800;
    const P = (q: [number, number]) => [sx - sw / 2 + q[0] * k, sy - 700 * k + q[1] * k] as const;
    const [lx, ly] = P(pans.L), [rx, ry] = P(pans.R), shocked = t >= L(7, BEAT.schwerer) - 2;
    const cam = camAt([{ t: 0, z: 1.05, x: 540, y: 1150 }], t, toFridge, 0.03);
    cam.z += punch(t, L(7, BEAT.schwerer));
    return (
      <AbsoluteFill>
        <Layer cam={cam} depth={0.85}><Plate id="p07_lab" /></Layer>
        <Layer cam={cam}>
          <Shadow x={sx} y={sy} w={500} />
          <Sprite k={"scale" + tl.toFixed(3)} cw={800} ch={700} draw={drawScale(tl)} x={sx} y={sy} w={sw} />
          <Sprite k={"bs" + shocked} cw={600} ch={1000} draw={bat({ look: shocked ? "shock" : "sleep", flap: 0.1 })} x={lx} y={ly + 20} w={230} />
          <Sprite k="bomb7" cw={120} ch={200} draw={(p) => { p.poly([[30, 20], [90, 20], [96, 150], [60, 185], [24, 150]], "#e0402e", 6); p.poly([[28, 60], [92, 60], [93, 78], [27, 78]], "#f5d04a", 4); }} x={rx} y={ry + 8} w={70} />
        </Layer>
        <Grade tintO={0.05} />
      </AbsoluteFill>
    );
  }
  return <Fridge t={t - toFridge} f={f} len={LEN(7) - toFridge} hero={false} />;
};
export const Shot8: React.FC<S> = ({ t, f }) => <Fridge t={t} f={f} len={LEN(8)} hero snapAt={L(8, BEAT.frueh)} />;
const TRAYS = [700, 1060, 1420]; // tray rows in p07b_fridge (shot space)
const Fridge: React.FC<{ t: number; f: number; len: number; hero: boolean; snapAt?: number }> = ({ t, f, len, hero, snapAt = 1e9 }) => {
  const snap = t >= snapAt - 2;
  const cam = hero ? camAt([{ t: 0, z: 2.2, x: 470, y: TRAYS[1] - 60 }], t, len, 0.05) : camAt([{ t: 0, z: 1.0, x: 540, y: 960 }], t, len, 0.03);
  if (hero) cam.z += punch(t, snapAt);
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="p07b_fridge" />
        {TRAYS.map((y, r) => [300, 470, 640, 810].map((x, i) => {
          const isHero = r === 1 && i === 1, o: BatOpts = { look: isHero && snap ? "shock" : "sleep", flap: 0 };
          return <Sprite key={`${r}${i}`} k={batKey(o)} cw={600} ch={1000} draw={bat(o)} x={x} y={y + 10} w={150} />;
        }))}
      </Layer>
      {hero && snap && <Sprite k={"frost" + Math.round(clamp01((t - snapAt + 2) / 6) * 6)} cw={512} ch={512} draw={fxFrost(clamp01((t - snapAt + 2) / 6))} x={540} y={960} w={1300} ay={0.5} />}
      <Grade tint="#80c0ff" tintO={0.1} />
    </AbsoluteFill>
  );
};

// ---------------- 9: the hot new base, the crate ----------------
export const Shot9: React.FC<S> = ({ t, f }) => {
  const cut = 107, lid = L(9, BEAT.genau) - 6, burst = L(9, BEAT.genau) - 2;
  if (t < cut) {
    const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }], t, cut, 0.04);
    return <AbsoluteFill><Layer cam={cam}><Plate id="p09_base_day" /></Layer><Grade tint="#ffe0a0" tintO={0.06} /></AbsoluteFill>;
  }
  const cam = camAt([{ t: cut, z: 1.25, x: 540, y: 1300 }], t, LEN(9) - cut, 0.03);
  cam.z += punch(t, burst + 2);
  const lk = clamp01((t - lid) / 8), th = Math.min(1, (t - cut) / 26);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.8}><Plate id="p09_base_day" blur={3} /></Layer>
      <Layer cam={cam}>
        <Shadow x={560} y={1640} w={620} o={0.45} />
        <Sprite k={"crate" + lk.toFixed(2)} cw={600} ch={520} draw={drawCrate(lk)} x={560} y={1650} w={560} />
        <Sprite k={"thermo" + th.toFixed(2)} cw={140} ch={440} draw={fxThermo(th)} x={190} y={1560} w={110} />
        {t >= burst && Array.from({ length: 16 }, (_, i) => {
          const u = (t - burst) / 18, a = hash(i, 11) * Math.PI * 2, sp = 0.6 + hash(i, 12);
          return <Sprite key={i} k={"fb" + flap(f, i)} cw={600} ch={1000} draw={bat({ look: "smug", bomb: true, flap: flap(f, i) })} x={560 + Math.cos(a) * 520 * u * sp} y={1400 - 700 * u * sp * (0.4 + hash(i, 13))} w={140 + 260 * u} ay={0.7} />;
        })}
      </Layer>
      <Grade tint="#ffe0a0" tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 10: the bats dive under the roofs, the general's car ----------------
export const Shot10: React.FC<S> = ({ t, f }) => {
  const gen = 65, burn = L(10, BEAT.generals) - 2, more = L(10, BEAT.flammen) - 2;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 900 }, { t: gen, z: 1.12, x: 520, y: 1250, dur: 14 }, { t: burn + 6, z: 1.3, x: 380, y: 1150, dur: 8 }], t, LEN(10), 0.02);
  cam.z += punch(t, burn + 2) + punch(t, more + 2);
  const car = clamp01((t - burn) / 10), more2 = clamp01((t - more) / 10), shock = t >= burn;
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="p10_base_car" />
        {t < gen && Array.from({ length: 14 }, (_, i) => {
          const u = clamp01((t - i * 2) / 40), sx = 540 + 500 * (hash(i, 22) - 0.5), ex = 200 + 680 * hash(i, 21), ey = 980 + 80 * hash(i, 23);
          return u < 1 && <Sprite key={i} k={"db" + flap(f, i)} cw={600} ch={1000} draw={bat({ look: "smug", bomb: true, flap: flap(f, i) })} x={sx + (ex - sx) * u} y={1800 - (1800 - ey) * u} w={240 - 170 * u} ay={0.6} />;
        })}
        <Flames f={f} pts={[[260, 1000, 150 * car + 60], [420, 990, 170 * car + 60], [600, 1000, 150 * car + 60]]} />
        {car > 0 && <Flames f={f} seed={7} pts={[[560, 1320, 160 * car + 80 * more2], [780, 1320, 150 * car + 80 * more2], [660, 1300, 120 * more2]]} />}
      </Layer>
      <Layer cam={cam}>
        <Person id={"gen" + shock + blink(f, 6)} draw={(p) => bodyFront(p, GENERAL, { mode: "stand", expr: shock ? "shock" : "grin", arms: shock ? ["up", "up"] : ["hip", "hip"], look: shock ? 0.5 : 0, blink: !shock && blink(f, 6), light: LIGHT, seed: 9 })} x={330} y={1720} h={760} />
        <Embers f={f} n={14} />
      </Layer>
      <Grade tint="#ff7040" tintO={0.1} />
    </AbsoluteFill>
  );
};

// ---------------- 11: the attic cutaway ----------------
const CORNER11: [number, number] = [860, 760];
export const Shot11: React.FC<S> = ({ t, f }) => {
  const enter = 12, look = 38, pick = 96, land = L(11, BEAT.ecke) - 4;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }], t, LEN(11), 0.03);
  cam.z += punch(t, L(11, BEAT.ecke));
  let x: number, y: number, gaze = 0, lk: BatOpts["look"] = "awake", rot = 0;
  if (t < look) { const u = clamp01((t - enter) / (look - enter)); x = 540; y = -100 + 900 * u; }
  else if (t < pick) { x = 540; y = 800 + 10 * Math.sin(t / 6); gaze = -1; lk = t < pick - 20 ? "awake" : "smug"; }
  else { const u = clamp01((t - pick) / (land - pick)); x = 540 + (CORNER11[0] - 540) * u; y = 800 + (CORNER11[1] - 800) * u; gaze = 1; lk = "smug"; rot = t >= land ? Math.PI : 0; }
  if (t >= land + 6) lk = "sleep";
  const fl = t >= land ? 0 : flap(f);
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="p11_attic" />
        <Sprite k="target" cw={300} ch={340} draw={fxTarget} x={260} y={820} w={220} ay={0.5} />
        <Sprite k={batKey({ look: lk, gaze, flap: fl, hero: true })} cw={600} ch={1000} draw={bat({ look: lk, gaze, flap: fl, hero: true })} x={x} y={y} w={240} ay={0.7} rot={rot} />
      </Layer>
      <Grade tint="#4060c0" tintO={0.12} />
    </AbsoluteFill>
  );
};

// ---------------- 12: the cat under the bed ----------------
const BOX12: [number, number] = [300, 1560], UNDER12: [number, number] = [640, 1330], BED12 = 1290;
export const Shot12: React.FC<S> = ({ t, f }) => {
  const pop = 17, zip = 50, gone = 64, eyes = L(12, BEAT.sekunden) - 2;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1000 }, { t: gone, z: 1.25, x: UNDER12[0], y: UNDER12[1], dur: 14 }], t, LEN(12), 0.02);
  cam.z += punch(t, eyes + 2);
  let cx = BOX12[0], cy = BOX12[1] + 120, cs = 300, look: "calm" | "wide" = "calm";
  if (t >= pop && t < zip) { const u = back((t - pop) / 8); cy = BOX12[1] + 120 - 200 * u; look = t < pop + 12 ? "calm" : "wide"; }
  else if (t >= zip) { const u = clamp01((t - zip) / (gone - zip)); cx = BOX12[0] + (UNDER12[0] - BOX12[0]) * u; cy = BOX12[1] + (UNDER12[1] + 60 - BOX12[1]) * u; cs = 300 - 120 * u; look = "wide"; }
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="p12_bedroom" />
        {t >= pop && t < gone && <Sprite k={"cat" + look} cw={600} ch={1000} draw={(p) => drawCat(p, { look, light: LIGHT })} x={cx} y={cy} w={cs} />}
        {t >= zip && t < gone && <Sprite k="speed" cw={400} ch={200} draw={fxSpeed} x={cx - 160} y={cy - 80} w={260} ay={0.5} />}
        <Front id="p12_bedroom" from={t >= zip ? BED12 + 200 : H} />
        {t >= eyes && <Sprite k="eyes" cw={256} ch={128} draw={fxEyes} x={UNDER12[0]} y={UNDER12[1]} w={150 * back((t - eyes) / 6)} ay={0.5} />}
      </Layer>
      <Grade tint="#4060c0" tintO={0.1} />
    </AbsoluteFill>
  );
};

// ---------------- 13/14: the report ----------------
const DESK13 = 1500;
export const Shot13: React.FC<S> = ({ t, f }) => {
  const up = 60, n = Math.min(REPORT.length, Math.max(0, Math.floor((t - 10) / 1.25 / 3) * 3));
  if (t < up) {
    const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }], t, up, 0.03);
    return (
      <AbsoluteFill>
        <Layer cam={cam}><Plate id="p13_typewriter" />
          <Sprite k={"rep" + n} cw={520} ch={620} draw={fxReport(n)} x={540} y={760} w={560} ay={0.5} />
        </Layer>
        <Grade tintO={0.08} />
      </AbsoluteFill>
    );
  }
  return <Clerk t={t - up} f={f} len={LEN(13) - up} turned={false} n={n} />;
};
export const Shot14: React.FC<S> = ({ t, f }) => <Clerk t={t} f={f} len={LEN(14)} turned={t >= L(14, BEAT.stuetzpunkt) - 6} n={REPORT.length} sign punchAt={L(14, BEAT.stuetzpunkt)} />;
const Clerk: React.FC<{ t: number; f: number; len: number; turned: boolean; n: number; sign?: boolean; punchAt?: number }> = ({ t, f, len, turned, n, sign, punchAt }) => {
  const cam = camAt([{ t: 0, z: 1.1, x: 540, y: 1150 }], t, len, 0.03);
  if (punchAt) cam.z += punch(t, punchAt);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="p13b_army_office" /></Layer>
      <Layer cam={cam}>
        <Person id={"clerk" + turned + blink(f, 9)} draw={(p) => bodyFront(p, CLERK, { mode: "stand", expr: "neutral", look: turned ? 0 : -0.5, facing: turned ? 0 : -1, blink: blink(f, 9), light: LIGHT, seed: 13 })} x={540} y={1900} h={1050} shadow={false} />
        <Front id="p13b_army_office" from={DESK13} />
        <Sprite k={"rep" + n} cw={520} ch={620} draw={fxReport(n)} x={360} y={1640} w={300} ay={0.5} rot={-0.08} />
        {sign && <Sprite k="burnt" cw={360} ch={140} draw={fxBurntSign} x={760} y={1660} w={300} ay={0.5} rot={0.06} />}
      </Layer>
      <Grade tintO={0.08} />
    </AbsoluteFill>
  );
};

// ---------------- 15: the map ----------------
export const Shot15: React.FC<S> = ({ t, f }) => {
  const push = 65, flag = L(15, BEAT.amerika) - 2, dash = clamp01((t - 8) / 50);
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 900 }, { t: push, z: 1.3, x: 720, y: 860, dur: 20 }], t, LEN(15), 0.02);
  cam.z += punch(t, flag + 2);
  const fl = t >= flag && t < flag + 10 ? 0.8 : 0.2;
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="p15_wall" />
        <Sprite k={"map" + Math.round(dash * 16)} cw={1200} ch={800} draw={fxMap(dash)} x={540} y={880} w={960} ay={0.5} />
        <Sprite k={batKey({ look: "smug", hero: true, flap: fl })} cw={600} ch={1000} draw={bat({ look: "smug", hero: true, flap: fl })} x={830} y={930} w={200} ay={0.75} />
        {t >= flag && <Sprite k="vflag" cw={160} ch={260} draw={fxFlag} x={900} y={900} w={90 * back((t - flag) / 8)} />}
      </Layer>
      <Grade tintO={0.06} />
    </AbsoluteFill>
  );
};

export const SCENES: Record<number, React.FC<S>> = { 1: Shot1, 2: Shot2, 3: Shot3, 4: Shot4, 5: Shot5, 6: Shot6, 7: Shot7, 8: Shot8, 9: Shot9, 10: Shot10, 11: Shot11, 12: Shot12, 13: Shot13, 14: Shot14, 15: Shot15 };
export { lerp, LYTLE };
