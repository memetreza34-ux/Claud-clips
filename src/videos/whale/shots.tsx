// The 19 shots of "Der explodierende Wal" in the 2.5D look: painted plate + our drawings + calm camera (one shot per
// voice line, SHOTS.md). Every shot gets its local frame t (0 = shot start) and the global frame f.
// Medium framing by default, small pushes on the beats, every readable thing inside the safe area (CHECKLIST).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { bodyFront, bodySide, Pen, Outfit, Expr, ArmPose } from "../pigeon/toon";
import { Layer, Sprite, Shadow, Glow, Grade, camAt, punch, clamp01, back, W, H } from "../batsp/kit";
import { beat, SHOTS } from "./timing";
import {
  THORNTON, VET, WOMAN, crowd, drawWhale, drawChunk, drawPuff, drawBoom, drawStick, drawCrate, drawPlunger, drawCar, drawGull,
  drawStink, drawTVCam, drawSign, drawTape, drawDozer, drawMound, drawPaper, drawChalk, drawEggSplat,
} from "./draw";

type S = { t: number; f: number };
const A = (id: number) => SHOTS[id - 1].a, LEN = (id: number) => SHOTS[id - 1].b - SHOTS[id - 1].a;
const L = (id: number, w: string) => beat(id, w) - A(id); // beat in shot-local frames
const LIGHT = -2.1;
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const blink = (f: number, seed: number) => ((f + seed * 17) % 70) < 3;
const DAY = "#9fb8d8", DUSK = "#ff8a50", NIGHT = "#4060c0";

/** painted plate of this short (public/whale_plates), filling the shot, a little oversized for pans */
const Plate: React.FC<{ id: string; blur?: number; filter?: string; over?: number }> = ({ id, blur = 0, filter = "", over = 1.04 }) => (
  <Img src={staticFile(`whale_plates/${id}.png`)} style={{ position: "absolute", left: (W - W * over) / 2, top: (H - H * over) / 2, width: W * over, height: H * over, objectFit: "cover", filter: `${blur ? `blur(${blur}px) ` : ""}${filter}` }} />
);
/** foreground copy of the plate below a line: things behind a desk get covered by it */
const Front: React.FC<{ id: string; from: number }> = ({ id, from }) => (
  <div style={{ position: "absolute", inset: 0, clipPath: `inset(${(from / H) * 100}% 0 0 0)` }}><Plate id={id} /></div>
);
/** a person (600 x 1000 design, soles at 975) standing with the soles at (x, y), h px tall */
const Person: React.FC<{ id: string; draw: (p: Pen) => void; x: number; y: number; h: number; flip?: boolean; shadow?: boolean; rot?: number }> = ({ id, draw, x, y, h, flip, shadow = true, rot }) => (
  <>
    {shadow && <Shadow x={x} y={y} w={h * 0.32} />}
    <Sprite k={id} cw={600} ch={1000} draw={draw} x={x} y={y + h * 0.025} w={h * 0.6} flip={flip} rot={rot} />
  </>
);
type Pose = { expr?: Expr; arms?: [ArmPose, ArmPose]; look?: number; blink?: boolean; mode?: "stand" | "march" | "stroll"; phase?: number; facing?: -1 | 0 | 1 };
const who = (o: Outfit, seed: number, q: Pose) => (p: Pen) => bodyFront(p, o, { mode: "stand", light: LIGHT, seed, ...q });
const key = (n: string, q: Pose) => n + JSON.stringify(q);
/** a person with an outfit and a pose; redrawn when the pose changes */
const Guy: React.FC<{ n: string; o: Outfit; seed: number; q: Pose; x: number; y: number; h: number; flip?: boolean; shadow?: boolean }> = ({ n, o, seed, q, ...r }) => (
  <Person id={key(n, q)} draw={who(o, seed, q)} {...r} />
);
const shake = (t: number, at: number, amp = 26, len = 16) => {
  if (t < at || t > at + len) return { x: 0, y: 0 };
  const k = 1 - (t - at) / len;
  return { x: amp * k * Math.sin(t * 2.9), y: amp * k * Math.cos(t * 3.7) };
};
const withShake = (cam: { z: number; x: number; y: number }, s: { x: number; y: number }) => ({ ...cam, x: cam.x + s.x, y: cam.y + s.y });

