// A cozy modern home kitchen at night (shot 16, the everyday analogy): butcher-block counter on teal shaker cabinets,
// cream subway tiles, apricot walls, a window onto a deep blue night city with moon and stars, a mint fridge with
// magnets and a kid drawing (the cat sits on top), a spice shelf, a cream upper cabinet, a red kettle, a sink, one
// mustard pendant lamp and a gingham kitchen table with a fruit bowl in the foreground.
// The hero is a white microwave built from geometry: glowing cavity, a slowly turning glass plate with one egg on it,
// a glass door with a dot screen, keypad and a counting display. The egg wobbles more and more, bursts on "platzt"
// (white flash, door jolts, drawEggSplat cards inside the window, camera kick); on "nicht" the door bangs open, the
// camera pulls back fast and egg bits fly out and splat on everything (lit cut-out decals on the surfaces, dripping)
// up to "überall", when the lamp and the cat get theirs. Room x -4..4, z -3..3, back wall at z = -3, camera looks -z.
import * as THREE from "three";
import { Batch, boxGeo, quad, V, lam, Kit } from "../pigeon/build";
import { placeProp } from "../pigeon/props";
import { ctex } from "../pigeon/paint";
import { grainTex, plasterTex } from "../pigeon/ptex";
import { NOINK } from "../pigeon/ink";
import { Pen, INK } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, V3, camOf, dofOf, card, contact, ease, clamp01, lerp3, q, LEAD } from "./room";
import { drawEggSplat } from "../whale/draw";
import { A, beat } from "./shots";

// ---------------- beats ----------------
// ("Ei" is hard-coded: beat() would match "ein" first)
const S16 = A(16), EI = 1528, MIKRO = beat(16, "Mikrowelle"), PLATZT = beat(16, "platzt"), NICHT = beat(16, "nicht"), UEBERALL = beat(16, "überall");
/** the burst frame and the door bang (a frame or two ahead of their words) */
const BURST = PLATZT - 1, BANG = NICHT - LEAD;

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  16: {
    keys: [
      // close on the microwave window: the egg turning on the plate
      { f: S16, pos: [0.31, 1.1, -1.75], look: [0.29, 0.99, -2.7], fov: 40 },
      // a little back on "Mikrowelle": the whole front with keypad and display
      { f: MIKRO - 5, dur: 12, pos: [0.36, 1.16, -1.4], look: [0.33, 0.98, -2.7], fov: 40 },
      // fast push in onto the egg for "platzt"
      { f: PLATZT - 4, dur: 5, pos: [0.3, 1.08, -1.95], look: [0.29, 1.0, -2.7], fov: 40 },
      // from "nicht": fast pull back to the whole kitchen
      { f: NICHT - 2, dur: 16, pos: [0.22, 1.45, 1.3], look: [0.2, 1.12, -2.6], fov: 52 },
      // and a slow settle into "überall"
      { f: UEBERALL - 4, dur: 26, pos: [0.2, 1.48, 1.02], look: [0.22, 1.14, -2.6], fov: 52 },
    ],
    creep: 0.0008, punch: [EI], kicks: [PLATZT, NICHT], cInf: [8, 7, 8, 5, 5],
  },
};
export const kitchenCam = camOf(CAMS);
export const kitchenDof = dofOf(CAMS);

// ---------------- layout ----------------
const CT = 0.922; // counter top
const X0 = 0.08, X1 = 0.6, Y0 = CT, Y1 = CT + 0.31, Z0 = -2.92, Z1 = -2.52; // microwave body
const DW = 0.39, DH = 0.31; // door (hinge at X0)
const PX = 0.284, PY = 0.952, PZ = -2.71; // turntable centre
const WX0 = -0.85, WX1 = -0.2, WY0 = 1.58, WY1 = 2.32; // window hole
const FX0 = 0.86, FX1 = 1.5, FZ = -2.31, FH = 1.86; // fridge
const LX = 0.3, LY = 2.16, LZ = -1.55; // pendant lamp (rim height)
const TY = 0.76; // table top
const CAT: V3 = [1.0, FH, -2.55];
const MOUTH: V3 = [0.28, 1.08, -2.48];

