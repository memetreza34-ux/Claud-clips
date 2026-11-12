// Pigeon-short cast drawn with the template's Pen: Fred (bodyFront with a lab coat + glasses) and the three pigeons
// (own side-view drawing, facing screen-right, 600 x 1000 design space with the feet at y = 975), plus small effects.
import { Pen, bodyFront, headBlob, mul, mix, shade, INK, SKIN, Outfit, FrontOpts, Expr } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const rot = (q: P2, a: number, c: P2): P2 => [c[0] + (q[0] - c[0]) * Math.cos(a) - (q[1] - c[1]) * Math.sin(a), c[1] + (q[0] - c[0]) * Math.sin(a) + (q[1] - c[1]) * Math.cos(a)];
const ell = (cx: number, cy: number, rx: number, ry: number, deg = 0, n = 40): P2[] =>
  Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2, x = rx * Math.cos(t), y = ry * Math.sin(t), r = rad(deg); return [cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)] as P2; });

// ---------------- Fred ----------------
export const FRED: Outfit = { jacket: "#f1efe8", pants: "#4a4f5e", boots: "#3a2a22", hat: "hair", hair: "#5b4a3c", buttons: "#c9ccd2", skin: SKIN };
const FRED_SEED = 3;

/** Fred standing (front view) with round glasses drawn over the eyes */
export const drawFred = (p: Pen, o: FrontOpts) => {
  const facing = o.facing ?? 0, seed = FRED_SEED;
  const mode = o.mode ?? "stand";
  bodyFront(p, FRED, { ...o, seed, mode });
  // head centre exactly as bodyFront places it for an adult (standing, or strolling with its 1.5 % body bob)
  const H = headBlob(seed, 118, facing), HH = 2 * H.b, u = (2 * H.a) / 100;
  const bob = mode === "stroll" ? 0.015 * (1 + 1.1 + 1.4) * HH * Math.cos(4 * Math.PI * (o.phase ?? 0)) : 0;
  const hc = 975 - 1.4 * HH - 1.1 * HH - H.b + bob;
  const fx = 300 + 7 * u * facing;
  p.rot = null;
  for (const s of [-1, 1]) p.ell(fx + s * 13 * u, hc, 10.5 * u, 9.5 * u, null, 2.6 * u);
  p.stroke([[fx - 2.5 * u, hc - 2 * u], [fx + 2.5 * u, hc - 2 * u]], 2.6 * u);
};

// ---------------- pigeons ----------------
export type PigeonLook = "neutral" | "happy" | "sulk" | "focus" | "shock";
export type PigeonOpts = { peck?: number; look?: PigeonLook; cap?: boolean; scarf?: boolean; tuft?: boolean; light?: number; nod?: number };
const BODY = "#a3aec0", WING = "#8691a8", BAR = "#3f465a", NECK = "#6f9c87", NECK2 = "#8c74a6", HEAD = "#a9b4c6", LEG = "#d9707a", BEAK = "#3a3236";