/** blubber chunks falling through the frame: each starts at t0 + i * gap from above, lands on `floor` (or falls through) */
const Rain: React.FC<{ t: number; t0: number; n: number; gap?: number; floor?: number; size?: [number, number]; x0?: number; x1?: number; seed?: number; speed?: number }> = ({ t, t0, n, gap = 3, floor, size = [90, 200], x0 = 60, x1 = 1020, seed = 1, speed = 1 }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const u = t - t0 - i * gap;
    if (u < 0) return null;
    const x = x0 + (x1 - x0) * hash(i, seed), w = size[0] + (size[1] - size[0]) * hash(i, seed + 1);
    const yEnd = floor === undefined ? H + 300 : floor - 40 * hash(i, seed + 2);
    const y = Math.min(yEnd, -200 + 2.2 * speed * u * u + 30 * u);
    const landed = y >= yEnd;
    return <Sprite key={i} k={"ch" + (i % 6)} cw={220} ch={180} draw={drawChunk(i % 6)} x={x} y={y} w={landed ? w * 1.15 : w} ay={0.7} rot={landed ? 0 : u * 0.2 * (hash(i, seed + 3) - 0.5)} />;
  })}</>
);
/** chunks flying up and out from a point (the blast) */
const Burst: React.FC<{ t: number; at: number; cx: number; cy: number; n?: number; seed?: number }> = ({ t, at, cx, cy, n = 14, seed = 3 }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const u = (t - at) / 30;
    if (u <= 0 || u > 1.6) return null;
    const a = -Math.PI / 2 + (hash(i, seed) - 0.5) * 2.4, sp = 500 + 700 * hash(i, seed + 1);
    return <Sprite key={i} k={"ch" + (i % 6)} cw={220} ch={180} draw={drawChunk(i % 6)} x={cx + Math.cos(a) * sp * u} y={cy + Math.sin(a) * sp * u + 900 * u * u} w={70 + 140 * hash(i, seed + 2) + 120 * u} ay={0.5} rot={u * 4 * (hash(i, seed + 4) - 0.5)} />;
  })}</>
);
/** sand cloud of the blast: puffs growing out of (cx, cy); k 0..1 */
const Cloud: React.FC<{ k: number; cx: number; cy: number; n?: number; col?: string }> = ({ k, cx, cy, n = 16, col = "rgba(222,200,160,0.95)" }) => (
  <>{k > 0 && Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + hash(i, 8), d = (120 + 520 * hash(i, 9)) * k, w = (300 + 500 * hash(i, 10)) * (0.4 + 0.9 * k);
    return <Sprite key={i} k={"puff" + col} cw={300} ch={300} draw={drawPuff(col)} x={cx + Math.cos(a) * d} y={cy + Math.sin(a) * d * 0.7 - 300 * k} w={w} ay={0.5} />;
  })}</>
);
const Gull: React.FC<{ f: number; x: number; y: number; w: number; i: number; flip?: boolean }> = ({ f, x, y, w, i, flip }) => {
  const fl = Math.round((0.5 + 0.5 * Math.sin(f * 0.35 + i)) * 4) / 4;
  return <Sprite k={"gull" + fl} cw={300} ch={240} draw={drawGull({ flap: fl })} x={x} y={y} w={w} ay={0.5} flip={flip} />;
};

// whale on the beach plate w01 (shot space): belly line and width
const WX = 540, WY = 1390, WW = 920;