// ---------------- painted textures ----------------
const tileTex = () => ctex("kTile", 512, 512, (g, r) => {
  g.fillStyle = "#b9ae9c"; g.fillRect(0, 0, 512, 512);
  const tw = 128, th = 64; // 0.15 x 0.075 m on 0.6 m
  for (let row = 0; row < 8; row++) for (let c = -1; c < 5; c++) {
    const x = c * tw + (row % 2 ? tw / 2 : 0) + 3, y = row * th + 3, l = 236 + Math.floor(r() * 14), hue = r();
    g.fillStyle = hue < 0.12 ? "#d9ece6" : `rgb(${l},${l - 4},${l - 14})`;
    g.fillRect(x, y, tw - 6, th - 6);
    g.fillStyle = "rgba(255,255,255,0.45)"; g.fillRect(x + 6, y + 5, tw * 0.5, 5);
    g.fillStyle = "rgba(120,100,80,0.12)"; g.fillRect(x, y + th - 12, tw - 6, 6);
  }
});
const floorTex = () => ctex("kFloor", 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
    g.fillStyle = (i + k) % 2 ? "#c0603e" : "#f0dfc0"; g.fillRect(i * 128, k * 128, 128, 128);
    for (let n = 0; n < 40; n++) { g.fillStyle = "rgba(90,50,30,0.12)"; g.fillRect(i * 128 + r() * 128, k * 128 + r() * 128, 3, 3); }
  }
  g.strokeStyle = "rgba(80,50,40,0.5)"; g.lineWidth = 4;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
});
const ginghamTex = () => ctex("kGingham", 512, 512, (g) => {
  g.fillStyle = "#fbf4ea"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(214,58,52,0.55)";
  for (let i = 0; i < 512; i += 64) { g.fillRect(i, 0, 32, 512); g.fillRect(0, i, 512, 32); }
  g.fillStyle = "rgba(170,30,30,0.35)"; for (let i = 0; i < 512; i += 64) for (let k = 0; k < 512; k += 64) g.fillRect(i, k, 32, 32);
});
/** the night outside: deep blue sky, stars, a moon, a skyline with lit windows */
const nightView = () => ctex("kNight", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0d1840"); gr.addColorStop(0.6, "#22357a"); gr.addColorStop(1, "#3d5aa0");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,250,230,${0.5 + 0.5 * r()})`; const s = r() < 0.15 ? 4 : 2; g.fillRect(r() * 512, r() * 300, s, s); }
  const mg = g.createRadialGradient(350, 150, 20, 350, 150, 90); mg.addColorStop(0, "rgba(255,240,200,0.45)"); mg.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = mg; g.fillRect(240, 40, 220, 220);
  g.fillStyle = "#fff4d2"; g.beginPath(); g.arc(350, 150, 34, 0, 7); g.fill();
  g.fillStyle = "#e9dcb8"; g.beginPath(); g.arc(340, 142, 7, 0, 7); g.arc(362, 160, 5, 0, 7); g.fill();
  const blocks: [number, number, string][] = [[0, 250, "#1c2656"], [70, 300, "#26306a"], [150, 230, "#1a2350"], [215, 330, "#222c62"], [300, 270, "#1c2656"], [380, 310, "#26306a"], [450, 240, "#1a2350"]];
  for (const [x, top, col] of blocks) {
    const w = 60 + r() * 30;
    g.fillStyle = col; g.fillRect(x, top, w, 512 - top);
    for (let y = top + 16; y < 500; y += 26) for (let xx = x + 8; xx < x + w - 12; xx += 18) if (r() < 0.4) { g.fillStyle = r() < 0.7 ? "#ffd88a" : "#ffb862"; g.fillRect(xx, y, 9, 13); }
  }
  g.fillStyle = "#ff5a4a"; g.fillRect(238, 322, 4, 4);
});
/** microwave door glass: dark tint with the dot screen and a gloss band */
const glassTex = () => ctex("kGlass", 512, 384, (g) => {
  g.clearRect(0, 0, 512, 384);
  g.fillStyle = "rgba(26,22,40,0.2)"; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "rgba(18,16,30,0.5)";
  for (let y = 4; y < 384; y += 10) for (let x = 4 + ((y / 10) % 2) * 5; x < 512; x += 10) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.16)"; g.beginPath(); g.moveTo(60, 0); g.lineTo(170, 0); g.lineTo(60, 384); g.lineTo(-50, 384); g.fill();
  g.fillStyle = "rgba(255,255,255,0.08)"; g.beginPath(); g.moveTo(210, 0); g.lineTo(240, 0); g.lineTo(130, 384); g.lineTo(100, 384); g.fill();
});
/** glowing cavity: warm yellow enamel, brighter towards the lamp corner */
const cavityTex = () => ctex("kCavity", 256, 256, (g, r) => {
  const gr = g.createRadialGradient(200, 60, 10, 160, 120, 230); gr.addColorStop(0, "#fff6d0"); gr.addColorStop(1, "#e8b860");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(150,100,40,0.12)"; for (let i = 0; i < 300; i++) g.fillRect(r() * 256, r() * 256, 2, 2);
});
/** control panel: dark glass with a 3 x 4 keypad, two dials and a green start key */
const panelFace = () => ctex("kPanel", 256, 620, (g) => {
  g.fillStyle = "#e9e6de"; g.fillRect(0, 0, 256, 620);
  g.fillStyle = "#2e3340"; g.beginPath(); g.roundRect(14, 14, 228, 592, 18); g.fill();
  g.fillStyle = "#0f1a16"; g.fillRect(30, 34, 196, 70);
  const key = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.roundRect(x + 2, y + 4, w, h, 8); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(x, y, w, h, 8); g.fill();
    g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x + 6, y + 4, w - 12, 4);
  };
  for (let rr = 0; rr < 4; rr++) for (let c = 0; c < 3; c++) {
    key(34 + c * 66, 140 + rr * 62, 56, 48, "#c9ced8");
    g.fillStyle = "#2e3340"; g.font = "bold 28px Arial, sans-serif"; g.textAlign = "center";
    g.fillText(String((rr * 3 + c + 1) % 10), 62 + c * 66, 174 + rr * 62);
  }
  g.fillStyle = "#c9ced8"; g.beginPath(); g.arc(78, 430, 34, 0, 7); g.arc(178, 430, 34, 0, 7); g.fill();
  g.strokeStyle = "#2e3340"; g.lineWidth = 6; g.beginPath(); g.moveTo(78, 430); g.lineTo(78, 404); g.moveTo(178, 430); g.lineTo(196, 410); g.stroke();
  key(34, 488, 188, 46, "#52c07a"); key(34, 546, 188, 40, "#e2574a");
});
const displayTex = (txt: string) => ctex("kDisp" + txt, 192, 64, (g) => {
  g.fillStyle = "#08130f"; g.fillRect(0, 0, 192, 64);
  g.fillStyle = "#8affc0"; g.font = "bold 46px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 96, 34);
});
/** glass turntable with rings so the slow turn reads */
const plateTex = () => ctex("kPlate", 256, 256, (g) => {
  g.fillStyle = "#dfe8ea"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(90,120,130,0.55)"; g.lineWidth = 5;
  for (const rr of [40, 80, 118]) { g.beginPath(); g.arc(128, 128, rr, 0, 7); g.stroke(); }
  g.fillStyle = "rgba(90,120,130,0.6)"; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.beginPath(); g.arc(128 + 98 * Math.cos(a), 128 + 98 * Math.sin(a), 8, 0, 7); g.fill(); }
});
/** fridge door: magnets, a kid drawing (sun, house, cat), a photo, a shopping list */
const fridgeTex = () => ctex("kFridge", 512, 1024, (g, r) => {
  g.fillStyle = "#a9dcc9"; g.fillRect(0, 0, 512, 1024);
  g.fillStyle = "rgba(255,255,255,0.2)"; g.fillRect(30, 0, 40, 1024);
  g.save(); g.translate(150, 120); g.rotate(-0.06);
  g.fillStyle = "#fffdf6"; g.fillRect(0, 0, 260, 200);
  g.fillStyle = "#ffd23a"; g.beginPath(); g.arc(210, 45, 26, 0, 7); g.fill();
  g.strokeStyle = "#ffb000"; g.lineWidth = 5; for (let k = 0; k < 8; k++) { const a = k * 0.785; g.beginPath(); g.moveTo(210 + 32 * Math.cos(a), 45 + 32 * Math.sin(a)); g.lineTo(210 + 46 * Math.cos(a), 45 + 46 * Math.sin(a)); g.stroke(); }
  g.fillStyle = "#e2574a"; g.beginPath(); g.moveTo(40, 110); g.lineTo(95, 60); g.lineTo(150, 110); g.fill();
  g.fillStyle = "#4f8fe0"; g.fillRect(52, 110, 86, 70); g.fillStyle = "#8a5a36"; g.fillRect(84, 140, 22, 40);
  g.fillStyle = "#f0a04a"; g.beginPath(); g.ellipse(200, 165, 26, 18, 0, 0, 7); g.fill(); g.beginPath(); g.arc(222, 145, 13, 0, 7); g.fill();
  g.fillStyle = "#5ab04a"; g.fillRect(0, 180, 260, 20);
  g.restore();
  g.save(); g.translate(90, 420); g.rotate(0.08); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 150, 170);
  g.fillStyle = "#7fb3e8"; g.fillRect(10, 10, 130, 120); g.fillStyle = "#f4e0a0"; g.fillRect(10, 100, 130, 30);
  g.fillStyle = "#fbf8f2"; g.beginPath(); g.arc(60, 80, 18, 0, 7); g.arc(96, 74, 22, 0, 7); g.fill(); g.restore();
  g.save(); g.translate(300, 470); g.rotate(-0.05); g.fillStyle = "#fff3a8"; g.fillRect(0, 0, 150, 200);
  g.strokeStyle = "rgba(60,50,80,0.6)"; g.lineWidth = 5; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(16, 30 + k * 28); g.lineTo(60 + r() * 70, 30 + k * 28); g.stroke(); }
  g.restore();
  for (const [x, y, c] of [[170, 118, "#e2574a"], [400, 112, "#3f6fb5"], [160, 425, "#f5c22a"], [372, 466, "#5ab04a"], [120, 760, "#e07a3a"], [380, 820, "#7b5ac9"], [250, 690, "#e2574a"]] as const) {
    g.fillStyle = "rgba(30,40,40,0.3)"; g.beginPath(); g.arc(x + 4, y + 6, 18, 0, 7); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(x - 6, y - 6, 6, 0, 7); g.fill();
  }
  g.font = "bold 70px Arial, sans-serif";
  ["#e2574a", "#3f6fb5", "#f5c22a", "#5ab04a"].forEach((c, i) => { g.fillStyle = c; g.fillText("ABCD"[i], 110 + i * 70, 930 + (i % 2) * 12); });
});
const clockTex = () => ctex("kClock", 256, 256, (g) => {
  g.fillStyle = "#fbf6e8"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = "#2a2230";
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.save(); g.translate(128 + 100 * Math.sin(a), 128 - 100 * Math.cos(a)); g.rotate(a); g.fillRect(-4, -10, 8, k % 3 ? 12 : 22); g.restore(); }
  g.lineCap = "round"; g.strokeStyle = "#2a2230"; g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 52 * Math.sin(1.1), 128 - 52 * Math.cos(1.1)); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 86 * Math.sin(0.2), 128 - 86 * Math.cos(0.2)); g.stroke();
  g.strokeStyle = "#e07a3a"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
});
const towelTex = () => ctex("kTowel", 128, 256, (g) => {
  g.fillStyle = "#fbf4ea"; g.fillRect(0, 0, 128, 256);
  g.fillStyle = "#d63a34"; for (const y of [30, 60, 190, 220]) g.fillRect(0, y, 128, 14);
});
const glowTex = () => ctex("kGlow", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
/** egg splat decals (drawEggSplat, mirrored for variety) on transparency */
const splatTex = (v: number) => ctex("kSplat" + v, 700, 420, (g) => {
  g.clearRect(0, 0, 700, 420);
  if (v % 2) { g.translate(700, 0); g.scale(-1, 1); }
  drawEggSplat(1)(new Pen(g));
  g.setTransform(1, 0, 0, 1, 0, 0);
});
/** three egg-white drips with round ends, hanging from the top edge */
const dripTex = () => ctex("kDrip", 128, 384, (g) => {
  g.clearRect(0, 0, 128, 384);
  const p = new Pen(g); p.ol = 7;
  for (const [x, len, w] of [[24, 300, 34], [66, 210, 28], [104, 340, 30]] as const) {
    p.poly([[x - w / 2, 0], [x + w / 2, 0], [x + w / 2 - 3, len - w], [x, len], [x - w / 2 + 3, len - w]], "#fff8ec", 5);
    p.ell(x, len - w * 0.55, w * 0.62, w * 0.66, "#fff8ec", 5);
    p.poly([[x - w / 2 + 3, 4], [x + w / 2 - 3, 4], [x + w / 2 - 6, len - w], [x - w / 2 + 6, len - w]], "#fff8ec", 0);
  }
  g.fillStyle = "#fff8ec"; g.fillRect(0, 0, 128, 10);
});

// ---------------- effect and cat drawings ----------------
type P2 = [number, number];
const ep = (cx: number, cy: number, rx: number, ry: number, n = 40, spike = 0): P2[] =>
  Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 1 + (i % 2 ? spike : 0); return [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)] as P2; });