/** side-view cartoon pigeon facing screen-right. peck 0 (head up) .. 1 (beak down at the target), nod = small head bob */
export const drawPigeon = (p: Pen, o: PigeonOpts) => {
  const peck = Math.max(0, Math.min(1, o.peck ?? 0)), look = o.look ?? "neutral", light = o.light ?? rad(-120), nod = o.nod ?? 0;
  const ow = 9;
  p.ol = ow; p.rot = null;
  // legs + toes
  for (const [hx, fx] of [[300, 292], [338, 344]] as const) {
    p.stroke([[hx, 850], [fx, 968]], 14 + 2 * ow, INK); p.stroke([[hx, 850], [fx, 968]], 14, LEG);
    p.stroke([[fx - 18, 975], [fx + 30, 975]], 10 + 2 * ow * 0.8, INK); p.stroke([[fx - 18, 975], [fx + 30, 975]], 10, LEG);
  }
  // tail
  const tail: P2[] = [[200, 770], [70, 830], [64, 868], [92, 872], [212, 828]];
  p.poly(tail, WING, ow);
  p.stroke([[78, 846], [96, 866]], 10, BAR);
  // body
  const body = ell(300, 765, 158, 108, -10);
  p.gradFill(body, BODY, mul(BODY, [0.7, 0.72, 0.82]), light);
  p.inkRing(body, ow * 1.1, Math.atan2(0.8 - Math.sin(light), -Math.cos(light)));
  // wing with two dark bars
  const wing = ell(262, 752, 118, 66, -14);
  p.poly(wing, WING, ow * 0.8);
  p.clip(wing, () => { for (const dx of [0, 40]) p.stroke([[232 + dx, 722], [196 + dx, 796]], 9, BAR); });
  // neck + head rotate about the shoulder; peck swings the head forward and down
  const pivot: P2 = [372, 708], a = rad(78 * peck + 6 * nod);
  const R = (q: P2) => rot(q, a, pivot);
  const neck: P2[] = ell(392, 668, 62, 96, 18).map(R);
  p.gradFill(neck, HEAD, mul(HEAD, [0.78, 0.8, 0.88]), light);
  p.clip(neck, () => { p.poly(ell(424, 690, 44, 38, 18).map(R), NECK, 0); p.poly(ell(410, 726, 40, 30, 18).map(R), NECK2, 0); });
  p.poly(neck, null, ow * 0.9);
  const hc = R([430, 582]), head = ell(hc[0], hc[1], 70, 64, (a * 180) / Math.PI);
  p.gradFill(head, HEAD, mul(HEAD, [0.78, 0.8, 0.88]), light);
  p.poly(head, null, ow);
  // beak with the white cere
  const b0 = R([488, 566]), b1 = R([540, 590]), b2 = R([486, 600]);
  p.poly([b0, b1, b2], BEAK, ow * 0.7);
  const cr = R([486, 572]);
  p.ell(cr[0], cr[1], 13, 9, "#f2efe9", ow * 0.5, 0, 360, (a * 180) / Math.PI);
  // eye
  const ec = R([450, 566]);
  if (look === "happy") p.arc(ec[0], ec[1] + 4, 16, 12, 200, 340, 7);
  else {
    p.ell(ec[0], ec[1], 17, 17, "#f39a3c", 5);
    p.dot(ec[0] + 3, ec[1], look === "shock" ? 5 : 8, INK);
    if (look === "sulk") { p.ell(ec[0], ec[1], 18, 18, HEAD, 0, 180, 360); p.stroke([R([430, 566]), R([470, 566])], 6); }
    if (look === "focus" || look === "sulk") p.stroke([R([428, 540]), R([474, look === "sulk" ? 534 : 548])], 8);
  }
  // accessories: leather pilot cap with goggles (lead), red scarf, feather tuft (the stubborn third)
  if (o.cap) {
    const cap = ([[372, 560], [380, 518], [430, 500], [478, 520], [486, 548]] as P2[]).map(R);
    p.poly(cap, "#7a4a2a", ow * 0.8);
    const g = R([450, 530]);
    p.ell(g[0], g[1], 20, 15, "#bfe3ff", 5);
    p.band([R([372, 548]), R([395, 640])], "#6a3f24", 10, 3);
  }
  if (o.scarf) {
    p.band([R([352, 676]), R([398, 690]), R([440, 676])], "#e2453c", 26, 4, "round");
    p.band([R([356, 680]), R([318, 726]), R([300, 712])], "#e2453c", 20, 4, "round");
  }
  if (o.tuft) for (const dx of [-14, 0, 14]) p.stroke([R([420 + dx, 522]), R([414 + dx * 1.6, 486])], 7);
};

// ---------------- effects ----------------
/** seed scatter on a 300 x 200 canvas, t 0..1 spreads them out and fades */
export const fxSeeds = (p: Pen, t: number) => {
  for (let i = 0; i < 14; i++) {
    const a = rad(200 + i * 10.5), d = 30 + 110 * t * (0.6 + 0.4 * ((i * 7) % 5) / 4);
    p.ell(150 + d * Math.cos(a) * 1.2, 150 + d * Math.sin(a) * 0.9 + 40 * t * t, 9, 6, i % 3 ? "#e6c37a" : "#c99a4a", 3, 0, 360, i * 25);
  }
};
/** speed lines on a 400 x 300 canvas around a point at (200, 150) */
export const fxSpeed = (p: Pen, k: number) => {
  for (let i = 0; i < 9; i++) {
    const a = rad(150 + i * 26), r0 = 70, r1 = 70 + 70 * k * (0.7 + 0.3 * (i % 2));
    p.stroke([[200 + r0 * Math.cos(a), 150 + r0 * Math.sin(a)], [200 + r1 * Math.cos(a), 150 + r1 * Math.sin(a)]], 9);
  }
};
/** grey rain cloud with three drops on a 400 x 300 canvas */
export const fxRain = (p: Pen, t: number) => {
  for (const [x, y, r] of [[130, 110, 60], [210, 90, 78], [290, 112, 62], [205, 135, 90]] as const) p.ell(x, y, r, r * 0.7, "#8e95a6", 8);
  for (let i = 0; i < 3; i++) {
    const y = 175 + ((t * 120 + i * 40) % 110);
    p.poly([[150 + i * 55, y], [158 + i * 55, y + 22], [150 + i * 55, y + 30], [142 + i * 55, y + 22]], "#7fb6ff", 5);
  }
};
/** small bright idea sparkle (four-point star) on a 300 x 300 canvas */
export const fxIdea = (p: Pen, t: number) => {
  const s = 0.6 + 0.4 * Math.sin(Math.min(1, t) * Math.PI);
  const pts: P2[] = [];
  for (let k = 0; k < 8; k++) { const r = (k % 2 ? 30 : 120) * s, b = rad(k * 45 - 90); pts.push([150 + r * Math.cos(b), 150 + r * Math.sin(b)]); }
  p.poly(pts, "#fff1a8", 8);
};