// ---------------- 1: hook ----------------
export const Shot1: React.FC<S> = ({ t, f }) => {
  const press = L(1, "Wal") + 6, bang = L(1, "gesprengt"), rain = L(1, "regnete") - 14;
  const cam = withShake(camAt([{ t: 0, z: 1.0, x: 540, y: 1150 }, { t: 20, z: 1.12, x: 540, y: 1250, dur: 30 }], t, LEN(1), 0.02), shake(t, bang, 34, 22));
  cam.z += punch(t, bang);
  const boomK = clamp01((t - bang) / 10), cloudK = clamp01((t - bang) / 40);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w01_beach" />
        {[0, 1, 2].map((i) => <Gull key={i} f={f} i={i} x={200 + 300 * i + 30 * Math.sin(f / 20 + i)} y={420 + 60 * i} w={90} />)}
        <Shadow x={WX} y={WY} w={WW * 0.9} o={0.3} />
        <Sprite k={"wh" + (t >= bang + 6)} cw={1400} ch={620} draw={drawWhale({ gone: t >= bang + 6 ? 1 : 0, scorch: t >= bang + 6 ? 0.6 : 0 })} x={WX} y={WY} w={WW} />
        <Cloud k={cloudK} cx={WX} cy={WY - 120} />
        {t >= bang && t < bang + 18 && <Sprite k={"boom" + Math.round(boomK * 10)} cw={600} ch={600} draw={drawBoom(boomK)} x={WX} y={WY - 160} w={1100} ay={0.5} />}
        <Burst t={t} at={bang} cx={WX} cy={WY - 150} />
      </Layer>
      <Layer cam={cam} depth={1.2}>
        <Sprite k={"pl" + (t >= press)} cw={300} ch={380} draw={drawPlunger(t >= press ? 1 : 0)} x={230} y={1900} w={340} />
        <Rain t={t} t0={rain} n={10} gap={3} size={[160, 320]} speed={1.4} />
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 2: the whale on the beach, measured ----------------
export const Shot2: React.FC<S> = ({ t, f }) => {
  const tape = L(2, "vierzehn") - 34, u = clamp01((t - tape) / 32);
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1100 }, { t: L(2, "Pottwal") - 6, z: 1.08, x: 540, y: 1250, dur: 24 }], t, LEN(2), 0.03);
  cam.z += punch(t, L(2, "vierzehn"));
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w01_beach" />
        {[0, 1].map((i) => <Gull key={i} f={f} i={i} x={300 + 400 * i + 40 * Math.sin(f / 25 + i)} y={480 + 70 * i} w={80} flip={i === 1} />)}
      </Layer>
      <Layer cam={cam}>
        <Shadow x={WX} y={WY} w={WW * 0.9} o={0.3} />
        <Sprite k="wh0" cw={1400} ch={620} draw={drawWhale()} x={WX} y={WY} w={WW} />
        {t >= tape && <Sprite k={"tape" + Math.round(u * 20)} cw={1400} ch={200} draw={drawTape(u, "14 m")} x={WX} y={WY - 330} w={WW} ay={0.5} />}
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 3: it stinks, the gull faints ----------------
export const Shot3: React.FC<S> = ({ t, f }) => {
  const land = 20, faint = L(3, "fürchterlich") + 4;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1150 }], t, LEN(3), 0.05);
  cam.z += punch(t, L(3, "stinkt"));
  // the gull glides in from the top right onto the whale's back, sniffs, keels over
  const gu = clamp01(t / land), gx = 1150 - 520 * gu, gy = 300 + 560 * gu - 120 * Math.sin(Math.PI * gu);
  const pose = t < land ? "fly" : t < faint ? "stand" : "faint";
  const ph = (f % 30) / 30;
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.7}><Plate id="w01_beach" blur={6} over={1.3} /></Layer>
      <Layer cam={cam}>
        <Sprite k="whC" cw={1400} ch={620} draw={drawWhale()} x={760} y={1560} w={1900} />
        {[0, 1, 2].map((i) => <Sprite key={i} k={"st" + Math.round(((ph + i / 3) % 1) * 8)} cw={300} ch={420} draw={drawStink((ph + i / 3) % 1)} x={260 + 170 * i} y={1080 - 40 * i} w={220} />)}
        <Sprite k={"gs" + pose + (pose === "fly" ? Math.round((0.5 + 0.5 * Math.sin(f * 0.5)) * 4) : "")} cw={300} ch={240} draw={drawGull({ pose, flap: 0.5 + 0.5 * Math.sin(f * 0.5) })} x={gx} y={pose === "faint" ? gy + 30 : gy} w={520} ay={0.9} />
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 4: the highway office, the idea ----------------
const DESK4 = 1420;
export const Shot4: React.FC<S> = ({ t, f }) => {
  const george = L(4, "George"), idea = L(4, "Idee") - 2, dyn = L(4, "Dynamit") - 2;
  const cam = camAt([{ t: 0, z: 1.05, x: 540, y: 1180 }, { t: george - 4, z: 1.18, x: 540, y: 1160, dur: 20 }], t, LEN(4), 0.03);
  cam.z += punch(t, dyn + 2);
  const q: Pose = { expr: t >= idea ? "grin" : t >= george ? "smile" : "neutral", arms: t >= idea ? ["hang", "up"] : ["hang", "hang"], blink: blink(f, 2) };
  const pop = back((t - dyn) / 8);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w03_office" /></Layer>
      <Layer cam={cam}>
        <Guy n="th4" o={THORNTON} seed={21} q={q} x={540} y={1760} h={1150} shadow={false} />
        <Front id="w03_office" from={DESK4} />
        {t >= dyn && <Glow x={800} y={DESK4 - 120} r={220} color="#ffd060" o={0.5 * pop} />}
        {t >= dyn && <Sprite k="stick" cw={90} ch={320} draw={drawStick} x={800} y={DESK4 + 30} w={80 * pop} rot={0.12 * Math.sin(t / 3)} />}
      </Layer>
      <Grade tint="#ffc890" tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 5: the chalk plan ----------------
export const Shot5: React.FC<S> = ({ t }) => {
  const u = clamp01((t - 4) / (L(5, "aufessen") - 4));
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }, { t: L(5, "Möwen") - 6, z: 1.1, x: 560, y: 1000, dur: 22 }], t, LEN(5), 0.03);
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="w04_board" />
        <Sprite k={"chalkP" + Math.floor(u * 4 + 0.001)} cw={1000} ch={700} draw={drawChalk("plan", u)} x={540} y={900} w={900} ay={0.5} />
      </Layer>
      <Grade tint="#ffc890" tintO={0.05} />
    </AbsoluteFill>
  );
};