/** flying egg bit, 128 x 128 */
const drawBit = (k: number) => (p: Pen) => {
  p.ol = 6;
  const pts = Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2, r = 1 + 0.16 * Math.sin(3 * a + k * 2) + 0.08 * Math.sin(7 * a + k); return [64 + (44 - k * 5) * r * Math.cos(a), 64 + (32 + k * 4) * r * Math.sin(a)] as P2; });
  p.poly(pts, "#fff8ec", 6);
  if (k !== 1) p.ell(58 + k * 4, 60, 16, 13, "#ffcf2e", 5);
};
const drawDrop = (p: Pen) => { p.ol = 5; p.poly([[32, 8], [46, 70], [40, 92], [24, 92], [18, 70]], "#fff8ec", 5); };
const steam = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(64, 64, 0, 64, 64, 60);
  gr.addColorStop(0, "rgba(255,248,236,0.28)"); gr.addColorStop(1, "rgba(255,248,236,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};
/** orange tabby sitting on the fridge, 600 x 1000 card (feet at 975): 0 asleep, 1 ears up and eyes open, 2 hit by
 *  egg: huge eyes, open mouth, fur on end, splat on its head */
const drawCat = (st: number, light: number) => (p: Pen) => {
  const OR = "#f29c46", ORD = "#c86e2a", CR = "#fbe8cc", PINK = "#f39aa6";
  p.ol = 11;
  const g = p.g;
  if (st === 2) p.line([[410, 940], [470, 880], [500, 770], [492, 640]], OR, 50);
  else p.line([[390, 955], [470, 955], [535, 905], [540, 830]], OR, 38);
  if (st === 2) for (let i = 0; i < 6; i++) { const y = 660 + i * 45; p.stroke([[500, y], [530, y - 16]], 9, INK); }
  const body = ep(300, 805, 150, 172, 44, st === 2 ? 0.08 : 0);
  p.gradFill(body, OR, ORD, light, 0.3); p.poly(body, null);
  p.poly(ep(300, 850, 84, 108, 30), CR, 0);
  for (let i = 0; i < 3; i++) p.arc(300, 700 + i * 40, 150 - i * 6, 60, 200 + i * 6, 330 - i * 6, 10, ORD);
  for (const x of [255, 345]) { p.poly(ep(x, 915, 36, 58, 24), OR, 10); p.poly(ep(x, 966, 44, 18, 20), CR, 9); }
  const hy = st === 2 ? 540 : 575;
  const earL: P2[] = [[190, hy - 50], [200, hy - 165], [272, hy - 95]], earR: P2[] = [[410, hy - 50], [400, hy - 165], [328, hy - 95]];
  for (const e of [earL, earR]) p.poly(e, OR);
  p.poly([[210, hy - 70], [212, hy - 132], [252, hy - 92]], PINK, 0); p.poly([[390, hy - 70], [388, hy - 132], [348, hy - 92]], PINK, 0);
  const head = ep(300, hy, 138, 116, 44, st === 2 ? 0.05 : 0);
  p.gradFill(head, OR, ORD, light, 0.35); p.poly(head, null);
  for (const dx of [-28, 0, 28]) p.stroke([[300 + dx, hy - 112], [300 + dx * 0.8, hy - 70]], 10, ORD);
  p.poly(ep(300, hy + 52, 66, 40, 30), CR, 0);
  if (st === 0) for (const x of [248, 352]) p.arc(x, hy - 6, 28, 14, 20, 160, 9);
  else if (st === 1) for (const x of [248, 352]) { p.ell(x, hy - 8, 28, 32, "#e8e05a", 8); p.ell(x, hy - 6, 9, 24, INK, 0); p.dot(x - 8, hy - 18, 5, "#ffffff"); }
  else for (const x of [242, 358]) { p.ell(x, hy - 14, 46, 50, "#ffffff", 9); p.dot(x, hy - 12, 10); }
  p.poly([[287, hy + 32], [313, hy + 32], [300, hy + 46]], PINK, 6);
  if (st === 2) p.ell(300, hy + 78, 20, 26, "#8a2a3a", 8);
  else { p.arc(286, hy + 50, 14, 12, 0, 160, 6); p.arc(314, hy + 50, 14, 12, 20, 180, 6); }
  for (const s of [-1, 1]) for (const dy of [-8, 10]) p.stroke([[300 + s * 70, hy + 46 + dy], [300 + s * 170, hy + 30 + dy * 2.2]], 5, INK);
  if (st === 2) for (let i = 0; i < 7; i++) {
    const a = Math.PI * (1.05 + i * 0.15), c = Math.cos(a), s = Math.sin(a);
    p.stroke([[300 + 190 * c, hy - 10 + 165 * s], [300 + 240 * c, hy - 10 + 205 * s]], 10, INK);
  }
  if (st === 2) {
    p.poly(ep(296, hy - 100, 128, 44, 16, 0.12), "#fff8ec", 9);
    p.line([[220, hy - 80], [214, hy - 20], [218, hy + 10]], "#fff8ec", 26);
    p.line([[372, hy - 84], [380, hy - 40]], "#fff8ec", 20);
    p.ell(318, hy - 112, 40, 30, "#ffcf2e", 7);
    g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.arc(306, hy - 122, 9, 0, 7); g.fill();
  }
};

// ---------------- the outside splats ----------------
/** where egg bits land after the door bangs open: v = on a wall facing the camera, h = on a top surface; t = landing
 *  frame (the bit flies 7 frames before); the last ones land on "überall" */
type Hit = { at: V3; kind: "v" | "h"; w: number; t: number; rot: number; drip: number };
const U = UEBERALL;
const HITS: Hit[] = [
  { at: [-0.04, 1.28, -2.99], kind: "v", w: 0.3, t: BANG + 6, rot: 0.2, drip: 1 },
  { at: [0.05, CT + 0.002, -2.5], kind: "h", w: 0.3, t: BANG + 7, rot: 0.6, drip: 0 },
  { at: [0.42, 2.12, -2.674], kind: "v", w: 0.36, t: BANG + 9, rot: -0.15, drip: 1 },
  { at: [1.08, 1.12, FZ + 0.006], kind: "v", w: 0.34, t: BANG + 11, rot: 0.35, drip: 1 },
  { at: [0.36, 0.62, -2.413], kind: "v", w: 0.3, t: BANG + 13, rot: -0.4, drip: 1 },
  { at: [0.36, Y1 + 0.004, -2.72], kind: "h", w: 0.26, t: BANG + 14, rot: 2.1, drip: 0 },
  { at: [-0.5, 1.98, -2.955], kind: "v", w: 0.3, t: BANG + 16, rot: 0.5, drip: 1 },
  { at: [0.5, TY + 0.003, -0.55], kind: "h", w: 0.38, t: BANG + 17, rot: 1.2, drip: 0 },
  { at: [0.18, 1.74, -2.79], kind: "v", w: 0.22, t: BANG + 18, rot: 0.1, drip: 1 },
  { at: [0.74, 1.38, -2.99], kind: "v", w: 0.22, t: U - 2, rot: -0.6, drip: 1 },
  { at: [-0.52, 2.62, -2.945], kind: "v", w: 0.24, t: U - 1, rot: 0.9, drip: 1 },
  { at: [LX + 0.02, LY + 0.07, LZ + 0.215], kind: "v", w: 0.3, t: U, rot: -0.2, drip: 1 },
  { at: [-0.22, 1.1, -2.62], kind: "v", w: 0.17, t: U + 1, rot: 0.4, drip: 1 },
  { at: [-0.85, 2.55, -2.99], kind: "v", w: 0.3, t: U + 3, rot: -0.3, drip: 1 },
  { at: [-0.25, TY + 0.003, -0.2], kind: "h", w: 0.26, t: U + 4, rot: 2.6, drip: 0 },
  { at: [1.22, 1.6, FZ + 0.006], kind: "v", w: 0.2, t: U + 5, rot: 1.9, drip: 1 },
];
const CAT_HIT = U + 2;
/** bits still flying at the end (past the lens, up out of frame) */
const STRAYS: { to: V3; t0: number; dur: number }[] = [
  { to: [-0.2, 1.9, 0.6], t0: U - 6, dur: 26 }, { to: [0.75, 1.25, 0.5], t0: U - 2, dur: 30 },
  { to: [-0.7, 3.2, -2.2], t0: U + 6, dur: 12 }, { to: [1.3, 3.2, -1.9], t0: U + 10, dur: 12 }, { to: [0.0, 3.2, -1.2], t0: U + 14, dur: 12 },
];
const flight = (from: V3, to: V3, u: number, hump: number): V3 => {
  const p = lerp3(from, to, u); p[1] += hump * Math.sin(Math.PI * u); return p;
};

type Decal = { m: THREE.Mesh; drip?: THREE.Mesh; t: number };

// ---------------- the room ----------------
export class KitchenWorld extends RoomWorld {
  private mw = new THREE.Group();
  private door = new THREE.Group();
  private plate = new THREE.Group();
  private egg: THREE.Mesh;
  private cavity: THREE.MeshBasicMaterial;
  private disp: THREE.MeshBasicMaterial;
  private flash: THREE.Mesh;
  private halo: THREE.Mesh;
  private winGlow: THREE.Mesh;
  private bulbGlow: THREE.Mesh;
  private decals: Decal[] = [];

  constructor(kit: Kit) {
    super(kitchenCam);
    // warm key from the pendant side (front left, high) instead of the night preset's backlight, frozen for shot 16
    const c0 = kitchenCam(16, S16), fw = V(c0.look[0] - c0.pos[0], 0, c0.look[2] - c0.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
    const az = (-150 * Math.PI) / 180, el = (48 * Math.PI) / 180;
    const sun = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
    (this as unknown as { sunCache: Map<number, THREE.Vector3> }).sunCache.set(16, sun);

    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch(), noCast = new Batch();
    const M = {
      floor: lam("kFloorM", () => ({ map: floorTex() })),
      wall: lam("kWall", () => ({ map: plasterTex("#eaa673") })),
      ceil: lam("kCeil", () => ({ map: plasterTex("#f3e6d2") })),
      tile: lam("kTileM", () => ({ map: tileTex() })),
      wood: lam("kWood", () => ({ map: grainTex("#c98a4e") })),
      woodD: lam("kWoodD", () => ({ map: grainTex("#8a5632") })),
      cab: lam("kCab", () => ({ color: "#2f8088" })),
      cabD: lam("kCabD", () => ({ color: "#246870" })),
      plinth: lam("kPlinth", () => ({ color: "#1f4f58" })),
      brass: lam("kBrass", () => ({ color: "#e0b24e" })),
      cream: lam("kCream", () => ({ color: "#f3e7cf" })),
      creamD: lam("kCreamD", () => ({ color: "#e2d2b2" })),
      steel: lam("kSteel", () => ({ color: "#bcc3cc" })),
      steelD: lam("kSteelD", () => ({ color: "#717b88" })),
      chrome: lam("kChrome", () => ({ color: "#dde2e8" })),
      winF: lam("kWinF", () => ({ color: "#f4efe4" })),
      blind: lam("kBlind", () => ({ color: "#e8b440" })),
      white: lam("kWhite", () => ({ color: "#f4f2ec" })),
      whiteD: lam("kWhiteD", () => ({ color: "#d9d7d2" })),
      gasket: lam("kGasket", () => ({ color: "#4a4e5a" })),
      panel: lam("kPanelM", () => ({ map: panelFace() })),
      plateM: lam("kPlateM", () => ({ map: plateTex() })),
      eggM: lam("kEgg", () => ({ color: "#fff1dc" })),
      kettle: lam("kKettle", () => ({ color: "#e0463a" })),
      black: lam("kBlack", () => ({ color: "#2e2a34" })),
      fridge: lam("kFridgeB", () => ({ color: "#a9dcc9" })),
      fridgeD: lam("kFridgeD", () => ({ color: "#86c2ad" })),
      fridgeF: lam("kFridgeF", () => ({ map: fridgeTex() })),
      clockR: lam("kClockR", () => ({ color: "#3a3040" })),
      clockF: lam("kClockF", () => ({ map: clockTex() })),
      lamp: lam("kLamp", () => ({ color: "#f2b33d", side: THREE.DoubleSide })),
      cloth: lam("kCloth", () => ({ map: ginghamTex() })),
      towel: lam("kTowelM", () => ({ map: towelTex() })),
      bowl: lam("kBowl", () => ({ color: "#3f6fb5", side: THREE.DoubleSide })),
      apple: lam("kApple", () => ({ color: "#d8343a" })),
      appleG: lam("kAppleG", () => ({ color: "#8cc63f" })),
      orange: lam("kOrange", () => ({ color: "#f39a2c" })),
      banana: lam("kBanana", () => ({ color: "#f6d23a" })),
      leaf: lam("kLeaf", () => ({ color: "#4f9a44" })),
      pot: lam("kPot", () => ({ color: "#c8643e" })),
      mug: lam("kMug", () => ({ color: "#f5c22a" })),
      wicker: lam("kWicker", () => ({ color: "#c9965a" })),
    };

    // ---- shell: floor, ceiling, apricot walls with the window hole, tile backsplash over the counter ----
    walls.add(quad(V(-4, 0, 3), V(4, 0, 3), V(4, 0, -3), V(-4, 0, -3), 8, 6), M.floor);
    walls.add(quad(V(-4, 3.2, -3), V(4, 3.2, -3), V(4, 3.2, 3), V(-4, 3.2, 3), 8, 6), M.ceil);
    const back = (x0: number, x1: number, y0: number, y1: number) => walls.add(quad(V(x0, y0, -3), V(x1, y0, -3), V(x1, y1, -3), V(x0, y1, -3), x1, y1, x0, y0), M.wall);
    back(-4, WX0, 0, 3.2); back(WX1, 4, 0, 3.2); back(WX0, WX1, 0, WY0); back(WX0, WX1, WY1, 3.2);
    walls.add(quad(V(-4, 0, 3), V(-4, 0, -3), V(-4, 3.2, -3), V(-4, 3.2, 3), 6, 3.2), M.wall);
    walls.add(quad(V(4, 0, -3), V(4, 0, 3), V(4, 3.2, 3), V(4, 3.2, -3), 6, 3.2), M.wall);
    const TZ = -2.995;
    walls.add(quad(V(-4, CT, TZ), V(FX0, CT, TZ), V(FX0, WY0, TZ), V(-4, WY0, TZ), FX0 / 0.6, WY0 / 0.6, -4 / 0.6, CT / 0.6), M.tile);

    // ---- window over the sink: frame, cross bars, sill, mustard roman blind, the night city outside ----
    for (const [a, b] of [[V(WX0 - 0.06, WY0 - 0.05, -3.04), V(WX1 + 0.06, WY0, -2.86)], [V(WX0 - 0.06, WY1, -3.04), V(WX1 + 0.06, WY1 + 0.06, -2.95)],
      [V(WX0 - 0.06, WY0, -3.04), V(WX0, WY1, -2.95)], [V(WX1, WY0, -3.04), V(WX1 + 0.06, WY1, -2.95)],
      [V((WX0 + WX1) / 2 - 0.022, WY0, -3.03), V((WX0 + WX1) / 2 + 0.022, WY1, -2.99)], [V(WX0, 2.0, -3.03), V(WX1, 2.04, -2.99)]] as const) things.add(boxGeo(a, b), M.winF);
    for (let i = 0; i < 4; i++) { const y = WY1 - 0.04 - i * 0.045; things.add(boxGeo(V(WX0, y - 0.04, -2.97 + 0.004 * i), V(WX1, y, -2.94 + 0.004 * i)), M.blind); }
    const view = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: nightView(), color: new THREE.Color(0.95, 0.97, 1.05) }));
    view.position.set((WX0 + WX1) / 2, 1.95, -3.45); view.layers.set(NOINK); R.add(view);
    for (const [x, h] of [[-0.74, 0.1], [-0.5, 0.08], [-0.3, 0.11]] as const) {
      things.add(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 14), M.pot, new THREE.Matrix4().makeTranslation(x, WY0 + 0.04, -2.93));
      for (let k = 0; k < 4; k++) things.add(new THREE.SphereGeometry(0.032, 10, 8), M.leaf, new THREE.Matrix4().makeTranslation(x + 0.025 * Math.cos(k * 1.7), WY0 + 0.08 + h * 0.5 + 0.02 * k, -2.93 + 0.02 * Math.sin(k * 1.7)));
    }
    // wall clock above the window, ten past two at night
    const face = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 32); face.rotateX(Math.PI / 2);
    things.add(face, M.clockR, new THREE.Matrix4().makeTranslation(-0.52, 2.62, -2.98));
    things.add(new THREE.CircleGeometry(0.115, 32), M.clockF, new THREE.Matrix4().makeTranslation(-0.52, 2.62, -2.957));

    // ---- lower cabinets (teal shaker), drawers, brass pulls, butcher-block counter, plinth ----
    things.add(boxGeo(V(-4, 0, -2.98), V(FX0 - 0.02, 0.1, -2.47)), M.plinth);
    things.add(boxGeo(V(-4, 0.1, -2.98), V(FX0 - 0.02, CT - 0.06, -2.44)), M.cabD);
    for (let x1 = FX0 - 0.03; x1 > -2.4; x1 -= 0.42) {
      const x0 = x1 - 0.4;
      things.add(boxGeo(V(x0, 0.12, -2.44), V(x1, 0.66, -2.42)), M.cab);
      things.add(boxGeo(V(x0 + 0.06, 0.18, -2.42), V(x1 - 0.06, 0.6, -2.415)), M.cabD);
      things.add(boxGeo(V(x0, 0.68, -2.44), V(x1, CT - 0.075, -2.42)), M.cab);
      things.add(boxGeo(V((x0 + x1) / 2 - 0.08, 0.76, -2.42), V((x0 + x1) / 2 + 0.08, 0.775, -2.4)), M.brass);
      things.add(boxGeo(V(x1 - 0.07, 0.42, -2.42), V(x1 - 0.055, 0.58, -2.4)), M.brass);
    }
    things.add(boxGeo(V(-4, CT - 0.06, -3.0), V(FX0 - 0.01, CT, -2.38)), M.wood);
    things.add(boxGeo(V(-0.32, 0.5, -2.405), V(-0.14, 0.78, -2.398)), M.towel);
    // sink: steel rim, darker basin, arched chrome tap
    things.add(boxGeo(V(-0.8, CT, -2.92), V(-0.28, CT + 0.004, -2.48)), M.steel);
    things.add(boxGeo(V(-0.76, CT + 0.004, -2.88), V(-0.32, CT + 0.006, -2.52)), M.steelD);
    things.add(new THREE.CylinderGeometry(0.018, 0.022, 0.13, 12), M.chrome, new THREE.Matrix4().makeTranslation(-0.54, CT + 0.065, -2.93));
    const arch = new THREE.TorusGeometry(0.08, 0.012, 8, 20, Math.PI); arch.rotateY(Math.PI / 2);
    things.add(arch, M.chrome, new THREE.Matrix4().makeTranslation(-0.54, CT + 0.13, -2.85));
    things.add(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 10), M.chrome, new THREE.Matrix4().makeTranslation(-0.54, CT + 0.11, -2.77));
    things.add(boxGeo(V(-0.6, CT + 0.06, -2.95), V(-0.48, CT + 0.075, -2.93)), M.chrome);

    // ---- red kettle left of the microwave ----
    const KX = -0.19, KZ = -2.74;
    const kb = new THREE.LatheGeometry([[0, 0], [0.085, 0], [0.098, 0.04], [0.094, 0.12], [0.066, 0.17], [0.034, 0.19], [0, 0.195]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
    things.add(kb, M.kettle, new THREE.Matrix4().makeTranslation(KX, CT, KZ));
    things.add(new THREE.SphereGeometry(0.02, 10, 8), M.black, new THREE.Matrix4().makeTranslation(KX, CT + 0.205, KZ));
    things.add(new THREE.TorusGeometry(0.07, 0.011, 8, 16, Math.PI), M.black, new THREE.Matrix4().makeTranslation(KX, CT + 0.17, KZ));
    const sp = new THREE.CylinderGeometry(0.012, 0.022, 0.12, 10); sp.rotateZ(0.9); things.add(sp, M.kettle, new THREE.Matrix4().makeTranslation(KX - 0.12, CT + 0.11, KZ));
    things.add(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24), M.black, new THREE.Matrix4().makeTranslation(KX, CT + 0.006, KZ));

    // ---- cutting board leaning on the tiles between microwave and fridge ----
    const cb = boxGeo(V(-0.1, 0, -0.008), V(0.1, 0.34, 0.008)); cb.rotateX(-0.16); things.add(cb, M.woodD, new THREE.Matrix4().makeTranslation(0.73, CT, -2.93));

    // ---- spice shelf with jars and the cream upper cabinet above the microwave ----
    // (no shadows: the jars threw long blue streaks over the tiles)
    noCast.add(boxGeo(V(-0.02, 1.6, -3.0), V(0.8, 1.63, -2.83)), M.wood);
    for (const x of [0.04, 0.74]) noCast.add(boxGeo(V(x - 0.012, 1.5, -2.99), V(x + 0.012, 1.6, -2.86)), M.brass);
    const spice = ["#c8342a", "#f1b52a", "#5a8a3a", "#5a3a2a", "#a85a2a", "#f4efe4", "#7a2a3a"];
    spice.forEach((col, i) => {
      const x = 0.06 + i * 0.105, h = 0.08 + (i % 3) * 0.015;
      noCast.add(new THREE.CylinderGeometry(0.03, 0.03, h, 16), lam("kSp" + i, () => ({ color: col })), new THREE.Matrix4().makeTranslation(x, 1.63 + h / 2, -2.92));
      noCast.add(new THREE.CylinderGeometry(0.031, 0.031, 0.025, 16), i % 2 ? M.black : M.woodD, new THREE.Matrix4().makeTranslation(x, 1.63 + h + 0.012, -2.92));
      noCast.add(new THREE.CylinderGeometry(0.0305, 0.0305, 0.03, 16, 1, true), M.cream, new THREE.Matrix4().makeTranslation(x, 1.63 + h * 0.45, -2.92));
    });
    things.add(boxGeo(V(-0.06, 1.95, -3.0), V(0.84, 2.78, -2.7)), M.creamD);
    for (const [x0, x1] of [[-0.05, 0.38], [0.4, 0.83]]) {
      things.add(boxGeo(V(x0, 1.96, -2.7), V(x1, 2.77, -2.68)), M.cream);
      things.add(boxGeo(V(x0 + 0.06, 2.03, -2.68), V(x1 - 0.06, 2.7, -2.676)), M.creamD);
    }
    for (const x of [0.33, 0.45]) things.add(new THREE.SphereGeometry(0.016, 10, 8), M.brass, new THREE.Matrix4().makeTranslation(x, 2.08, -2.665));
    things.add(boxGeo(V(-0.09, 2.78, -3.0), V(0.87, 2.82, -2.66)), M.creamD);

    // ---- mint fridge with magnets, basket on top ----
    things.add(boxGeo(V(FX0, 0, -2.98), V(FX1, FH, FZ - 0.03)), M.fridge);
    things.add(boxGeo(V(FX0 + 0.01, 0.06, FZ - 0.03), V(FX1 - 0.01, 1.3, FZ)), M.fridge);
    things.add(boxGeo(V(FX0 + 0.01, 1.33, FZ - 0.03), V(FX1 - 0.01, FH - 0.02, FZ)), M.fridge);
    things.add(boxGeo(V(FX0, 0, FZ - 0.03), V(FX1, 0.06, FZ - 0.01)), M.fridgeD);
    walls.add(quad(V(FX0 + 0.02, 0.08, FZ + 0.001), V(FX1 - 0.02, 0.08, FZ + 0.001), V(FX1 - 0.02, 1.28, FZ + 0.001), V(FX0 + 0.02, 1.28, FZ + 0.001)), M.fridgeF);
    for (const [y0, y1] of [[0.85, 1.22], [1.4, 1.62]]) {
      things.add(boxGeo(V(FX0 + 0.04, y0, FZ + 0.03), V(FX0 + 0.065, y1, FZ + 0.05)), M.chrome);
      for (const y of [y0 + 0.02, y1 - 0.04]) things.add(boxGeo(V(FX0 + 0.045, y, FZ), V(FX0 + 0.06, y + 0.02, FZ + 0.03)), M.chrome);
    }
    for (const [x, y, m] of [[1.3, 1.72, M.kettle], [1.12, 1.5, M.mug]] as const) things.add(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 14).rotateX(Math.PI / 2), m, new THREE.Matrix4().makeTranslation(x, y, FZ + 0.007));
    things.add(boxGeo(V(1.3, FH, -2.85), V(1.48, FH + 0.12, -2.62)), M.wicker);

    // ---- the microwave (own group so it can jump): shell, panel, glowing cavity, turntable, egg, door ----
    const mwB = new Batch();
    mwB.add(boxGeo(V(X0, Y1 - 0.018, Z0), V(X1, Y1, Z1)), M.white);
    mwB.add(boxGeo(V(X0, Y0, Z0), V(X1, Y0 + 0.028, Z1)), M.white);
    mwB.add(boxGeo(V(X0, Y0, Z0), V(X0 + 0.018, Y1, Z1)), M.white);
    mwB.add(boxGeo(V(X0, Y0, Z0), V(X1, Y1, Z0 + 0.02)), M.white);
    mwB.add(boxGeo(V(X0 + DW, Y0, Z0), V(X1, Y1, Z1)), M.white);
    mwB.add(quad(V(X0 + DW + 0.006, Y0 + 0.012, Z1 + 0.002), V(X1 - 0.006, Y0 + 0.012, Z1 + 0.002), V(X1 - 0.006, Y1 - 0.012, Z1 + 0.002), V(X0 + DW + 0.006, Y1 - 0.012, Z1 + 0.002)), M.panel);
    for (const x of [X0 + 0.02, X1 - 0.02]) mwB.add(boxGeo(V(x - 0.015, Y0 - 0.006, Z1 - 0.06), V(x + 0.015, Y0, Z1 - 0.03)), M.gasket);
    for (let i = 0; i < 6; i++) mwB.add(boxGeo(V(X0 + DW + 0.02 + i * 0.016, Y1, Z0 + 0.06), V(X0 + DW + 0.028 + i * 0.016, Y1 + 0.002, Z0 + 0.2)), M.whiteD);
    mwB.build(this.mw, true);
    // glowing cavity walls (unlit, a little over 1 so the bloom picks them up; pulsed in tick)
    this.cavity = new THREE.MeshBasicMaterial({ map: cavityTex(), color: new THREE.Color(1.2, 1.05, 0.78) });
    const cw = DW - 0.018, cx = X0 + 0.018 + cw / 2, ch = Y1 - Y0 - 0.046, cy = Y0 + 0.028 + ch / 2, cd = Z1 - Z0 - 0.02, cz = Z0 + 0.02 + cd / 2;
    const cavWall = (w: number, h: number, pos: V3, rx: number, ry: number) => {
      const g = new THREE.PlaneGeometry(w, h); g.rotateX(rx); g.rotateY(ry);
      const m = new THREE.Mesh(g, this.cavity); m.position.set(...pos); this.mw.add(m);
    };
    cavWall(cw, ch, [cx, cy, Z0 + 0.021], 0, 0);
    cavWall(cw, cd, [cx, Y0 + 0.029, cz], -Math.PI / 2, 0);
    cavWall(cw, cd, [cx, Y1 - 0.019, cz], Math.PI / 2, 0);
    cavWall(cd, ch, [X0 + 0.019, cy, cz], 0, Math.PI / 2);
    cavWall(cd, ch, [X0 + DW - 0.001, cy, cz], 0, -Math.PI / 2);
    const lampDot = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.0, 1.5) }));
    lampDot.rotation.y = -Math.PI / 2; lampDot.position.set(X0 + DW - 0.002, Y1 - 0.06, Z0 + 0.09); lampDot.layers.set(NOINK); this.mw.add(lampDot);
    this.disp = new THREE.MeshBasicMaterial({ map: displayTex("0:14"), color: new THREE.Color(1.5, 1.5, 1.5) });
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.092, 0.031), this.disp);
    dm.position.set((X0 + DW + X1) / 2, Y1 - 0.042, Z1 + 0.004); dm.layers.set(NOINK); this.mw.add(dm);
    // turntable and the egg (lathe, its bottom at the origin so it rocks on the plate)
    this.plate.position.set(PX, PY, PZ); this.mw.add(this.plate);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.008, 40), M.plateM); pl.position.y = 0.006; this.plate.add(pl);
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI, y = -Math.cos(a); prof.push(new THREE.Vector2(0.026 * Math.sin(a) * (1 - 0.14 * y), 0.036 * (y + 1))); }
    this.egg = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), M.eggM);
    this.egg.position.set(0.032, 0.01, 0); this.plate.add(this.egg);
    // door: hinge at the left edge, frame with gasket, handle, glass with the dot screen
    this.door.position.set(X0, Y0, Z1); this.mw.add(this.door);
    const dB = new Batch();
    dB.add(boxGeo(V(0, 0, 0), V(0.035, DH, 0.022)), M.white);
    dB.add(boxGeo(V(0.345, 0, 0), V(DW, DH, 0.022)), M.white);
    dB.add(boxGeo(V(0.035, 0, 0), V(0.345, 0.045, 0.022)), M.white);
    dB.add(boxGeo(V(0.035, 0.265, 0), V(0.345, DH, 0.022)), M.white);
    for (const [a, b] of [[V(0.035, 0.045, 0.018), V(0.345, 0.052, 0.024)], [V(0.035, 0.258, 0.018), V(0.345, 0.265, 0.024)],
      [V(0.035, 0.045, 0.018), V(0.042, 0.265, 0.024)], [V(0.338, 0.045, 0.018), V(0.345, 0.265, 0.024)]] as const) dB.add(boxGeo(a, b), M.gasket);
    dB.add(boxGeo(V(0.356, 0.05, 0.035), V(0.374, 0.26, 0.05)), M.whiteD);
    for (const y of [0.06, 0.24]) dB.add(boxGeo(V(0.358, y, 0.022), V(0.372, y + 0.012, 0.036)), M.whiteD);
    dB.build(this.door, false); // edge-on when open, its shadow was a thin blue streak
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.22), new THREE.MeshBasicMaterial({ map: glassTex(), transparent: true, depthWrite: false }));
    glass.position.set(0.19, 0.155, 0.014); glass.layers.set(NOINK); glass.renderOrder = 3; this.door.add(glass);

    // ---- splat decals: lit cut-out cards on the surfaces, hidden until their bit lands ----
    const dripM = lam("kDripM", () => ({ map: dripTex(), alphaTest: 0.5 }));
    const decal = (parent: THREE.Object3D, at: V3, kind: "v" | "h" | "x", w: number, rot: number, v: number, t: number, drip: number) => {
      const mat = lam("kSplM" + (v % 2), () => ({ map: splatTex(v % 2), alphaTest: 0.5 }));
      const g = new THREE.PlaneGeometry(w, w * 0.6); g.rotateZ(rot);
      if (kind === "h") g.rotateX(-Math.PI / 2);
      if (kind === "x") g.rotateY(Math.PI / 2);
      const m = new THREE.Mesh(g, mat); m.position.set(...at); m.layers.set(NOINK); m.visible = false; parent.add(m);
      const d: Decal = { m, t };
      if (drip) {
        const dg = new THREE.PlaneGeometry(w * 0.5, w * 0.8); dg.translate(0, -w * 0.4, 0);
        d.drip = new THREE.Mesh(dg, dripM); d.drip.position.set(at[0] + 0.02 * Math.sin(rot * 3), at[1] - w * 0.12, at[2] + 0.001);
        d.drip.layers.set(NOINK); d.drip.visible = false; parent.add(d.drip);
      }
      this.decals.push(d);
    };
    // inside: on the door glass (seen through it), the cavity back and left wall, the plate
    decal(this.door, [0.11, 0.18, 0.004], "v", 0.13, 0.3, 0, BURST + 1, 0);
    decal(this.door, [0.28, 0.09, 0.005], "v", 0.1, -0.5, 1, BURST + 1, 0);
    decal(this.door, [0.27, 0.22, 0.006], "v", 0.08, 2.2, 0, BURST + 2, 0);
    decal(this.mw, [cx - 0.06, cy + 0.03, Z0 + 0.024], "v", 0.15, 0.2, 1, BURST + 1, 1);
    decal(this.mw, [cx + 0.1, cy - 0.05, Z0 + 0.025], "v", 0.13, -0.7, 0, BURST + 2, 0);
    decal(this.mw, [X0 + 0.022, cy, cz], "x", 0.16, 0.4, 1, BURST + 2, 0);
    decal(this.plate, [0.02, 0.012, 0], "h", 0.16, 0.5, 0, BURST + 1, 0);
    // outside: everywhere
    HITS.forEach((h, i) => decal(R, h.at, h.kind, h.w, h.rot, i, h.t, h.drip));

    // ---- pendant lamp: mustard dome, cord, glowing bulb ----
    noCast.add(boxGeo(V(LX - 0.005, LY + 0.17, LZ - 0.005), V(LX + 0.005, 3.2, LZ + 0.005)), M.black);
    const dome = new THREE.SphereGeometry(0.21, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 0.75, 1);
    noCast.add(dome, M.lamp, new THREE.Matrix4().makeTranslation(LX, LY, LZ));
    noCast.add(new THREE.CylinderGeometry(0.03, 0.04, 0.05, 14), M.black, new THREE.Matrix4().makeTranslation(LX, LY + 0.17, LZ));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 1.2) }));
    bulb.position.set(LX, LY - 0.01, LZ); bulb.layers.set(NOINK); R.add(bulb);

    // ---- table in the foreground: gingham top, legs, fruit bowl, mug ----
    things.add(boxGeo(V(-0.95, TY - 0.04, -0.85), V(1.15, TY, 0.3)), M.cloth);
    for (const [x, z] of [[-0.88, -0.78], [1.08, -0.78], [-0.88, 0.22], [1.08, 0.22]]) things.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, TY - 0.04, z + 0.03)), M.woodD);
    const BX = 0.05, BZ = -0.42;
    const bowl = new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.12, 0.04], [0.16, 0.1], [0.165, 0.105]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    things.add(bowl, M.bowl, new THREE.Matrix4().makeTranslation(BX, TY, BZ));
    for (const [dx, dy, dz, r, m] of [[-0.05, 0.08, 0.02, 0.05, M.orange], [0.05, 0.08, -0.03, 0.048, M.apple], [0.0, 0.09, 0.06, 0.046, M.appleG],
      [0.06, 0.12, 0.05, 0.044, M.orange], [-0.04, 0.13, -0.05, 0.045, M.apple]] as const)
      things.add(new THREE.SphereGeometry(r, 16, 12), m, new THREE.Matrix4().makeTranslation(BX + dx, TY + dy, BZ + dz));
    const ban = new THREE.TorusGeometry(0.12, 0.022, 8, 16, Math.PI * 0.6); ban.rotateZ(Math.PI * 1.2); ban.rotateX(0.5);
    things.add(ban, M.banana, new THREE.Matrix4().makeTranslation(BX, TY + 0.25, BZ));
    things.add(new THREE.CylinderGeometry(0.042, 0.038, 0.1, 18), M.mug, new THREE.Matrix4().makeTranslation(0.68, TY + 0.05, -0.32));

    // ---- CC0 furniture ----
    const P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("chair", -0.5, 0, -1.1, 0.92, Math.PI);
    P("chair", 0.75, 0, -1.12, 0.92, Math.PI + 0.3);
    P("pottedPlant", -1.25, 0, -2.2, 1.1);
    P("books", -1.1, CT, -2.85, 0.2, 0.2);
    P("trashcan", 1.7, 0, -2.6, 0.5);

    // ---- glows (additive, unlit): lamp pools on counter and table, microwave light, flash, bulb halo ----
    const add = (col: THREE.Color) => new THREE.MeshBasicMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pool = (w: number, h: number, col: THREE.Color, pos: V3) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), add(col)); m.rotation.x = -Math.PI / 2; m.position.set(...pos); m.layers.set(NOINK); R.add(m); };
    pool(1.6, 0.9, new THREE.Color(0.36, 0.24, 0.1), [LX, CT + 0.006, -2.62]);
    pool(1.6, 1.0, new THREE.Color(0.3, 0.2, 0.08), [LX + 0.1, TY + 0.004, -0.45]);
    pool(0.6, 0.32, new THREE.Color(0.5, 0.36, 0.12), [0.28, CT + 0.007, -2.4]);
    this.winGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55), add(new THREE.Color(0.45, 0.32, 0.12)));
    this.flash = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.26), add(new THREE.Color(3, 3, 2.6)));
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add(new THREE.Color(0.9, 0.85, 0.7)));
    this.bulbGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), add(new THREE.Color(0.9, 0.62, 0.3)));
    this.flash.position.set(cx, cy, Z1 - 0.05);
    this.bulbGlow.position.set(LX, LY - 0.02, LZ + 0.02);
    for (const m of [this.winGlow, this.flash, this.halo, this.bulbGlow]) { m.layers.set(NOINK); m.renderOrder = 5; R.add(m); }
    this.flash.visible = this.halo.visible = false;

    R.add(this.mw);
    walls.build(R, false);
    things.build(R, true);
    glow.build(R, false);
    noCast.build(R, false);
  }

  protected tick(_id: number, f: number) {
    // display counts down from 0:14, frozen and blinking after the burst
    const sec = Math.max(0, 14 - Math.floor((Math.min(f, BURST) - S16) / 30));
    this.disp.map = displayTex(f >= BURST && (f >> 3) % 2 ? "    " : `0:${String(sec).padStart(2, "0")}`);
    // glow pulse while cooking; brighter and whiter in the burst
    const pulse = 1 + 0.07 * Math.sin(f / 4.5) + 0.04 * Math.sin(f / 1.7), fl = f >= BURST ? Math.max(0, 1 - (f - BURST) / 5) ** 2 : 0;
    this.cavity.color.setRGB(1.2 * pulse + 0.6 * fl, 1.05 * pulse + 0.7 * fl, 0.78 * pulse + 0.9 * fl);
    this.plate.rotation.y = (f - S16) * 0.035;
    // the egg rocks more and more, swells a little, hops on "Ei"; gone after the burst
    const k = clamp01((f - S16) / (BURST - S16)), amp = 0.03 + 0.32 * k * k, w = 0.7 + 0.9 * k;
    this.egg.visible = f < BURST;
    this.egg.rotation.set(amp * 0.6 * Math.cos(f * w * 1.13), 0, amp * Math.sin(f * w));
    const hop = Math.max(0, Math.sin(Math.PI * clamp01((f - (EI - 4)) / 8))) * 0.012 + (k > 0.75 ? 0.004 * Math.abs(Math.sin(f * 1.9)) : 0);
    this.egg.position.y = 0.01 + hop;
    const sw = 1 + 0.12 * k ** 3; this.egg.scale.set(sw, 1 + 0.08 * k ** 3, sw);
    // microwave jumps at the burst; door jolts, then bangs open on "nicht"
    const jb = f >= BURST ? Math.max(0, 1 - (f - BURST) / 6) : 0;
    this.mw.position.set(0.006 * jb * (f % 2 ? 1 : -1), 0.014 * jb, 0);
    const open = f >= BANG ? ease.back((f - BANG) / 7, 1.4) : 0;
    this.door.rotation.y = -0.16 * jb * Math.cos((f - BURST) * 1.6) - 1.85 * open;
    this.flash.visible = this.halo.visible = fl > 0;
    this.halo.position.set(X0 + DW / 2, Y0 + DH / 2, Z1 + 0.08); this.halo.scale.setScalar(0.25 + 0.4 * fl);
    (this.flash.material as THREE.MeshBasicMaterial).color.setRGB(1.6 * fl, 1.6 * fl, 1.4 * fl);
    this.winGlow.position.set(X0 + DW / 2 - 0.03 * open, Y0 + DH / 2, Z1 + 0.05);
    (this.winGlow.material as THREE.MeshBasicMaterial).color.setRGB(0.45 * pulse, 0.32 * pulse, 0.12 * pulse);
    // decals pop in with an overshoot, drips run down
    for (const d of this.decals) {
      const on = f >= d.t;
      d.m.visible = on; d.m.scale.setScalar(on ? Math.max(0.05, ease.back((f - d.t) / 5, 2)) : 1);
      if (d.drip) { const u = ease.out((f - d.t - 3) / 34); d.drip.visible = on && u > 0.02; d.drip.scale.set(1, Math.max(0.02, u), 1); }
    }
  }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    for (const m of [this.halo, this.bulbGlow, this.winGlow]) m.quaternion.copy(cam.quaternion);
    return r;
  }
  protected stage(_id: number, f: number, light: number) { return kitchenStage(f, light); }
}

