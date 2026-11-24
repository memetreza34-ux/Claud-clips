// Cast of the bat short, our own designs drawn with the engine's Pen (600 x 1000 design space, soles at y = 975):
// - Lytle: small, stout dentist. Bald crown with two side tufts, big round glasses, brush moustache, pale blue dentist
//   coat with a dental mirror in the breast pocket.
// - Bats: round plum body, big pointed ears, half-open lids, two little fangs; the hero bat wears a green helmet and
//   carries a red firebomb on a strap. Faces screen-left/right via `facing`.
import { Pen, bodyFront, headBlob, FrontOpts, Outfit, INK, SKIN, shade, mix } from "../pigeon/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const ell = (cx: number, cy: number, rx: number, ry: number, n = 40): P2[] =>
  Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as P2; });

// ---------------- Lytle ----------------
export const LYTLE: Outfit = { jacket: "#bfe0f2", pants: "#46506a", boots: "#3a2a22", hat: null, buttons: "#ffffff", skin: "#f6cfa8", build: "stout" };
const LYTLE_SEED = 11;
const HAIR = "#5a3a26";

/** head centre and unit as bodyFront places them for a standing/strolling stout adult */
const lytleHead = (o: FrontOpts) => {
  // same placement as bodyFront for the stout build (a 118, torso 1.15, legs 1.32), standing, strolling or sitting
  const facing = o.facing ?? 0, H = headBlob(LYTLE_SEED, 118, facing), HH = 2 * H.b, u = (2 * H.a) / 100;
  const tall = (1 + 1.15 + 1.32) * HH, bob = o.mode === "stroll" ? 0.015 * tall * Math.cos(4 * Math.PI * (o.phase ?? 0)) : 0;
  const torsoBot = o.mode === "sit" ? 975 - 0.2 * HH : 975 - 1.32 * HH + bob;
  return { H, HH, u, facing, hc: torsoBot - 1.15 * HH - H.b, fx: 300 + 7 * u * facing };
};

export const drawLytle = (p: Pen, o: FrontOpts & { mirror?: boolean }) => {
  bodyFront(p, LYTLE, { ...o, seed: LYTLE_SEED, mode: o.mode ?? "stand" });
  const { H, u, hc, fx } = lytleHead(o);
  p.rot = null;
  // side tufts over the ears, bald shiny crown
  for (const s of [-1, 1]) {
    const x = 300 + s * H.a * 0.86, y = hc - H.b * 0.12;
    p.poly([[x - s * 4 * u, y - 16 * u], [x + s * 9 * u, y - 10 * u], [x + s * 11 * u, y + 8 * u], [x + s * 2 * u, y + 16 * u], [x - s * 6 * u, y + 4 * u]], HAIR, 2.4 * u);
  }
  p.ell(300 - 14 * u, hc - H.b * 0.62, 12 * u, 5 * u, "rgba(255,255,255,0.45)", 0);
  // round glasses (bigger than Fred's, with a dark rim)
  for (const s of [-1, 1]) p.ell(fx + s * 14 * u, hc, 12.5 * u, 12 * u, "rgba(210,235,255,0.22)", 3 * u);
  p.stroke([[fx - 2 * u, hc - 2 * u], [fx + 2 * u, hc - 2 * u]], 3 * u);
  for (const s of [-1, 1]) p.stroke([[fx + s * 26 * u, hc - 2 * u], [300 + s * H.a * 0.95, hc - 6 * u]], 2.6 * u);
  // dental mirror in the breast pocket (wearer's left = screen right)
  if (o.mirror !== false) {
    const px = 300 + 20 * u, py = hc + H.b + 0.55 * H.b * 2;
    p.band([[px, py + 14 * u], [px + 3 * u, py - 14 * u]], "#b8bec6", 2.4 * u, 1.4 * u);
    p.ell(px + 4 * u, py - 19 * u, 5.5 * u, 5.5 * u, "#e8f4ff", 1.8 * u);
  }
};

// ---------------- bats ----------------
export type BatLook = "sleep" | "awake" | "smug" | "shock";
export type BatOpts = { look?: BatLook; flap?: number; hero?: boolean; bomb?: boolean; blink?: boolean; facing?: number; light?: number; gaze?: number };
const FUR = "#5b4470", FUR_D = "#3a2a4e", WING = "#4a375e", WING_D = "#33254a", EAR_IN = "#c98aa8";