// ---------------- 6: the veteran warns ----------------
export const Shot6: React.FC<S> = ({ t, f }) => {
  const lift = L(6, "Zwanzig") - 8;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1250 }, { t: lift - 4, z: 1.2, x: 600, y: 1200, dur: 16 }], t, LEN(6), 0.03);
  cam.z += punch(t, lift + 8);
  const up = t >= lift, q: Pose = { expr: "stern", arms: up ? ["hang", "up"] : ["hip", "hang"], blink: blink(f, 3), look: -0.3 };
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w05_truck" /></Layer>
      <Layer cam={cam}>
        <Guy n="vet6" o={VET} seed={31} q={q} x={560} y={1820} h={1000} />
        {up && <Sprite k="stick" cw={90} ch={320} draw={drawStick} x={STICK.x} y={STICK.y} w={70} rot={0.15} />}
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};
/** the veteran's raised right hand (stout build, h = 1000 at x = 560): the stick sits in it */
const STICK = { x: 700, y: 1225 };

// ---------------- 7: twenty crates against the whale ----------------
export const Shot7: React.FC<S> = ({ t, f }) => {
  const c0 = L(7, "zwanzig") - 4, c1 = L(7, "halbe") - 4;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1250 }, { t: c1 - 6, z: 0.94, x: 540, y: 1200, dur: 16 }], t, LEN(7), 0.02);
  cam.z += punch(t, c0 + 4) + punch(t, c1 + 4);
  const slots: [number, number][] = [];
  for (let row = 0; row < 4; row++) for (let i = 0; i < 5 - Math.min(row, 4); i++) slots.push([110 + i * 160 + row * 80, 1700 - row * 140]);
  const shown = (i: number) => (i < 6 ? c0 + 3 * i : c1 + 2 * (i - 6));
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.7}><Plate id="w01_beach" blur={5} over={1.2} /></Layer>
      <Layer cam={cam}>
        <Sprite k="whC" cw={1400} ch={620} draw={drawWhale()} x={620} y={1560} w={1700} />
        {slots.map(([x, y], i) => {
          const u = t - shown(i);
          if (u < 0) return null;
          const yy = Math.min(y, y - 900 + 9 * u * u);
          return <Sprite key={i} k="crate" cw={420} ch={320} draw={drawCrate} x={x} y={yy} w={230} />;
        })}
        <Guy n="th7" o={THORNTON} seed={21} q={{ expr: "grin", arms: ["hip", "thumb"], blink: blink(f, 2) }} x={960} y={1880} h={760} />
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 8: on camera ----------------
export const Shot8: React.FC<S> = ({ t, f }) => {
  const thumb = L(8, "Ich") - 3;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1050 }], t, LEN(8), 0.05);
  cam.z += punch(t, L(8, "klappt"));
  const rec = Math.floor(f / 10) % 2 === 0;
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.7}><Plate id="w01_beach" blur={5} />
        <Sprite k="wh0" cw={1400} ch={620} draw={drawWhale()} x={380} y={1330} w={640} filter="blur(3px)" />
      </Layer>
      <Layer cam={cam}>
        <Guy n="th8" o={THORNTON} seed={21} q={{ expr: t >= thumb ? "grin" : "smile", arms: t >= thumb ? ["hip", "thumb"] : ["hip", "hang"], blink: blink(f, 2) }} x={700} y={1800} h={1050} />
      </Layer>
      <Layer cam={cam} depth={1.25}>
        <Sprite k="tvcam" cw={800} ch={600} draw={drawTVCam} x={180} y={1960} w={760} filter="blur(2px)" />
        {rec && <Glow x={-60 + 760 * (700 / 800)} y={1960 - 570 * (360 / 600)} r={40} color="#ff3020" o={0.8} />}
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 9 / 11: the crowd on the dunes ----------------
const CROWD = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 90 + i * 180, y: 1640 + 40 * (i % 2), h: 660 + 60 * hash(i, 3), o: crowd(i + 2) }));
const Crowd: React.FC<{ f: number; cheer: boolean; panic: boolean; woman?: "calm" | "point"; look?: number }> = ({ f, cheer, panic, woman, look = 0 }) => (
  <>{CROWD.map((c, i) => {
    if (woman && i === 3) {
      const q: Pose = { expr: "neutral", arms: woman === "point" ? ["hang", "point"] : ["hang", "hang"], look: woman === "point" ? 0.4 : 0, blink: blink(f, 9) };
      return <Guy key={i} n="woman" o={WOMAN} seed={45} q={q} x={c.x} y={c.y} h={c.h + 40} />;
    }
    const jump = cheer ? Math.abs(Math.sin((f + i * 5) / 4)) * 30 : 0;
    const q: Pose = panic ? { expr: "shock", arms: ["up", "up"], look: 0.3 } : cheer ? { expr: i % 2 ? "laugh" : "grin", arms: i % 2 ? ["up", "up"] : ["wave", "up"] } : { expr: "neutral", arms: ["hang", "hang"], look, blink: blink(f, i) };
    return <Guy key={i} n={"c" + i} o={c.o} seed={50 + i} q={q} x={c.x} y={c.y - jump} h={c.h} />;
  })}</>
);
export const Shot9: React.FC<S> = ({ t, f }) => {
  const sign = L(9, "vierhundert") - 3;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1150 }, { t: sign - 4, z: 1.06, x: 600, y: 1050, dur: 18 }], t, LEN(9), 0.03);
  cam.z += punch(t, sign + 3);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.8}><Plate id="w06_dunes" />
        <Sprite k="whTiny" cw={1400} ch={620} draw={drawWhale({ eye: "dot" })} x={330} y={1060} w={120} />
      </Layer>
      <Layer cam={cam}>
        <Crowd f={f} cheer={false} panic={false} look={-0.4} />
        {t >= sign && <Sprite k="sign400" cw={260} ch={520} draw={drawSign("400 m")} x={880} y={1500} w={240 * back((t - sign) / 8)} />}
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};
export const Shot11: React.FC<S> = ({ t, f }) => {
  const point = L(11, "Da") - 6, sky = L(11, "Da") + 2, panic = L(11, "Wal") + 4;
  const cam = camAt([{ t: 0, z: 1.05, x: 540, y: 1300 }, { t: point - 4, z: 1.1, x: 600, y: 1100, dur: 16 }], t, LEN(11), 0.03);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.8}><Plate id="w06_dunes" filter="saturate(1.1) brightness(1.05)" />
        <Rain t={t} t0={sky} n={9} gap={4} size={[60, 140]} speed={0.25} x0={150} x1={1000} seed={7} />
      </Layer>
      <Layer cam={cam}>
        <Crowd f={f} cheer={t < panic} panic={t >= panic} woman={t >= point ? "point" : "calm"} />
      </Layer>
      <Grade tint="#ffd090" tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 10: the blast ----------------
