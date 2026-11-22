// The 19 shots of "Der explodierende Wal" on Google Flow keyframes (Nano Banana, public/whale_flow/sNN.jpg, the look of
// 2D cartoon people in a lit 3D toon world): one still per shot (two where something changes on a word), moved by our
// camera (glide, ease-out push on the named thing, creep on holds, shake on impacts) with our own 2D effects on top.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Layer, Sprite, Grade, camAt, punch, clamp01, back, CamKey, W, H } from "../batsp/kit";
import { beat, SHOTS } from "./timing";
import { drawChunk, drawBoom, drawPuff } from "./draw";

type S = { t: number; f: number };
const A = (id: number) => SHOTS[id - 1].a, LEN = (id: number) => SHOTS[id - 1].b - SHOTS[id - 1].a;
const L = (id: number, w: string) => beat(id, w) - A(id);
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

/** a Flow still filling the 1080 x 1920 shot, a little oversized so pans never show an edge */
const Still: React.FC<{ n: string; over?: number; filter?: string }> = ({ n, over = 1.08, filter }) => (
  <Img src={staticFile(`whale_flow/${n}.jpg`)} style={{ position: "absolute", left: (W - W * over) / 2, top: (H - H * over) / 2, width: W * over, height: H * over, objectFit: "cover", filter }} />
);
const shake = (t: number, at: number, amp = 30, len = 18) => {
  if (t < at || t > at + len) return { x: 0, y: 0 };
  const k = 1 - (t - at) / len;
  return { x: amp * k * Math.sin(t * 2.9), y: amp * k * Math.cos(t * 3.7) };
};

/** blubber chunks falling through the frame toward the camera */
const Rain: React.FC<{ t: number; t0: number; n: number; gap?: number; size?: [number, number]; speed?: number; seed?: number }> = ({ t, t0, n, gap = 3, size = [110, 260], speed = 1, seed = 1 }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const u = t - t0 - i * gap;
    if (u < 0) return null;
    const y = -250 + 2.2 * speed * u * u + 30 * u;
    if (y > H + 300) return null;
    const w = size[0] + (size[1] - size[0]) * hash(i, seed + 1);
    return <Sprite key={i} k={"ch" + (i % 6)} cw={220} ch={180} draw={drawChunk(i % 6)} x={60 + 960 * hash(i, seed)} y={y} w={w} ay={0.7} rot={u * 0.15 * (hash(i, seed + 3) - 0.5)} />;
  })}</>
);
const Boom: React.FC<{ t: number; at: number; x: number; y: number; w: number; len?: number }> = ({ t, at, x, y, w, len = 16 }) => {
  if (t < at || t >= at + len) return null;
  const k = clamp01((t - at) / len);
  return <Sprite k={"boom" + Math.round(k * 10)} cw={600} ch={600} draw={drawBoom(k)} x={x} y={y} w={w} ay={0.5} opacity={1 - 0.6 * k} />;
};
const Smoke: React.FC<{ t: number; x: number; y: number }> = ({ t, x, y }) => (
  <>{[0, 1, 2, 3].map((i) => { const u = ((t + i * 18) % 72) / 72; return <Sprite key={i} k="smk" cw={300} ch={300} draw={drawPuff("rgba(70,60,70,0.4)")} x={x - 80 + 60 * i + 50 * u} y={y - 450 * u} w={200 + 260 * u} ay={0.5} opacity={1 - u} />; })}</>
);

type Spec = {
  /** still(s): name, or [name, from local frame] switches */
  img: string | [string, number][];
  keys: CamKey[]; creep?: number; punches?: string[]; shakeAt?: string; tint?: string; tintO?: number;
  fx?: (t: number, f: number) => React.ReactNode;
};
const imgAt = (img: Spec["img"], t: number) => (typeof img === "string" ? img : img.reduce((cur, [n, from]) => (t >= from ? n : cur), img[0][0]));

const make = (id: number, sp: () => Spec): React.FC<S> => ({ t, f }) => {
  const s = sp();
  const cam = camAt(s.keys, t, LEN(id), s.creep ?? 0.04);
  for (const w of s.punches ?? []) cam.z += punch(t, L(id, w));
  const sh = s.shakeAt ? shake(t, L(id, s.shakeAt) - 2) : { x: 0, y: 0 };
  const c = { ...cam, x: cam.x + sh.x, y: cam.y + sh.y };
  return (
    <AbsoluteFill>
      <Layer cam={c}><Still n={imgAt(s.img, t)} /></Layer>
      {s.fx && <Layer cam={c} depth={1.15}>{s.fx(t, f)}</Layer>}
      <Grade tint={s.tint ?? "#ffb070"} tintO={s.tintO ?? 0.05} vig={0.4} />
    </AbsoluteFill>
  );
};
const K = (t: number, z: number, x: number, y: number, dur?: number): CamKey => ({ t, z, x, y, dur });