/** a bat in the 600 x 1000 space: body centre (300, 700), ~260 units wide body; flap 0 folded .. 1 wide open */
export const drawBat = (p: Pen, o: BatOpts) => {
  const { look = "awake", flap = 0.4, hero = false, bomb = false, blink = false, facing = 0, light = rad(-120), gaze = 0 } = o;
  const cx = 300 + facing * 6, cy = 700, ol = 9;
  p.rot = null;
  // wings: membrane with three finger bones each
  for (const s of [-1, 1]) {
    const up = -60 - flap * 130, out = 170 + flap * 90;
    const tip: P2 = [cx + s * out, cy + up], mid: P2 = [cx + s * out * 0.62, cy + up + 70], low: P2 = [cx + s * out * 0.36, cy + 60];
    const pts: P2[] = [[cx + s * 70, cy - 30], [cx + s * out * 0.55, cy + up - 50], tip, [cx + s * out * 0.82, cy + up + 60], mid, [cx + s * out * 0.5, cy + up + 120], low, [cx + s * 60, cy + 50]];
    p.gradFill(pts, WING, WING_D, light, 0.3); p.poly(pts, null, ol);
    for (const q of [tip, mid, low]) p.stroke([[cx + s * 64, cy - 24], q], 4.5, shade(WING_D, 0.8));
  }
  // ears
  for (const s of [-1, 1]) {
    const e: P2[] = [[cx + s * 60, cy - 70], [cx + s * 108, cy - 230], [cx + s * 18, cy - 112]];
    p.poly(e, FUR, ol);
    p.poly([[cx + s * 62, cy - 92], [cx + s * 96, cy - 196], [cx + s * 34, cy - 118]], EAR_IN, 0);
  }
  // body
  const body = ell(cx, cy, 130, 138, 56);
  p.shadedFill(body, FUR, FUR_D, light, 135);
  p.ell(cx, cy + 58, 74, 60, mix(FUR, FUR_D, 0.5), 0);
  p.poly(body, null, ol);
  // eyes
  const ex = (s: number) => cx + s * 46 + gaze * 10, ey = cy - 26;
  if (look === "sleep" || blink) {
    for (const s of [-1, 1]) p.arc(ex(s), ey, 26, 14, 20, 160, 9);
  } else {
    const big = look === "shock";
    for (const s of [-1, 1]) {
      p.ell(ex(s), ey, big ? 34 : 30, big ? 42 : 34, "#fff6c8", 6);
      p.dot(ex(s) + gaze * 8, ey + 4, big ? 9 : 13);
      if (look === "awake") p.poly([[ex(s) - 32, ey - 40], [ex(s) + 32, ey - 40], [ex(s) + 32, ey - 14], [ex(s) - 32, ey - 14]], FUR, 0); // heavy lids
      if (look === "awake") p.stroke([[ex(s) - 30, ey - 14], [ex(s) + 30, ey - 14]], 7);
      if (look === "smug") p.stroke([[ex(s) - s * 34, ey - 52], [ex(s) + s * 8, ey - 36]], 10);
    }
  }
  // mouth + fangs
  if (look === "shock") p.ell(cx + gaze * 6, cy + 46, 20, 24, "#2a1830", 6);
  else p.arc(cx + gaze * 6 + (look === "smug" ? 8 : 0), cy + 30, 30, 18, 20, 160, 8);
  for (const s of [-1, 1]) p.poly([[cx + s * 14, cy + 44], [cx + s * 8, cy + 66], [cx + s * 2, cy + 46]], "#ffffff", 3);
  if (hero) {
    const helm: P2[] = [[cx - 112, cy - 92], ...Array.from({ length: 13 }, (_, i) => { const a = rad(200 + (i * 140) / 12); return [cx + 118 * Math.cos(a), cy - 70 + 96 * Math.sin(a)] as P2; }), [cx + 112, cy - 92]];
    p.gradFill(helm, "#6f9440", "#4a6a2a", light, 0.3); p.poly(helm, null, ol);
    p.poly([[cx - 124, cy - 102], [cx + 124, cy - 102], [cx + 124, cy - 80], [cx - 124, cy - 80]], "#557330", 6);
  }
  if (bomb) {
    p.band([[cx - 116, cy + 96], [cx - 40, cy + 120], [cx + 40, cy + 120], [cx + 116, cy + 96]], "#8a6a3a", 14, 4);
    const b: P2[] = [[cx - 40, cy + 100], [cx + 40, cy + 100], [cx + 44, cy + 210], [cx, cy + 236], [cx - 44, cy + 210]];
    p.gradFill(b, "#e0402e", "#9a2418", light, 0.3); p.poly(b, null, ol);
    p.poly([[cx - 42, cy + 130], [cx + 42, cy + 130], [cx + 43, cy + 146], [cx - 43, cy + 146]], "#f5d04a", 4);
    p.stroke([[cx, cy + 236], [cx + 10, cy + 262], [cx - 4, cy + 284]], 6);
  }
};

export { INK, SKIN };