export const Shot10: React.FC<S> = ({ t, f }) => {
  const bang = L(10, "knallt") - 2, wolke = L(10, "Wolke");
  const cam = withShake(camAt([{ t: 0, z: 1.1, x: 540, y: 1250 }, { t: bang + 4, z: 1.0, x: 540, y: 1150, dur: 30 }], t, LEN(10), 0.02), shake(t, bang, 40, 30));
  const boomK = clamp01((t - bang) / 12), cloudK = clamp01((t - bang) / (wolke - bang + 10));
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w01_beach" />
        <Shadow x={WX} y={WY} w={WW * 0.9} o={0.3} />
        <Sprite k={"wh" + (t >= bang + 4)} cw={1400} ch={620} draw={drawWhale({ gone: t >= bang + 4 ? 1 : 0, scorch: t >= bang + 4 ? 0.6 : 0 })} x={WX} y={WY} w={WW} />
        <Burst t={t} at={bang} cx={WX} cy={WY - 150} n={22} seed={11} />
        <Cloud k={cloudK} cx={WX} cy={WY - 100} n={22} />
        {t >= bang && t < bang + 20 && <Sprite k={"boom" + Math.round(boomK * 10)} cw={600} ch={600} draw={drawBoom(boomK)} x={WX} y={WY - 180} w={1300} ay={0.5} />}
      </Layer>
      {/* by "Wolke" the cloud fills the frame */}
      <AbsoluteFill style={{ background: "rgba(222,200,160,1)", opacity: clamp01((t - wolke + 6) / 14) * 0.85 }} />
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 12: blubber rain on the parking lot ----------------
export const Shot12: React.FC<S> = ({ t, f }) => {
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1100 }, { t: L(12, "Parkplatz") - 6, z: 1.08, x: 540, y: 1250, dur: 16 }], t, LEN(12), 0.03);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w07_parking" /></Layer>
      <Layer cam={cam}>
        {[0, 1, 2, 3].map((i) => {
          const dir = i % 2 ? -1 : 1, x = (dir > 0 ? -150 : 1230) + dir * (14 + 3 * i) * (t + 8 * i), y = 1600 + 90 * i, h = 560 + 40 * i;
          return <Sprite key={i} k={"run" + i + Math.floor((t * 0.12 + i * 0.3) % 1 * 8)} cw={600} ch={1000}
            draw={(p) => bodySide(p, crowd(i + 4), { mode: "march", phase: ((t * 0.12 + i * 0.3) % 1), expr: "shock", stride: 1.4, light: LIGHT, seed: 60 + i })}
            x={x} y={y} w={h * 0.6} flip={dir < 0} />;
        })}
        <Rain t={t} t0={0} n={16} gap={3} floor={1880} size={[90, 200]} speed={1.2} seed={13} />
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 13 / 19: the new car ----------------
const CAR = { x: 540, y: 1560, w: 880 };
const Car: React.FC<{ crush: number; chunk: number }> = ({ crush, chunk }) => (
  <>
    <Shadow x={CAR.x} y={CAR.y} w={CAR.w * 0.95} o={0.4} />
    <Sprite k={"car" + crush.toFixed(2)} cw={1000} ch={380} draw={drawCar({ crush, bow: crush < 0.5 })} x={CAR.x} y={CAR.y} w={CAR.w} />
    {chunk > -1 && <Sprite k="bigchunk" cw={220} ch={180} draw={drawChunk(2)} x={CAR.x + 20} y={chunk} w={520} ay={0.85} />}
  </>
);
export const Shot13: React.FC<S> = ({ t, f }) => {
  const hit = L(13, "zertrümmert") - 2, roofY = CAR.y - (CAR.w / 1000) * (380 - 70) + 40, crushedRoof = CAR.y - (CAR.w / 1000) * (380 - 190) + 50;
  const cam = withShake(camAt([{ t: 0, z: 1.12, x: 540, y: 1450 }], t, LEN(13), 0.04), shake(t, hit, 36, 16));
  cam.z += punch(t, hit + 2);
  const fall = t < hit ? -300 + (roofY + 300) * clamp01((t - (hit - 12)) / 12) ** 2 : crushedRoof;
  const crush = clamp01((t - hit) / 3);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w07_parking" /></Layer>
      <Layer cam={cam}>
        <Car crush={crush} chunk={t >= hit - 12 ? fall : -1} />
        {t >= hit && t < hit + 14 && <Sprite k={"boomC" + Math.round(clamp01((t - hit) / 14) * 8)} cw={600} ch={600} draw={drawBoom(clamp01((t - hit) / 14))} x={CAR.x} y={crushedRoof} w={700} ay={0.5} opacity={0.85} />}
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};
export const Shot19: React.FC<S> = ({ t, f }) => {
  const walk = L(19, "Mann") - 26, stop = L(19, "Mann") - 2, end = L(19, "hatte");
  const crushedRoof = CAR.y - (CAR.w / 1000) * (380 - 190) + 50;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1400 }, { t: walk, z: 1.08, x: 640, y: 1300, dur: 26 }], t, LEN(19), 0.02);
  cam.z += punch(t, end);
  const u = clamp01((t - walk) / (stop - walk)), x = 1300 - 420 * u, walking = t >= walk && t < stop;
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w07_parking" /></Layer>
      <Layer cam={cam}>
        <Car crush={1} chunk={crushedRoof} />
        {t >= walk && (walking
          ? <Sprite k={"vetw" + Math.floor(((t * 0.06) % 1) * 8)} cw={600} ch={1000} draw={(p) => bodySide(p, VET, { mode: "march", phase: (t * 0.06) % 1, expr: "neutral", light: LIGHT, seed: 31 })} x={x} y={1880} w={600} flip />
          : <>
            <Guy n="vet19" o={VET} seed={31} q={{ expr: t >= end - 4 ? "stern" : "neutral", arms: ["hang", "up"], look: -0.5, blink: blink(f, 3) }} x={880} y={1855} h={1000} />
            <Sprite k="stick" cw={90} ch={320} draw={drawStick} x={880 + STICK.x - 560} y={1855 - 1820 + STICK.y} w={70} rot={0.15} />
          </>)}
      </Layer>
      <Grade tint={DAY} tintO={0.06} />
    </AbsoluteFill>
  );
};