// ---------------- who stands where ----------------
const kitchenStage = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] }, L = q(light);
  // the cat on the fridge: asleep, then up at the bang, then hit and shocked (hops)
  const st = f >= CAT_HIT ? 2 : f >= BANG + 4 ? 1 : 0, hop = f >= CAT_HIT ? 0.05 * Math.max(0, Math.sin(Math.PI * clamp01((f - CAT_HIT) / 7))) : 0;
  out.places.push({ key: `CAT|${st}|${L}`, x: CAT[0], y: CAT[1] + hop, z: CAT[2], scale: 0.3, draw: drawCat(st, L) });
  contact(out, CAT[0], FH, CAT[2], 0.32);
  // the burst inside: bits shooting out from the egg for a few frames
  if (f >= BURST && f < BURST + 5) {
    const u = (f - BURST) / 5, a0 = (f - S16) * 0.035;
    const ex = PX + 0.032 * Math.cos(a0), ez = PZ - 0.032 * Math.sin(a0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.4;
      card(out, `bit|${i % 3}`, 128, 128, drawBit(i % 3), ex + 0.16 * u * Math.cos(a), PY + 0.05 + 0.1 * u * Math.sin(a), ez + 0.1 * u, 0.025, false, f * 0.6 + i);
    }
  }
  // after the bang: bits fly from the open door to every splat, then a few strays
  HITS.forEach((h, i) => {
    const u = (f - (h.t - 7)) / 7;
    if (u < 0 || u >= 1) return;
    const p = flight(MOUTH, h.at, ease.out(u * 0.9), 0.18 + 0.05 * (i % 3));
    card(out, `bit|${i % 3}`, 128, 128, drawBit(i % 3), p[0], p[1], p[2], 0.06, false, f * 0.5 + i);
  });
  const cu = (f - (CAT_HIT - 7)) / 7;
  if (cu >= 0 && cu < 1) { const p = flight(MOUTH, [CAT[0], CAT[1] + 0.25, CAT[2]], cu, 0.3); card(out, "bit|0", 128, 128, drawBit(0), p[0], p[1], p[2], 0.07, false, f * 0.5); }
  STRAYS.forEach((s, i) => {
    const u = (f - s.t0) / s.dur;
    if (u < 0 || u >= 1) return;
    const p = flight(MOUTH, s.to, u, 0.25);
    card(out, `bit|${(i + 1) % 3}`, 128, 128, drawBit((i + 1) % 3), p[0], p[1], p[2], 0.06, false, f * 0.4 + i);
  });
  // steam out of the open door
  if (f >= BANG) for (let i = 0; i < 4; i++) {
    const t = ((f - BANG) * 0.02 + i / 4) % 1;
    card(out, "steam", 128, 128, steam, MOUTH[0] + 0.05 * Math.sin(t * 5 + i), MOUTH[1] + 0.05 + 0.5 * t, MOUTH[2] + 0.05, 0.12 + 0.2 * t, true);
  }
  // drops falling from the lamp's drips after "überall"
  for (let i = 0; i < 4; i++) {
    const t0 = UEBERALL + 8 + i * 9, dt = f - t0;
    if (dt < 0 || dt > 20) continue;
    card(out, "drop", 64, 100, drawDrop, LX - 0.03 + 0.05 * (i % 2), LY - 0.05 - 0.0055 * dt * dt, LZ + 0.22, 0.03);
  }
  return out;
};