export const SCENES: Record<number, React.FC<S>> = {
  // hook: the blast, chunks fly at the camera on "regnete"
  1: make(1, () => ({ img: "s01", keys: [K(0, 1.2, 540, 1100), K(L(1, "gesprengt") - 4, 1.0, 540, 960, 14)], punches: ["Wal"], shakeAt: "gesprengt",
    fx: (t) => <><Boom t={t} at={L(1, "gesprengt") - 2} x={540} y={900} w={900} /><Rain t={t} t0={L(1, "regnete") - 14} n={10} size={[160, 320]} speed={1.4} /></> })),
  2: make(2, () => ({ img: "s02", keys: [K(0, 1.25, 540, 1100), K(L(2, "vierzehn") - 8, 1.0, 540, 960, 18)], punches: ["Pottwal"] })),
  3: make(3, () => ({ img: "s03", keys: [K(0, 1.0, 540, 960), K(L(3, "fürchterlich") - 4, 1.25, 560, 800, 10)], punches: ["stinkt"] })),
  4: make(4, () => ({ img: "s04", keys: [K(0, 1.0, 540, 1000), K(L(4, "Dynamit") - 6, 1.25, 540, 860, 10)], punches: ["George"] })),
  5: make(5, () => ({ img: "s05", keys: [K(0, 1.15, 380, 800), K(L(5, "Stücke") - 6, 1.15, 640, 900, 22), K(L(5, "Möwen") - 4, 1.2, 600, 1150, 18)] })),
  6: make(6, () => ({ img: "s06", keys: [K(0, 1.0, 540, 1000), K(L(6, "Zwanzig") - 6, 1.3, 560, 900, 10)], punches: ["Militär"] })),
  7: make(7, () => ({ img: "s07", keys: [K(0, 1.3, 540, 1250), K(L(7, "zwanzig") - 4, 1.05, 540, 1000, 12), K(L(7, "halbe") - 4, 1.0, 540, 960, 12)], punches: ["zwanzig", "halbe"] })),
  8: make(8, () => ({ img: "s08", keys: [K(0, 1.05, 600, 1000), K(L(8, "Ich") - 4, 1.25, 640, 900, 10)], punches: ["klappt"] })),
  9: make(9, () => ({ img: "s09", keys: [K(0, 1.25, 540, 1200), K(L(9, "vierhundert") - 6, 1.05, 560, 900, 14)], punches: ["vierhundert"], tint: "#9fb8d8", tintO: 0.04 })),
  // the blast: hard cut in, flash (Whale.tsx), shake, the cloud grows
  10: make(10, () => ({ img: "s10", keys: [K(0, 1.3, 540, 1000), K(4, 1.0, 540, 960, 30)], shakeAt: "knallt",
    fx: (t) => <Boom t={t} at={L(10, "knallt") - 2} x={540} y={1000} w={1300} len={20} /> })),
  11: make(11, () => ({ img: "s11", keys: [K(0, 1.0, 540, 1100), K(L(11, "Da") - 6, 1.2, 600, 900, 14)], punches: ["Da"],
    fx: (t) => <Rain t={t} t0={L(11, "Wal") - 4} n={6} size={[120, 220]} speed={0.8} seed={5} /> })),
  12: make(12, () => ({ img: "s12", keys: [K(0, 1.15, 540, 900), K(L(12, "Parkplatz") - 6, 1.0, 540, 1050, 14)],
    fx: (t) => <Rain t={t} t0={0} n={14} gap={3} size={[100, 220]} speed={1.2} seed={9} /> })),
  // the car: whole until "zertrümmert", then the crushed still, shake and a boom
  13: make(13, () => ({ img: [["s13", 0], ["s14", L(13, "zertrümmert") - 2]], keys: [K(0, 1.1, 540, 1100), K(L(13, "nagelneues") - 4, 1.2, 540, 1150, 10)],
    punches: ["zertrümmert"], shakeAt: "zertrümmert", fx: (t) => <Boom t={t} at={L(13, "zertrümmert") - 2} x={540} y={1000} w={700} /> })),
  14: make(14, () => ({ img: "s15", keys: [K(0, 1.0, 540, 960), K(L(14, "Wal") - 6, 1.2, 540, 1050, 14)], punches: ["Wal"], tint: "#ff8a50", tintO: 0.06,
    fx: (t) => <Smoke t={t} x={540} y={1100} /> })),
  15: make(15, () => ({ img: "s16", keys: [K(0, 1.15, 400, 800), K(L(15, "nicht") - 6, 1.15, 680, 850, 20), K(L(15, "schnell") - 6, 1.2, 560, 1150, 14)], tint: "#4060c0", tintO: 0.08 })),
  16: make(16, () => ({ img: "s17", keys: [K(0, 1.5, 540, 1000), K(L(16, "überall") - 14, 1.0, 540, 960, 16)], punches: ["platzt"], shakeAt: "platzt", tint: "#4060c0", tintO: 0.06 })),
  17: make(17, () => ({ img: "s18", keys: [K(0, 1.2, 380, 1200), K(L(17, "Rest") - 6, 1.05, 600, 1000, 22)], punches: ["vergraben"], tint: "#ff8a50", tintO: 0.06 })),
  18: make(18, () => ({ img: "s19", keys: [K(0, 1.0, 540, 1000), K(L(18, "Es") - 6, 1.4, 540, 820, 14)] })),
  19: make(19, () => ({ img: "s20", keys: [K(0, 1.0, 540, 1000), K(L(19, "Mann") - 6, 1.3, 760, 950, 12)], punches: ["hatte"] })),
};