// ---------------- 14 / 17: the beach at dusk ----------------
export const Shot14: React.FC<S> = ({ t, f }) => {
  const q = L(14, "Wal") - 2;
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1150 }, { t: q - 8, z: 1.15, x: 540, y: 1280, dur: 22 }], t, LEN(14), 0.03);
  cam.z += punch(t, q + 2);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w02_beach_dusk" /></Layer>
      <Layer cam={cam}>
        <Shadow x={WX} y={WY} w={WW * 0.9} o={0.4} />
        <Sprite k="whGone" cw={1400} ch={620} draw={drawWhale({ gone: 1, scorch: 0.6 })} x={WX} y={WY} w={WW} />
        {[0, 1, 2, 3].map((i) => { const u = ((t + i * 18) % 72) / 72; return <Sprite key={i} k="smk" cw={300} ch={300} draw={drawPuff("rgba(70,60,70,0.45)")} x={WX - 100 + 80 * i + 60 * u} y={WY - 250 - 500 * u} w={220 + 300 * u} ay={0.5} opacity={1 - u} />; })}
        {t >= q && <Sprite k="qmark" cw={260} ch={520} draw={(p) => { const g = p.g; g.font = "bold 420px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.lineWidth = 22; g.strokeStyle = "#241726"; g.strokeText("?", 130, 440); g.fillStyle = "#ffffff"; g.fillText("?", 130, 440); }} x={WX + 260} y={WY - 380} w={200 * back((t - q) / 8)} />}
      </Layer>
      <Grade tint={DUSK} tintO={0.1} />
    </AbsoluteFill>
  );
};
export const Shot17: React.FC<S> = ({ t, f }) => {
  const turn = L(17, "Möwen") + 10, bury = L(17, "vergraben");
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 1100 }, { t: L(17, "Rest") - 6, z: 1.1, x: 600, y: 1300, dur: 20 }], t, LEN(17), 0.02);
  const dz = clamp01((t - 20) / (bury - 20)), mound = clamp01((t - bury + 14) / 14);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w02_beach_dusk" /></Layer>
      <Layer cam={cam}>
        {mound < 1 && <Sprite k="whGone" cw={1400} ch={620} draw={drawWhale({ gone: 1, scorch: 0.6 })} x={WX} y={WY} w={WW * 0.9} opacity={1 - mound} />}
        {mound > 0 && <Sprite k="mound" cw={600} ch={240} draw={drawMound} x={WX} y={WY + 20} w={WW * mound} />}
        <Sprite k={"dz" + (t >= bury - 6)} cw={700} ch={420} draw={drawDozer(t >= bury - 6 ? 1 : 0)} x={1300 - 600 * dz} y={WY + 40} w={520} flip />
        <Sprite k={"gst"} cw={300} ch={240} draw={drawGull({ pose: "stand" })} x={180} y={1720} w={220} flip={t >= turn} />
      </Layer>
      <Grade tint={DUSK} tintO={0.12} />
    </AbsoluteFill>
  );
};