export { mix, shade, Expr };

// ---------------- office cast + props ----------------
import { SKINS } from "./toon";
/** three committee members (suits) and two officers (olive uniform, peaked cap) */
export const COMMITTEE: Outfit[] = [
  { jacket: "#4a5468", pants: "#2e3340", boots: "#2a201a", hat: "hair", hair: "#c9c3b8", moustache: "#bdb6aa", buttons: "#2e3340", build: "stout", skin: SKINS[0] },
  { jacket: "#6b5a48", pants: "#3a3028", boots: "#2a201a", hat: "hair", hair: "#3a2a22", buttons: "#3a3028", skin: SKINS[1] },
  { jacket: "#3f4a5e", pants: "#2e3340", boots: "#2a201a", hat: "hair", hair: "#7a5a3a", buttons: "#2e3340", skin: SKINS[3] },
];
export const OFFICERS: Outfit[] = [
  { jacket: "#6e6a44", pants: "#4a4a32", boots: INK, hat: "cap", cap: "#5e5a3a", buttons: "#e8c45a", belt: "#5a3b2a", build: "stout", moustache: "#4a3020", skin: SKINS[2] },
  { jacket: "#6e6a44", pants: "#4a4a32", boots: INK, hat: "cap", cap: "#5e5a3a", buttons: "#e8c45a", belt: "#5a3b2a", skin: SKINS[1] },
];
/** money sack with a big coin badge on a 300 x 300 canvas */
export const fxBag = (p: Pen) => {
  p.poly([[70, 270], [60, 180], [100, 110], [130, 92], [170, 92], [200, 110], [240, 180], [230, 270]], "#b98a52", 9);
  p.poly([[118, 96], [100, 60], [130, 76], [150, 50], [170, 76], [200, 60], [182, 96]], "#a77a46", 8);
  p.band([[112, 100], [188, 100]], "#7a4a2a", 12, 4, "round");
  p.ell(150, 195, 46, 46, "#f2c94c", 8); p.ell(150, 195, 28, 28, null, 5);
};
/** rubber stamp (side view) on a 200 x 300 canvas */
export const fxStamp = (p: Pen) => {
  p.ell(100, 60, 42, 40, "#7a4a2a", 9);
  p.poly([[86, 95], [114, 95], [118, 190], [82, 190]], "#9a6a43", 9);
  p.poly([[40, 190], [160, 190], [160, 240], [40, 240]], "#5a3b2a", 9);
  p.poly([[40, 240], [160, 240], [156, 262], [44, 262]], "#c0353a", 8);
};
/** manila folder seen from above on a 400 x 300 canvas; stamped = red block mark */
export const fxFolder = (p: Pen, stamped: boolean) => {
  p.poly([[40, 60], [150, 60], [170, 40], [260, 40], [280, 60], [360, 60], [360, 270], [40, 270]], "#e8c87a", 9);
  p.stroke([[60, 100], [340, 100]], 5, "#c9a85a");
  if (stamped) { p.poly([[120, 140], [290, 130], [296, 210], [126, 220]], null, 12); p.g.globalAlpha = 0.35; p.poly([[120, 140], [290, 130], [296, 210], [126, 220]], "#c0353a", 0); p.g.globalAlpha = 1; }
};
/** one calendar page (no numbers) on a 200 x 240 canvas */
export const fxPage = (p: Pen) => {
  p.poly([[20, 20], [180, 20], [180, 220], [20, 220]], "#fbf8ef", 7);
  p.poly([[20, 20], [180, 20], [180, 62], [20, 62]], "#c0353a", 7);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) p.poly([[34 + c * 28, 76 + r * 34], [56 + c * 28, 76 + r * 34], [56 + c * 28, 102 + r * 34], [34 + c * 28, 102 + r * 34]], "#e6e0d2", 2);
};
/** round porthole with three pilot-pigeon heads bobbing (k 0..1) on a 300 x 300 canvas */
export const fxWindow = (p: Pen, k: number) => {
  p.ell(150, 150, 140, 140, "#bfe3ff", 0);
  for (const [x, y, cap] of [[90, 170, false], [150, 150, true], [210, 172, false]] as const) {
    const yy = y + (cap ? -8 : 8) * k;
    p.ell(x, yy + 70, 46, 40, "#8691a8", 6);
    p.ell(x, yy, 38, 36, "#a9b4c6", 6);
    p.ell(x + 14, yy - 6, 9, 9, "#f39a3c", 3); p.dot(x + 15, yy - 6, 4);
    p.poly([[x + 30, yy - 4], [x + 52, yy + 6], [x + 30, yy + 12]], "#3a3236", 4);
    if (cap) p.poly([[x - 36, yy - 10], [x - 30, yy - 36], [x, yy - 46], [x + 30, yy - 36], [x + 36, yy - 12]], "#7a4a2a", 5);
  }
  p.ell(150, 150, 140, 140, null, 18);
};