// ---------------- 15: the truth on the board, night ----------------
export const Shot15: React.FC<S> = ({ t }) => {
  const u = clamp01((t - 4) / (L(15, "schnell") - 4));
  const cam = camAt([{ t: 0, z: 1.0, x: 540, y: 960 }, { t: L(15, "nicht") - 6, z: 1.1, x: 540, y: 1000, dur: 22 }], t, LEN(15), 0.03);
  cam.z += punch(t, L(15, "schnell"));
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="w04_board" filter="brightness(0.75)" />
        <Sprite k={"chalkT" + Math.floor(u * 4 + 0.001)} cw={1000} ch={700} draw={drawChalk("truth", u)} x={620} y={900} w={900} ay={0.5} />
      </Layer>
      <Grade tint={NIGHT} tintO={0.14} />
    </AbsoluteFill>
  );
};

// ---------------- 16: the egg in the microwave ----------------
const MW = { x: 462, y: 1141, w: 320 }; // the microwave's door window in w08_kitchen (shot space)
export const Shot16: React.FC<S> = ({ t, f }) => {
  const pop = L(16, "platzt") - 2, wide = L(16, "überall") - 14;
  const cam = camAt([{ t: 0, z: 1.6, x: MW.x, y: MW.y }, { t: wide, z: 1.0, x: 540, y: 1100, dur: 18 }], t, LEN(16), 0.03);
  cam.z += punch(t, pop + 2);
  const k = clamp01((t - pop) / 8), spill = clamp01((t - wide) / 16), wob = t < pop ? 4 * Math.sin(t * 1.3) * clamp01((t - pop + 20) / 20) : 0;
  return (
    <AbsoluteFill>
      <Layer cam={cam}><Plate id="w08_kitchen" />
        <Glow x={MW.x} y={MW.y} r={MW.w * 0.7} color="#ffd890" o={t < pop ? 0.35 : 0.15} />
        <Sprite k={"egg" + Math.round(k * 8)} cw={700} ch={420} draw={drawEggSplat(k)} x={MW.x + wob} y={MW.y} w={MW.w} ay={0.5} />
        {spill > 0 && Array.from({ length: 12 }, (_, i) => {
          const a = hash(i, 5) * Math.PI * 2, d = (300 + 300 * hash(i, 6)) * back(spill);
          return <Sprite key={i} k={"spl" + (i % 3)} cw={700} ch={420} draw={drawEggSplat(1)} x={MW.x + Math.cos(a) * d} y={MW.y + Math.sin(a) * d * 0.9} w={120 + 90 * hash(i, 7)} ay={0.5} rot={a} />;
        })}
      </Layer>
      <Grade tint={NIGHT} tintO={0.1} />
    </AbsoluteFill>
  );
};

// ---------------- 18: the newspaper ----------------
export const Shot18: React.FC<S> = ({ t }) => {
  const land = 14, es = L(18, "Es") - 6;
  const cam = camAt([{ t: 0, z: 1.15, x: 500, y: 1150 }, { t: es, z: 1.35, x: 540, y: 1000, dur: 20 }], t, LEN(18), 0.02);
  const u = clamp01(t / land);
  return (
    <AbsoluteFill>
      <Layer cam={cam} depth={0.85}><Plate id="w09_newsroom" /></Layer>
      <Layer cam={cam}>
        <Shadow x={540} y={1650} w={620} o={0.3 * u} />
        <Sprite k="paper" cw={700} ch={900} draw={drawPaper} x={540} y={1250 - 1400 * (1 - back(u, 1.2))} w={680} ay={0.5} rot={-0.05 + 0.3 * (1 - u)} />
      </Layer>
      <Grade tint="#ffc070" tintO={0.08} />
    </AbsoluteFill>
  );
};

export const SCENES: Record<number, React.FC<S>> = {
  1: Shot1, 2: Shot2, 3: Shot3, 4: Shot4, 5: Shot5, 6: Shot6, 7: Shot7, 8: Shot8, 9: Shot9, 10: Shot10,
  11: Shot11, 12: Shot12, 13: Shot13, 14: Shot14, 15: Shot15, 16: Shot16, 17: Shot17, 18: Shot18, 19: Shot19,
};
