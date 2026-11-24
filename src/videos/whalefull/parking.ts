// The beach parking lot of the whale short, 1970 (shots 12, 13, 19), built in code: a gravel lot behind grassy dunes
// with white parking lines and concrete wheel stops, three wood-panelled station wagons parked at an angle, a split-rail
// fence, a snack kiosk with a striped awning, a "P" sign, a beach-access sign, a surfboard, wooden utility poles with
// sagging wires, beach grass, the dunes and (shots 12, 13) the blast's dust column far behind them.
// Shot 12: 3D blubber chunks rain down, four spectators run across in panic, chunks splat onto the wagon roofs.
// Shot 13: the brand-new green sedan with a red gift bow; a 1.6 m chunk falls and flattens it on "zertrümmert" (the body
// folds, the cabin squashes, glass shards, boom star, sand puffs, the bow flies onto the hood); push in on the bow.
// Shot 19: the wreck; the veteran walks in with his one red stick, stops beside it, turns to the lens on "Mann";
// slow final push onto his deadpan face. World units are metres, the camera looks roughly toward -z.
import * as THREE from "three";
import { Batch, Kit, V, boxGeo, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { placeProp } from "../pigeon/props";
import { Pen, FrontOpts, Outfit, bodyFront, bodySide } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, personAt, contact, card, flatCard, V3, clamp01, ease, LEAD, blinkAt } from "./room";
import { VET, crowd, drawBoom, drawStink } from "../whale/draw";
import { A, beat } from "./shots";

const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const rad = (d: number) => (d * Math.PI) / 180;

const LEUTE = beat(12, "Leute"), PARK = beat(12, "Parkplatz");
const ZERT = beat(13, "zertrümmert"), NAGEL = beat(13, "nagelneues");
const GEH = beat(19, "gehörte"), MANN = beat(19, "Mann"), HATTE = beat(19, "hatte");
/** the giant chunk hits the roof 2 frames before "zertrümmert" */
const IMP = ZERT - LEAD;

// ---------------- layout ----------------
/** the new sedan: its own space at the end of the row, nose out toward the lane (front points to +x+z) */
const S = { x: 1.0, z: -4.4, yaw: rad(-60) };
const CY = Math.cos(S.yaw), SY = Math.sin(S.yaw);
/** sedan-local (x forward, y up, z right) to world */
const L2W = (lx: number, ly: number, lz: number): V3 => [S.x + lx * CY + lz * SY, ly, S.z - lx * SY + lz * CY];
/** the three station wagons in the same row */
const WAGONS: { x: number; col: string }[] = [{ x: -8, col: "#d9a441" }, { x: -5, col: "#7fb2d8" }, { x: -2, col: "#c8643a" }];
const ROW_Z = S.z;
const WAGON_ROOF = 1.47;
/** the veteran's mark beside the wreck (in front of its right side, toward the lens) */
const VP = L2W(1.3, 0, 1.75);
const FACE: V3 = [VP[0], 1.42, VP[2]];
/** the bow lying crumpled on the hood */
const BOW_HOOD = L2W(1.55, 0, 0.12);

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  // up at the sky raining blubber over the dunes and the dust column; down onto the fleeing people on "Leute"; up and
  // back to the whole lot on "Parkplatz" as chunks land on the roofs
  12: { keys: [
    { f: A(12), pos: [-2.6, 1.25, 6.8], look: [-4.2, 4.6, -12], fov: 50 },
    { f: LEUTE - 10, dur: 12, pos: [-2.3, 1.55, 6.0], look: [-3.4, 1.45, -2], fov: 46 },
    { f: PARK - 6, dur: 16, pos: [0.4, 3.0, 8.6], look: [-2.4, 0.9, -4.6], fov: 50 },
  ], creep: 0.0008, punch: [PARK], cInf: [3.5, 4.5, 3.5] },
  // the new car, looking up where the chunk comes from; tilt down with it; kick on the hit; push in on the bow
  13: { keys: [
    { f: A(13), pos: [-0.4, 1.2, 2.6], look: [1.3, 3.8, -4.4], fov: 50 },
    { f: A(13) + 7, dur: 12, pos: [-0.5, 1.6, 2.9], look: [1.3, 1.15, -4.4], fov: 46 },
    { f: NAGEL - 8, dur: 10, pos: [BOW_HOOD[0] - 1.2, 2.1, BOW_HOOD[2] + 3.4], look: [BOW_HOOD[0], 0.95, BOW_HOOD[2] - 0.4], fov: 44 },
  ], creep: 0.0008, kicks: [ZERT, ZERT + 4], punch: [NAGEL], cInf: [4, 5, 7] },
  // the wreck; the veteran walks in and stops; medium on "Mann"; slow push onto his face on "hatte"
  19: { keys: [
    { f: A(19), pos: [-1.4, 1.65, 3.2], look: [0.7, 1.1, -3.9], fov: 48 },
    { f: MANN - 6, dur: 12, pos: [FACE[0] - 1.3, 1.6, FACE[2] + 3.4], look: [FACE[0] - 0.25, 1.22, FACE[2]], fov: 44 },
    { f: HATTE - 4, dur: 28, pos: [FACE[0] - 0.3, 1.55, FACE[2] + 2.1], look: [FACE[0] + 0.12, 1.35, FACE[2]], fov: 42 },
  ], creep: 0.0006, cInf: [5, 6, 8] },
};
export const parkingCam = camOf(CAMS);
export const parkingDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const gravelTex = () => ctex("pkGravel", 1024, 1024, (g, r) => {
  g.fillStyle = "#c2ad8b"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 14; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,128,100,0.25)" : "rgba(226,206,170,0.3)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 80 + r() * 160, 50 + r() * 90, r() * 3, 0, 7); g.fill(); }
  const cols = ["#9c8c78", "#d8c7a8", "#8a7d70", "#b5a084", "#e6d8bc", "#a89480", "#7f7a86"];
  for (let i = 0; i < 9000; i++) {
    const x = r() * 1024, y = r() * 1024, s = 2 + r() * 5;
    g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.ellipse(x, y, s, s * (0.6 + r() * 0.4), r() * 3, 0, 7); g.fill();
  }
  g.strokeStyle = "rgba(120,100,80,0.18)"; g.lineWidth = 26;
  for (let k = 0; k < 3; k++) { const y = 200 + k * 300 + r() * 60; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 60, 700, y - 60, 1024, y + 10); g.stroke(); }
});
const sandTex = () => ctex("pkSand", 1024, 1024, (g, r) => {
  g.fillStyle = "#ecca90"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2400; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,120,70,0.13)" : "rgba(255,242,210,0.2)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 7, 1 + r() * 3); }
  g.strokeStyle = "rgba(176,128,78,0.22)"; g.lineWidth = 4;
  for (let i = 0; i < 22; i++) { const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 12 * Math.sin(x / 80 + i)); g.stroke(); }
  for (let i = 0; i < 50; i++) {
    const cx = r() * 1024, cy = r() * 1024, s = 30 + r() * 80;
    g.fillStyle = "rgba(122,150,62,0.55)"; g.beginPath(); g.ellipse(cx, cy, s, s * 0.6, r() * 3, 0, 7); g.fill();
    g.strokeStyle = i % 2 ? "#6f8f36" : "#9cb653"; g.lineWidth = 3;
    for (let k = 0; k < 14; k++) { const x = cx + (r() - 0.5) * s * 1.5, y = cy + (r() - 0.5) * s * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 14, y - 12 - r() * 14); g.stroke(); }
  }
});
const woodTex = () => ctex("pkWoodPanel", 256, 256, (g, r) => {
  g.fillStyle = "#9a5a2e"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) {
    g.strokeStyle = r() < 0.5 ? "rgba(90,46,20,0.35)" : "rgba(196,130,80,0.3)"; g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + 3 * Math.sin(x / 40 + y)); g.stroke();
  }
  g.fillStyle = "rgba(70,36,16,0.5)"; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 3, 256);
  for (let i = 0; i < 5; i++) { g.strokeStyle = "rgba(80,40,18,0.45)"; g.lineWidth = 2; g.beginPath(); g.ellipse(r() * 256, r() * 256, 10, 5, 0, 0, 7); g.stroke(); }
});
const plankTex = () => ctex("pkPlank", 512, 512, (g, r) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = ["#d9b88a", "#cfa978", "#e2c398"][i % 3]; g.fillRect(i * 64, 0, 64, 512); g.fillStyle = "rgba(90,60,40,0.55)"; g.fillRect(i * 64, 0, 4, 512); }
  g.strokeStyle = "rgba(120,80,50,0.25)"; g.lineWidth = 2;
  for (let i = 0; i < 80; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + 40 + r() * 60); g.stroke(); }
});
const stripeTex = () => ctex("pkStripe", 512, 64, (g) => {
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#f7f0e2" : "#e0503a"; g.fillRect((i * 512) / 12, 0, 512 / 12 + 1, 64); }
});
const pSignTex = () => ctex("pkPSign", 256, 256, (g) => {
  g.fillStyle = "#f4f1e8"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#2a5fb0"; g.fillRect(14, 14, 228, 228);
  g.fillStyle = "#ffffff"; g.font = "bold 200px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("P", 128, 140);
});
/** beach access board: waves and a sun, an arrow pointing over the dunes */
const beachSignTex = () => ctex("pkBeachSign", 512, 256, (g) => {
  g.fillStyle = "#f3e6c4"; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "#6a4426"; g.lineWidth = 16; g.strokeRect(8, 8, 496, 240);
  g.fillStyle = "#f2b234"; g.beginPath(); g.arc(120, 100, 44, 0, 7); g.fill();
  g.strokeStyle = "#2f88c0"; g.lineWidth = 14;
  for (let k = 0; k < 2; k++) { g.beginPath(); for (let x = 50; x <= 220; x += 10) g.lineTo(x, 170 + k * 34 + 10 * Math.sin(x / 14)); g.stroke(); }
  g.fillStyle = "#c0392b"; g.beginPath(); g.moveTo(270, 100); g.lineTo(390, 100); g.lineTo(390, 60); g.lineTo(470, 128); g.lineTo(390, 196); g.lineTo(390, 156); g.lineTo(270, 156); g.closePath(); g.fill();
});
const glassBrokenTex = () => ctex("pkGlassBroken", 256, 256, (g, r) => {
  g.fillStyle = "#6f8e9c"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(240,250,255,0.85)"; g.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    const cx = r() * 256, cy = r() * 256;
    for (let i = 0; i < 9; i++) { const a = r() * 7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120); g.stroke(); }
  }
});
/** sky dome: zenith at the top, horizon at 50 %, a band of blue forested headlands peeking over the dunes, clouds */
const skyTex = () => ctex("pkSky", 2048, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#3f7fd8"); gr.addColorStop(0.28, "#7fb2ea"); gr.addColorStop(0.44, "#f6d6ae"); gr.addColorStop(0.5, "#fff1de"); gr.addColorStop(1, "#fff1de");
  g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
  const cloud = (cx: number, cy: number, s: number) => {
    for (let i = 0; i < 9; i++) {
      const x = cx + (i - 4) * 34 * s + (r() - 0.5) * 20 * s, y = cy - Math.sin((i / 8) * Math.PI) * 40 * s, rr = (34 + r() * 22) * s;
      g.fillStyle = "#c9b8d8"; g.beginPath(); g.arc(x - 6 * s, y + 8 * s, rr, 0, 7); g.fill();
      g.fillStyle = "#fbf6ee"; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
    }
  };
  for (let i = 0; i < 9; i++) cloud(i * 230 + r() * 120, 140 + r() * 200, 0.35 + r() * 0.35);
  for (let i = 0; i < 30; i++) cloud(i * 70 + r() * 40, 400 + r() * 40, 0.2 + r() * 0.2);
  for (const [base, col, amp] of [[478, "#8fa9b8", 26], [492, "#5f8a78", 18]] as const) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 520);
    for (let x = 0; x <= 2048; x += 8) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x / 140)) - 10 * Math.sin(x / 37) - (Math.floor(x / 8) % 3 === 0 ? 6 : 0));
    g.lineTo(2048, 520); g.closePath(); g.fill();
  }
});

// ---------------- 2D effect drawings ----------------
const splat = (p: Pen) => {
  p.poly(Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2, r = 88 + 32 * Math.sin(k * 2.3) + (k % 3 ? 0 : 22); return [128 + r * Math.cos(a), 128 + r * Math.sin(a)] as [number, number]; }), "#b9655a", 0);
  p.ell(110, 112, 34, 22, "#cf7c6e", 0);
};
const shard = (k: number) => (p: Pen) => {
  const pts: [number, number][] = [[20 + 20 * hash(k, 1), 110], [64, 8 + 20 * hash(k, 2)], [110, 90 + 20 * hash(k, 3)]];
  p.poly(pts, "#d4f1fb", 6);
  p.stroke([[pts[0][0] + 14, pts[0][1] - 12], [60, 34]], 5, "#ffffff");
};
const sparkle = (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? 14 : 60; pts.push([64 + r * Math.cos(a), 64 + r * Math.sin(a)]); }
  p.poly(pts, "#fffbe6", 0);
};
const fly = (p: Pen) => { p.ell(40, 30, 16, 10, "#d9e8f2", 3); p.ell(40, 46, 11, 9, "#2e2a36", 0); };

// ---------------- cars ----------------
type Add = (part: string, geo: THREE.BufferGeometry, mat: THREE.Material) => void;
type CarMats = { body: THREE.Material; glass: THREE.Material; chrome: THREE.Material; tyre: THREE.Material; white: THREE.Material; grille: THREE.Material;
  head: THREE.Material; tail: THREE.Material; seam: THREE.Material; wood?: THREE.Material; trim?: THREE.Material };
const WHEELS: [number, number][] = [[1.45, 0.86], [1.45, -0.86], [-1.45, 0.86], [-1.45, -0.86]];
const archY = (x: number) => { for (const cx of [-1.45, 1.45]) { const d = x - cx; if (Math.abs(d) < 0.44) return 0.24 + Math.sqrt(0.44 * 0.44 - d * d); } return 0.27; };
const TOP: [number, number][] = [[-2.5, 0.76], [-2.42, 0.88], [-1.3, 0.89], [0.95, 0.87], [2.36, 0.84], [2.5, 0.74]];
const topY = (x: number) => { for (let i = 1; i < TOP.length; i++) if (x <= TOP[i][0]) { const [x0, y0] = TOP[i - 1], [x1, y1] = TOP[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return TOP[TOP.length - 1][1]; };
/** side profile between xa and xb (bottom with wheel arches, top along the belt), extruded across z0..z1 */
const profile = (xa: number, xb: number, bot: (x: number) => number, top: (x: number) => number, z0: number, z1: number) => {
  const xs: number[] = [];
  for (let x = xa; x < xb - 1e-6; x += 0.04) xs.push(x);
  xs.push(xb);
  const sh = new THREE.Shape();
  xs.forEach((x, i) => (i ? sh.lineTo(x, bot(x)) : sh.moveTo(x, bot(x))));
  for (let i = xs.length - 1; i >= 0; i--) sh.lineTo(xs[i], top(xs[i]));
  const g = new THREE.ExtrudeGeometry(sh, { depth: z1 - z0, bevelEnabled: false }); g.translate(0, 0, z0);
  return g;
};
/** a thin box from a to b (side-view points) at depth z: pillars */
const bar = (a: [number, number], b: [number, number], z: number, w = 0.075, d = 0.05) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), g = new THREE.BoxGeometry(len, w, d);
  g.rotateZ(Math.atan2(b[1] - a[1], b[0] - a[0])); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
  return g;
};
/** a 1970 full-size sedan or station wagon in car coordinates (x forward, z right, ground y = 0). Parts: bodyF/bodyR
 *  (front and rear half, so the crushed car can fold), cabin, glass, w0..w3 (around their own wheel centre) */
const buildCar = (add: Add, M: CarMats, wagon: boolean) => {
  add("bodyR", profile(-2.5, 0, archY, topY, -0.95, 0.95), M.body);
  add("bodyF", profile(0, 2.5, archY, topY, -0.95, 0.95), M.body);
  const half = (x: number) => (x >= 0 ? "bodyF" : "bodyR");
  add("bodyF", boxGeo(V(2.44, 0.3, -0.99), V(2.62, 0.47, 0.99)), M.chrome);
  add("bodyR", boxGeo(V(-2.6, 0.3, -0.99), V(-2.44, 0.47, 0.99)), M.chrome);
  add("bodyF", boxGeo(V(2.5, 0.49, -0.58), V(2.53, 0.72, 0.58)), M.grille);
  for (let k = 0; k < 4; k++) add("bodyF", boxGeo(V(2.53, 0.52 + k * 0.055, -0.56), V(2.545, 0.535 + k * 0.055, 0.56)), M.chrome);
  for (const s of [-1, 1]) {
    const hl = new THREE.CylinderGeometry(0.105, 0.105, 0.05, 16); hl.rotateZ(Math.PI / 2); hl.translate(2.5, 0.62, s * 0.76); add("bodyF", hl, M.head);
    const rim = new THREE.TorusGeometry(0.11, 0.018, 6, 16); rim.rotateY(Math.PI / 2); rim.translate(2.52, 0.62, s * 0.76); add("bodyF", rim, M.chrome);
    add("bodyR", boxGeo(V(-2.53, 0.55, s > 0 ? 0.6 : -0.92), V(-2.49, 0.78, s > 0 ? 0.92 : -0.6)), M.tail);
    for (const x of wagon ? [0.93, -0.3, -1.4] : [0.93, -0.22, -1.32]) add(half(x), boxGeo(V(x - 0.008, 0.36, s * 0.95 - 0.006), V(x + 0.008, 0.86, s * 0.95 + 0.006)), M.seam);
    for (const x of [0.72, -0.48]) add(half(x), boxGeo(V(x - 0.1, 0.76, s * 0.95 - 0.02), V(x + 0.03, 0.79, s * 0.95 + 0.02)), M.chrome);
  }
  if (wagon && M.wood && M.trim) {
    const pb = (x: number) => Math.max(0.5, archY(x) + 0.04);
    for (const s of [-1, 1]) {
      const z0 = s > 0 ? 0.951 : -0.965, z1 = z0 + 0.014;
      add("bodyR", profile(-2.32, 0, pb, () => 0.83, z0, z1), M.wood);
      add("bodyF", profile(0, 2.2, pb, () => 0.83, z0, z1), M.wood);
      const zt0 = s > 0 ? 0.962 : -0.98, zt1 = zt0 + 0.018;
      add("bodyR", boxGeo(V(-2.34, 0.82, zt0), V(0, 0.855, zt1)), M.trim); add("bodyF", boxGeo(V(0, 0.82, zt0), V(2.22, 0.855, zt1)), M.trim);
      for (const x of [-2.32, -1.4, -0.3, 0.93, 2.2]) add(half(x), boxGeo(V(x - 0.025, Math.max(0.5, archY(x) + 0.04), zt0), V(x + 0.025, 0.84, zt1)), M.trim);
      for (const [a, b] of [[-2.32, -1.92], [-0.98, 0.98], [1.92, 2.2]]) add(half((a + b) / 2), boxGeo(V(a, 0.48, zt0), V(b, 0.515, zt1)), M.trim);
    }
  } else {
    for (const s of [-1, 1]) {
      add("bodyR", boxGeo(V(-2.45, 0.6, s * 0.95 - 0.012), V(0, 0.625, s * 0.95 + 0.012)), M.chrome);
      add("bodyF", boxGeo(V(0, 0.6, s * 0.95 - 0.012), V(2.42, 0.625, s * 0.95 + 0.012)), M.chrome);
    }
  }
  const roofY = wagon ? 1.41 : 1.37, xr0 = wagon ? -2.28 : -0.85, xr1 = 0.45, xb0 = wagon ? -2.36 : -1.32;
  const gh = new THREE.Shape(); gh.moveTo(xb0, 0.88); gh.lineTo(0.95, 0.87); gh.lineTo(xr1, roofY); gh.lineTo(xr0, roofY); gh.closePath();
  const ghg = new THREE.ExtrudeGeometry(gh, { depth: 1.62, bevelEnabled: false }); ghg.translate(0, 0, -0.81); add("glass", ghg, M.glass);
  add("cabin", boxGeo(V(xr0 - 0.04, roofY - 0.01, -0.85), V(xr1 + 0.04, roofY + 0.05, 0.85)), M.body);
  for (const s of [-1, 1]) {
    const z = s * 0.815;
    add("cabin", bar([0.95, 0.87], [xr1, roofY], z), M.body);
    add("cabin", bar([xb0, 0.88], [xr0, roofY], z), M.body);
    add("cabin", bar([-0.25, 0.88], [-0.25, roofY], z, 0.07), M.body);
    if (wagon) add("cabin", bar([-1.38, 0.88], [-1.38, roofY], z, 0.07), M.body);
    add("cabin", boxGeo(V(xb0, 0.865, z - 0.03), V(0.95, 0.895, z + 0.03)), M.chrome);
  }
  if (wagon) {
    for (const s of [-1, 1]) {
      add("cabin", boxGeo(V(-2.05, roofY + 0.09, s * 0.66 - 0.025), V(0.15, roofY + 0.12, s * 0.66 + 0.025)), M.chrome);
      for (const x of [-1.95, -0.9, 0.05]) add("cabin", boxGeo(V(x - 0.03, roofY + 0.04, s * 0.66 - 0.02), V(x + 0.03, roofY + 0.1, s * 0.66 + 0.02)), M.chrome);
    }
    for (const x of [-1.6, -0.4]) add("cabin", boxGeo(V(x - 0.025, roofY + 0.1, -0.66), V(x + 0.025, roofY + 0.125, 0.66)), M.chrome);
  }
  WHEELS.forEach(([, wz], k) => {
    const s = Math.sign(wz);
    const t = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18); t.rotateX(Math.PI / 2); add("w" + k, t, M.tyre);
    const ww = new THREE.CylinderGeometry(0.26, 0.26, 0.02, 18); ww.rotateX(Math.PI / 2); ww.translate(0, 0, s * 0.121); add("w" + k, ww, M.white);
    const hc = new THREE.CylinderGeometry(0.17, 0.19, 0.04, 14); hc.rotateX(Math.PI / 2); hc.translate(0, 0, s * 0.135); add("w" + k, hc, M.chrome);
  });
};
const wheelPos = (k: number): V3 => [WHEELS[k][0], 0.33, WHEELS[k][1]];

type ChunkMats = { flesh: THREE.Material; fat: THREE.Material; hide: THREE.Material };
/** a low-poly 3D blubber chunk: flesh with a fat layer and the grey-blue skin cap on top */
const makeChunk = (s: number, i: number, M: ChunkMats, big = false) => {
  const g = new THREE.Group();
  const sx = s * (0.9 + hash(i, 52) * 0.5), sz = s * (0.8 + hash(i, 53) * 0.4);
  const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.flesh); fl.scale.set(sx, s * 0.7, sz);
  const fat = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.fat); fat.scale.set(sx * 0.9, s * 0.5, sz * 0.9); fat.position.y = s * 0.32;
  const hide = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.hide); hide.scale.set(sx * 0.85, s * 0.35, sz * 0.85); hide.position.y = s * 0.52;
  const parts = [fl, fat, hide];
  if (big) {
    const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.flesh); lump.scale.set(sx * 0.55, s * 0.45, sz * 0.6); lump.position.set(sx * 0.55, -s * 0.12, sz * 0.3); lump.rotation.set(0.4, 0.7, 0.2);
    const lump2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.fat); lump2.scale.set(sx * 0.4, s * 0.35, sz * 0.45); lump2.position.set(-sx * 0.6, -s * 0.05, -sz * 0.35); lump2.rotation.set(0.9, 0.2, 0.5);
    parts.push(lump, lump2);
  }
  for (const m of parts) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  return g;
};

// ---------------- the rain of shot 12 ----------------
type Drop = { f0: number; T: number; land: V3; from: V3; s: number; roof: boolean };
const N12 = 42;
const DROPS: Drop[] = Array.from({ length: N12 }, (_, i) => {
  const s = (i >= 30 ? 0.24 : 0.16) + hash(i, 1) * 0.3;
  let lx: number, lz: number, ly = 0, roof = false;
  if (i % 6 === 0 && i < 18) { const w = WAGONS[i / 6]; lx = w.x + (hash(i, 2) - 0.5) * 0.5; lz = ROW_Z + (hash(i, 3) - 0.5) * 0.4; ly = WAGON_ROOF; roof = true; }
  else if (i % 3 === 1) { lx = -6 + hash(i, 4) * 6.5; lz = -1.8 + hash(i, 5) * 3.6; }
  else if (i >= 30) { lx = -8.5 + hash(i, 4) * 8; lz = -4 + hash(i, 5) * 5; }
  else if (i === 29 || i === 23) { lx = -3.6 + hash(i, 4) * 2; lz = 3.4 + hash(i, 5) * 1.5; }
  else { lx = -13 + hash(i, 6) * 13; lz = -7.2 + hash(i, 7) * 5.5; }
  if (!roof && Math.hypot(lx - S.x, lz - S.z) < 3.2) lx -= 3.5; // never on the new sedan
  const land: V3 = [lx, ly + s * 0.45, lz];
  // the roof hits come down around "Parkplatz"
  const T = 20 + hash(i, 8) * 10, hit = roof ? PARK - 3 + (i / 6) * 3 : i >= 30 ? A(12) + 4 + (i - 30) * 2.2 : A(12) - 6 + hash(i, 9) * 62;
  return { f0: hit - T, T, land, from: [lx + (hash(i, 10) - 0.5) * 3, ly + 14 + hash(i, 11) * 8, lz - 7 - hash(i, 12) * 6], s, roof };
});
const dropAt = (d: Drop, f: number) => {
  const u = (f - d.f0) / d.T;
  if (u < 0) return null;
  if (u >= 1) return { p: d.land, landed: true, k: f - d.f0 - d.T };
  return { p: [d.from[0] + (d.land[0] - d.from[0]) * u, d.land[1] + (d.from[1] - d.land[1]) * (1 - u * u), d.from[2] + (d.land[2] - d.from[2]) * u] as V3, landed: false, k: 1 - u };
};

// ---------------- the sedan's crush (shot 13) ----------------
const crushOf = (id: number, f: number) => (id === 19 ? 1 : id === 13 ? ease.out(clamp01((f - IMP) / 3)) : 0);
const FOLD = 0.12, SAG = 0.1;
/** local point on the front half after the fold */
const foldF = (x: number, y: number, c: number): [number, number] => { const a = FOLD * c; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a) - SAG * c]; };
const ROOF_TOP = 1.42, CHUNK_S = 0.82;
const CH_LOCAL: V3 = [-0.25, 0, 0.05];
/** the giant chunk's centre in world space and its squash */
const bigChunk = (id: number, f: number): { p: V3; sq: number; rot: number } | null => {
  const rest = 0.88 + 0.5 * 0.28 - SAG + CHUNK_S * 0.55;
  const top = ROOF_TOP + CHUNK_S * 0.62, base = L2W(CH_LOCAL[0], 0, CH_LOCAL[2]);
  if (id === 19) return { p: [base[0], rest, base[2]], sq: 0.86, rot: 0.3 };
  if (id !== 13) return null;
  const T = 20, f0 = IMP - T, u = (f - f0) / T;
  if (u < 0) return null;
  if (u < 1) { const back = 1 - u; return { p: [base[0] - 0.6 * back, top + 8.5 * (1 - u * u), base[2] - 5.5 * back], sq: 1, rot: 0.3 + 2.2 * back }; }
  const c = crushOf(13, f), k = f - IMP, wob = k > 2 ? 0.08 * Math.exp(-(k - 2) / 5) * Math.cos((k - 2) * 1.1) : 0;
  return { p: [base[0], top + (rest - top) * c, base[2]], sq: 0.86 - 0.14 * Math.max(0, 1 - k / 3) + wob, rot: 0.3 };
};
/** small bits flung off the impact (local landing spots: two on the hood, the rest on the gravel) */
const BITS: { to: V3; s: number; hood: boolean }[] = Array.from({ length: 8 }, (_, i) => {
  if (i < 2) return { to: [1.05 + i * 0.95, 0, -0.5 - i * 0.05] as V3, s: 0.1 + 0.04 * i, hood: true };
  const a = -1.2 + (i / 7) * 3.2 + hash(i, 31) * 0.3, r = 2.0 + hash(i, 32) * 1.6;
  return { to: [Math.cos(a) * r * 1.3, 0, Math.sin(a) * r] as V3, s: 0.08 + hash(i, 33) * 0.1, hood: false };
});
const bitAt = (i: number, id: number, f: number) => {
  if (id !== 13 && id !== 19) return null;
  const b = BITS[i], T = 14 + 6 * hash(i, 34), k = id === 19 ? 1e3 : f - IMP;
  if (k < 0) return null;
  const u = clamp01(k / T);
  const [hx, hy] = b.hood ? foldF(b.to[0], 0.87, 1) : [b.to[0], 0];
  const end: V3 = [hx, hy + b.s * 0.45, b.to[2]], st: V3 = [CH_LOCAL[0], 1.3, CH_LOCAL[2]];
  const lp: V3 = [st[0] + (end[0] - st[0]) * u, st[1] + (end[1] - st[1]) * u + 1.6 * Math.sin(Math.PI * u), st[2] + (end[2] - st[2]) * u];
  return { p: L2W(lp[0], lp[1], lp[2]), spin: u < 1 ? k * 0.5 : hash(i, 35) * 6, landed: u >= 1 };
};
/** glass shards from the side windows toward the lens */
const SHARDS = Array.from({ length: 14 }, (_, i) => ({ to: [-1.4 + hash(i, 41) * 2.6, 1.25 + hash(i, 42) * 1.3] as [number, number], w: 0.1 + hash(i, 43) * 0.1 }));
const shardAt = (i: number, id: number, f: number) => {
  const k = id === 19 ? 1e3 : id === 13 ? f - IMP : -1;
  if (k < 0) return null;
  const T = 10 + 8 * hash(i, 44), u = clamp01(k / T), sd = SHARDS[i];
  const lx = -0.2 + (sd.to[0] + 0.2) * u, lz = 0.85 + (sd.to[1] - 0.85) * u, ly = 1.05 * (1 - u) + 0.015 + 0.9 * Math.sin(Math.PI * u) * (1 - u * 0.5);
  return { p: L2W(lx, u >= 1 ? 0.015 : ly, lz), landed: u >= 1, rot: hash(i, 45) * 6 + Math.min(k, 30) * 0.4 };
};
/** the bow: on the roof, then knocked off on the hit, lands crumpled on the hood */
const bowAt = (id: number, f: number): { lp: V3; crumple: number; spin: number } => {
  const roof: V3 = [-0.2, ROOF_TOP + 0.045, 0];
  const [hx, hy] = foldF(1.55, 0.87, 1), hood: V3 = [hx, hy + 0.03, 0.12];
  if (id === 19) return { lp: hood, crumple: 1, spin: 0 };
  if (id !== 13 || f < IMP) return { lp: roof, crumple: 0, spin: 0 };
  const T = 14, u = clamp01((f - IMP) / T);
  if (u >= 1) return { lp: hood, crumple: 1, spin: 0 };
  return { lp: [roof[0] + (hood[0] - roof[0]) * u, roof[1] + (hood[1] - roof[1]) * u + 1.5 * Math.sin(Math.PI * u), roof[2] + (hood[2] - roof[2]) * u], crumple: 0.4 * u, spin: (1 - u) * 5 };
};

/** height of the dunes behind the fence (just under 0 on the lot) */
const duneY = (x: number, z: number) => {
  if (z > -8.2) return -0.03;
  const t = clamp01((-8.2 - z) / 12), s = t * t * (3 - 2 * t);
  const crest = 4.2 + 1.2 * Math.sin(x / 7.5) + 0.7 * Math.sin(x / 3.1 + 1);
  const back = clamp01((-z - 30) / 25);
  return s * crest * (1 - 0.5 * back) + 0.25 * Math.sin(x / 2.3 + z / 3) * s;
};

// ---------------- the world ----------------
export class ParkingWorld extends RoomWorld {
  private sky: THREE.Mesh;
  private drops: THREE.Group[] = [];
  private column: THREE.Mesh[] = [];
  private burst: THREE.Mesh[] = [];
  private big: THREE.Group;
  private bits: THREE.Group[] = [];
  private car = new THREE.Group();
  private bodyF = new THREE.Group();
  private bodyR = new THREE.Group();
  private cabin = new THREE.Group();
  private glass = new THREE.Group();
  private wheels: THREE.Group[] = [];
  private bow = new THREE.Group();
  private glassOk!: THREE.Material;
  private glassBad!: THREE.Material;
  private hilite: THREE.Mesh[] = [];

  constructor(kit: Kit) {
    super(parkingCam);
    this.dust = false;
    // warm key from the right and a little from the camera side (az 115, el 27) instead of from behind, so the cars'
    // camera faces catch the light (RoomWorld keeps the per-shot sun in a private cache; we seed it per shot)
    for (const id of [12, 13, 19]) {
      const c0 = parkingCam(id, A(id)), fw = V(c0.look[0] - c0.pos[0], 0, c0.look[2] - c0.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
      const az = rad(115), el = rad(27);
      const sun = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
      (this as unknown as { sunCache: Map<number, THREE.Vector3> }).sunCache.set(id, sun);
    }
    const R = this.root, ground = new Batch(), things = new Batch(), glow = new Batch();
    const M = {
      gravel: lam("pkGravel", () => ({ map: gravelTex() })),
      sand: lam("pkSand", () => ({ map: sandTex() })),
      line: lam("pkLine", () => ({ color: "#f6f2e6" })),
      stop: lam("pkStop", () => ({ color: "#cfc8bc" })),
      post: lam("pkPost", () => ({ color: "#8a6440" })),
      rail: lam("pkRail", () => ({ color: "#a57a50" })),
      grass: lam("pkGrass", () => ({ color: "#86a948", side: THREE.DoubleSide })),
      grass2: lam("pkGrass2", () => ({ color: "#a9c45c", side: THREE.DoubleSide })),
      grass3: lam("pkGrass3", () => ({ color: "#c9b46a", side: THREE.DoubleSide })),
      tree: lam("pkTree", () => ({ color: "#2f6b45" })),
      tree2: lam("pkTree2", () => ({ color: "#3f8550" })),
      trunk: lam("pkTrunk", () => ({ color: "#6a4630" })),
      plank: lam("pkPlankM", () => ({ map: plankTex() })),
      roofK: lam("pkKioskRoof", () => ({ color: "#5d7fa8" })),
      stripe: lam("pkStripeM", () => ({ map: stripeTex(), side: THREE.DoubleSide })),
      pSign: lam("pkPSignM", () => ({ map: pSignTex() })),
      bSign: lam("pkBeachSignM", () => ({ map: beachSignTex() })),
      metal: lam("pkMetal", () => ({ color: "#9aa2ac" })),
      pole: lam("pkPole", () => ({ color: "#6e5440" })),
      wire: lam("pkWire", () => ({ color: "#3d3846" })),
      insul: lam("pkInsul", () => ({ color: "#7fc0a8" })),
      board: lam("pkBoard", () => ({ color: "#f4e6c4" })),
      boardS: lam("pkBoardS", () => ({ color: "#e0503a" })),
      drum: lam("pkDrum", () => ({ color: "#2f7fb5" })),
      drumR: lam("pkDrumR", () => ({ color: "#26668f" })),
      cooler: lam("pkCooler", () => ({ color: "#d9342b" })),
      coolerL: lam("pkCoolerL", () => ({ color: "#f3efe6" })),
      flesh: lam("pkFlesh", () => ({ color: "#e79a8c" })),
      fat: lam("pkFat", () => ({ color: "#f6dcb4" })),
      hide: lam("pkHide", () => ({ color: "#4f5c73" })),
      cloud: lam("pkCloud", () => ({ color: "#ecd29e" })),
      bow: lam("pkBow", () => ({ color: "#e0303a" })),
      bowD: lam("pkBowD", () => ({ color: "#b81f28" })),
    };
    const carM = (col: string): CarMats => ({
      body: lam("pkCar" + col, () => ({ color: col })),
      glass: lam("pkGlass", () => ({ color: "#a9d6e8" })),
      chrome: lam("pkChrome", () => ({ color: "#e4e8ee" })),
      tyre: lam("pkTyre", () => ({ color: "#2e2a34" })),
      white: lam("pkWhitewall", () => ({ color: "#f4f1ea" })),
      grille: lam("pkGrille", () => ({ color: "#3a3640" })),
      head: lam("pkHead", () => ({ color: "#fff4c2" })),
      tail: lam("pkTail", () => ({ color: "#d8302a" })),
      seam: lam("pkSeam", () => ({ color: "#3a3440" })),
      wood: lam("pkWood", () => ({ map: woodTex() })),
      trim: lam("pkTrim", () => ({ color: "#ecd3a0" })),
    });

    // ---- ground: the gravel lot, the dunes behind the fence ----
    {
      const g = new THREE.PlaneGeometry(70, 26, 1, 1); g.rotateX(-Math.PI / 2); g.translate(-3, 0, 5.2);
      const uv = g.attributes.uv, p = g.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 5, p.getZ(i) / 5);
      ground.add(g, M.gravel);
      const d = new THREE.PlaneGeometry(220, 110, 160, 70); d.rotateX(-Math.PI / 2); d.translate(-3, 0, -62);
      const dp = d.attributes.position, du = d.attributes.uv;
      for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), z = dp.getZ(i); dp.setY(i, duneY(x, z)); du.setXY(i, x / 6, z / 6); }
      d.computeVertexNormals(); ground.add(d, M.sand);
    }
    // ---- parking lines and wheel stops along the row; a worn lane line ----
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Matrix4().makeRotationY(S.yaw).setPosition(-9.5 + k * 3, 0, ROW_Z);
      things.add(boxGeo(V(-2.7, 0.002, -0.06), V(2.7, 0.014, 0.06)), M.line, m);
    }
    for (const x of [...WAGONS.map((w) => w.x), S.x, S.x + 3]) {
      const m = new THREE.Matrix4().makeRotationY(S.yaw).setPosition(x, 0, ROW_Z);
      things.add(boxGeo(V(-2.85, 0, -0.8), V(-2.65, 0.13, 0.8)), M.stop, m);
    }
    things.add(boxGeo(V(-14, 0.002, -0.85), V(10, 0.012, -0.75)), M.line);

    // ---- the parked station wagons ----
    for (const w of WAGONS) {
      const m = new THREE.Matrix4().makeRotationY(S.yaw).setPosition(w.x, 0, ROW_Z);
      buildCar((part, geo, mat) => {
        if (part[0] === "w") { const [x, y, z] = wheelPos(Number(part[1])); things.add(geo, mat, m.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z))); }
        else things.add(geo, mat, m);
      }, carM(w.col), true);
    }
    // ---- the new sedan: its own groups so it can be crushed ----
    {
      const mats = carM("#2fa37a"), parts = new Map<string, Batch>();
      buildCar((part, geo, mat) => { let b = parts.get(part); if (!b) { b = new Batch(); parts.set(part, b); } b.add(geo, mat); }, { ...mats, wood: undefined, trim: undefined }, false);
      parts.get("bodyF")!.build(this.bodyF, true); parts.get("bodyR")!.build(this.bodyR, true);
      parts.get("cabin")!.build(this.cabin, true); parts.get("glass")!.build(this.glass, true);
      for (let k = 0; k < 4; k++) { const g = new THREE.Group(); parts.get("w" + k)!.build(g, true); g.position.set(...wheelPos(k)); this.wheels.push(g); this.car.add(g); }
      this.car.add(this.bodyF, this.bodyR, this.cabin, this.glass);
      this.car.position.set(S.x, 0, S.z); this.car.rotation.y = S.yaw;
      R.add(this.car);
      this.glassOk = mats.glass;
      this.glassBad = lam("pkGlassBad", () => ({ map: glassBrokenTex() }));
      // painted showroom shine: soft light streaks on hood and roof (unlit, no ink)
      const shine = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 1.0, 0.88), transparent: true, opacity: 0.45, depthWrite: false });
      for (const [x0, x1, y, w, z] of [[1.1, 2.2, 0.875, 0.16, 0.3], [-0.7, 0.3, 1.426, 0.12, 0.45], [1.25, 2.0, 0.872, 0.06, 0.55]] as const) {
        const q = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, w), shine); q.rotation.x = -Math.PI / 2; q.position.set((x0 + x1) / 2, y, z);
        q.layers.set(NOINK); this.hilite.push(q); (y > 1 ? this.cabin : this.bodyF).add(q);
      }
      // the gift bow: two loops, a knot, two tails; ribbons across the roof
      const bw = new Batch(), rib = new Batch();
      for (const s of [-1, 1]) {
        const loop = new THREE.TorusGeometry(0.17, 0.055, 8, 18); loop.scale(0.8, 1, 1); loop.rotateY(Math.PI / 2); loop.rotateX(s * 0.55); loop.translate(0, 0.17, s * 0.2); bw.add(loop, M.bow);
        const tail = boxGeo(V(-0.04, 0, 0), V(0.04, 0.012, 0.3)); tail.rotateY(s * 0.5 + (s > 0 ? 0 : Math.PI)); tail.translate(0.02, 0.01, 0); bw.add(tail, M.bowD);
      }
      bw.add(new THREE.SphereGeometry(0.075, 12, 8), M.bowD);
      bw.build(this.bow, true);
      rib.add(boxGeo(V(-0.27, ROOF_TOP + 0.03, -0.86), V(-0.13, ROOF_TOP + 0.045, 0.86)), M.bow);
      rib.add(boxGeo(V(-0.89, ROOF_TOP + 0.03, -0.07), V(0.49, ROOF_TOP + 0.045, 0.07)), M.bow);
      rib.build(this.cabin, true);
      R.add(this.bow);
    }

    // ---- the split-rail fence along the back, with a gap to the beach path ----
    const FZ = -7.9, gap = (x: number) => x > -12.2 && x < -10.5;
    for (let x = -18; x <= 14; x += 2.4) {
      if (gap(x)) continue;
      const h = 1.1 + 0.08 * Math.sin(x * 1.7);
      things.add(boxGeo(V(x - 0.07, 0, FZ - 0.07), V(x + 0.07, h, FZ + 0.07)), M.post);
      if (x + 2.4 <= 14 && !gap(x + 2.4)) for (const y of [0.45, 0.88]) {
        const r = boxGeo(V(0, -0.05, -0.04), V(2.4, 0.05, 0.04)); r.rotateZ(0.02 * Math.sin(x + y * 9)); r.translate(x, y, FZ + 0.09); things.add(r, M.rail);
      }
    }
    // beach-access sign at the gap, the "P" sign at the right
    things.add(boxGeo(V(-12.6, 0, FZ + 0.2), V(-12.48, 1.9, FZ + 0.32)), M.post);
    things.add(boxGeo(V(-13.3, 1.35, FZ + 0.33), V(-11.8, 2.1, FZ + 0.39)), M.bSign);
    things.add(boxGeo(V(4.58, 0, -6.9), V(4.66, 2.5, -6.82)), M.metal);
    things.add(boxGeo(V(4.22, 1.95, -6.82), V(5.02, 2.75, -6.78)), M.pSign);
    // a surfboard leaning on the fence behind the wagons
    { const sb = new THREE.CapsuleGeometry(0.24, 1.7, 6, 14); sb.scale(1, 1, 0.18); sb.rotateZ(-0.22); sb.translate(-3.7, 1.05, FZ + 0.3); things.add(sb, M.board);
      const st = boxGeo(V(-0.04, -0.95, -0.05), V(0.04, 0.95, 0.05)); st.rotateZ(-0.22); st.translate(-3.7, 1.05, FZ + 0.31); things.add(st, M.boardS); }

    // ---- the snack kiosk at the left: plank walls, a counter, striped awning, a blue roof ----
    {
      const KX = -13.5, KZ = -5.2;
      things.add(boxGeo(V(KX - 1.3, 0, KZ - 1.1), V(KX + 1.3, 2.3, KZ + 1.1), 1.2), M.plank);
      things.add(boxGeo(V(KX - 0.9, 0.95, KZ + 1.1), V(KX + 0.9, 1.0, KZ + 1.45)), M.rail);
      const roofG = new THREE.CylinderGeometry(0.05, 2.1, 0.7, 4); roofG.rotateY(Math.PI / 4); roofG.scale(1.05, 1, 0.9); roofG.translate(KX, 2.65, KZ); things.add(roofG, M.roofK);
      const aw = new THREE.PlaneGeometry(2.4, 0.9); aw.rotateX(-1.0); aw.translate(KX, 2.05, KZ + 1.5); things.add(aw, M.stripe);
      things.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16), M.drum, new THREE.Matrix4().makeTranslation(KX + 1.8, 0.45, KZ + 1.2));
      things.add(new THREE.TorusGeometry(0.3, 0.025, 6, 16).rotateX(Math.PI / 2), M.drumR, new THREE.Matrix4().makeTranslation(KX + 1.8, 0.6, KZ + 1.2));
      things.add(boxGeo(V(KX + 0.6, 0, KZ + 1.3), V(KX + 1.2, 0.4, KZ + 1.7)), M.cooler);
      things.add(boxGeo(V(KX + 0.58, 0.4, KZ + 1.28), V(KX + 1.22, 0.46, KZ + 1.72)), M.coolerL);
      placeProp(things, glow, kit, "trashcan", KX - 1.8, 0, KZ + 1.4, { h: 0.8 });
    }
    // an oil-drum trash barrel by the lane and a cooler someone dropped
    things.add(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 16), M.drum, new THREE.Matrix4().makeTranslation(5.4, 0.44, -2.6));
    things.add(new THREE.TorusGeometry(0.29, 0.025, 6, 16).rotateX(Math.PI / 2), M.drumR, new THREE.Matrix4().makeTranslation(5.4, 0.3, -2.6));
    { const c = boxGeo(V(-0.3, 0, -0.2), V(0.3, 0.38, 0.2)); c.rotateY(0.5); c.rotateZ(0.08); c.translate(-6.4, 0, 1.6); things.add(c, M.cooler);
      const l = boxGeo(V(-0.32, 0.38, -0.22), V(0.32, 0.44, 0.22)); l.rotateY(0.5); l.translate(-6.4, 0, 1.6); things.add(l, M.coolerL); }

    // ---- utility poles with sagging wires ----
    const poles: V3[] = [[-17, 0, -7.4], [-6.5, 0, -7.4], [3.6, 0, -7.4], [14, 0, -7.4]];
    for (const [x, , z] of poles) {
      things.add(new THREE.CylinderGeometry(0.11, 0.15, 7.5, 8), M.pole, new THREE.Matrix4().makeTranslation(x, 3.75, z));
      things.add(boxGeo(V(x - 0.9, 6.7, z - 0.06), V(x + 0.9, 6.84, z + 0.06)), M.pole);
      for (const dx of [-0.75, 0, 0.75]) things.add(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 8), M.insul, new THREE.Matrix4().makeTranslation(x + dx, 6.92, z));
    }
    for (let i = 0; i + 1 < poles.length; i++) for (const dx of [-0.75, 0, 0.75]) {
      const a = poles[i], b = poles[i + 1];
      const cur = new THREE.CatmullRomCurve3([V(a[0] + dx, 6.98, a[2]), V((a[0] + b[0]) / 2 + dx, 6.3, a[2]), V(b[0] + dx, 6.98, b[2])]);
      things.add(new THREE.TubeGeometry(cur, 16, 0.015, 4), M.wire);
    }

    // ---- beach grass: along the fence, on the dunes, at the lot's front edge (kept off the lenses) ----
    const tuft = (x: number, z: number, h: number, i: number) => {
      const y = z < -8.2 ? duneY(x, z) : 0;
      for (let k = 0; k < 5; k++) {
        const hh = h * (0.7 + 0.5 * hash(i * 5 + k, 3)), b = new THREE.ConeGeometry(0.035, hh, 3);
        b.translate(0, hh / 2, 0); b.rotateZ((k - 2) * 0.22 + (hash(i, k) - 0.5) * 0.3); b.rotateY(hash(i, k + 9) * 3);
        b.translate(x, y - 0.03, z); things.add(b, [M.grass, M.grass2, M.grass3][(i + k) % 3]);
      }
    };
    let n = 0;
    for (let i = 0; i < 170; i++) tuft(-20 + hash(i, 61) * 36, -7.4 - hash(i, 62) * 1.6, 0.4 + hash(i, 63) * 0.5, n++);
    for (let i = 0; i < 520; i++) { const x = -40 + hash(i, 64) * 70, z = -9 - hash(i, 65) * 22; if (hash(i, 66) < 0.25) continue; tuft(x, z, 0.5 + hash(i, 67) * 0.7, n++); }
    for (let i = 0; i < 120; i++) {
      const x = -12 + hash(i, 68) * 20, z = 5.2 + hash(i, 69) * 4;
      if (Math.abs(x + 2.6) < 1.3 || Math.abs(x - 0.4) < 1.0) continue;
      tuft(x, z, 0.3 + hash(i, 70) * 0.35, n++);
    }
    for (let i = 0; i < 26; i++) tuft(-14 + hash(i, 71) * 4, -3.5 + hash(i, 72) * 3, 0.3 + hash(i, 73) * 0.3, n++);
    // shore pines on the dunes at the sides
    for (let i = 0; i < 30; i++) {
      const x = i % 2 ? -45 + hash(i, 81) * 22 : 14 + hash(i, 81) * 26, z = -14 - hash(i, 82) * 26, y = duneY(x, z), h = 4 + hash(i, 83) * 4;
      const tr = new THREE.CylinderGeometry(0.14, 0.2, h * 0.5, 6); tr.translate(x, y + h * 0.25, z); things.add(tr, M.trunk);
      for (let k = 0; k < 3; k++) { const c = new THREE.ConeGeometry(h * (0.32 - k * 0.07), h * 0.42, 7); c.translate(x, y + h * (0.42 + k * 0.2), z); things.add(c, (i + k) % 3 ? M.tree : M.tree2); }
    }

    // ---- 3D blubber: the rain of shot 12, the giant chunk and its bits ----
    for (let i = 0; i < N12; i++) { const g = makeChunk(DROPS[i].s, i, M); g.visible = false; this.drops.push(g); R.add(g); }
    this.big = makeChunk(CHUNK_S, 7, M, true); this.big.visible = false; R.add(this.big);
    for (let i = 0; i < BITS.length; i++) { const g = makeChunk(BITS[i].s, 40 + i, M); g.visible = false; this.bits.push(g); R.add(g); }
    // the dust column far behind the dunes and the sand puffs of the hit: opaque inked low-poly puffs
    for (let i = 0; i < 44; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), M.cloud); m.visible = false; this.column.push(m); R.add(m); }
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), M.cloud); m.visible = false; m.castShadow = true; this.burst.push(m); R.add(m); }

    ground.build(R, false);
    things.build(R, true);
    glow.build(R, false);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(420, 48, 24), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, depthWrite: false }));
    this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);
  }

  protected tick(id: number, f: number) {
    // shot 12's rain (landed chunks stay for 13 and 19)
    this.drops.forEach((g, i) => {
      const d = id === 12 ? dropAt(DROPS[i], f) : { p: DROPS[i].land, landed: true, k: 99 };
      g.visible = !!d;
      if (!d) return;
      g.position.set(...d.p);
      const sp = hash(i, 13) * 6 + (d.landed ? 0 : f * 0.2);
      g.rotation.set(d.landed ? 0.15 : sp * 1.3, sp, d.landed ? 0.1 : sp * 0.7);
      const sq = d.landed ? 0.8 + (d.k < 10 ? 0.2 * Math.exp(-d.k / 3) * Math.cos(d.k * 1.2) : 0) : 1;
      g.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
      if (d.landed) g.position.y = d.p[1] - DROPS[i].s * 0.1;
    });
    // the column: billowing, drifting right with height, gone by shot 19
    this.column.forEach((m, i) => {
      if (id === 19) { m.visible = false; return; }
      const h = ((i / this.column.length) + f * 0.0012) % 1, wide = 3 + 9 * h ** 1.4, a = hash(i, 91) * Math.PI * 2;
      const R0 = (3 + 5 * h) * (0.75 + 0.5 * hash(i, 92)) * Math.min(1, h * 10, (1 - h) * 5);
      m.visible = R0 > 0.3; m.scale.setScalar(Math.max(0.01, R0));
      m.position.set(-16 + Math.cos(a) * wide * 0.6 + 9 * h, 2 + h * 44, -88 + Math.sin(a) * wide * 0.5);
    });
    // the sedan: fold, squash, splay
    const c = crushOf(id, f);
    this.bodyF.rotation.z = FOLD * c; this.bodyR.rotation.z = -FOLD * c;
    this.bodyF.position.y = this.bodyR.position.y = -SAG * c;
    const k = 1 - 0.72 * c;
    for (const g of [this.cabin, this.glass]) { g.scale.set(1 + 0.05 * c, k, 1 + 0.06 * c); g.position.y = 0.88 * (1 - k) - SAG * c; g.rotation.z = -0.03 * c; }
    this.wheels.forEach((w, i) => { w.rotation.x = (WHEELS[i][1] > 0 ? 1 : -1) * 0.32 * c; w.position.y = 0.33 - 0.06 * c; });
    const broken = c > 0.3;
    this.glass.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.material = broken ? this.glassBad : this.glassOk; });
    for (const h of this.hilite) h.visible = !broken;
    // the bow
    const b = bowAt(id, f), bw = L2W(...b.lp);
    this.bow.position.set(...bw);
    this.bow.rotation.set(b.crumple * 0.35 + b.spin * 0.6, S.yaw + b.spin + b.crumple * 0.7, b.crumple * 0.2 + b.spin * 0.3);
    this.bow.scale.set(1 + 0.2 * b.crumple, 1 - 0.6 * b.crumple, 1 + 0.15 * b.crumple);
    // the giant chunk
    const bc = bigChunk(id, f);
    this.big.visible = !!bc;
    if (bc) { this.big.position.set(...bc.p); this.big.rotation.set(0.1, S.yaw + bc.rot, 0.06); this.big.scale.set(1 + (1 - bc.sq) * 0.7, bc.sq, 1 + (1 - bc.sq) * 0.7); }
    this.bits.forEach((g, i) => {
      const t = bitAt(i, id, f);
      g.visible = !!t;
      if (t) { g.position.set(...t.p); g.rotation.set(t.spin, t.spin * 0.7, 0.2); g.scale.set(1, t.landed ? 0.75 : 1, 1); }
    });
    // sand puffs bursting out from under the car on the hit
    this.burst.forEach((m, i) => {
      const kk = id === 13 ? f - IMP : -1, u = kk / 22;
      if (kk < 0 || u > 1) { m.visible = false; return; }
      const a = Math.PI * (1.05 + 0.9 * (i / (this.burst.length - 1))) + 0.1 * hash(i, 95), // far side of the car only
         r = 1.25 + 0.9 * ease.out(u), R0 = (0.16 + 0.12 * hash(i, 96)) * Math.sin(Math.PI * Math.min(1, u * 1.6 + 0.1));
      const [x, , z] = L2W(Math.cos(a) * r * 1.9, 0, Math.sin(a) * r * 0.85);
      m.visible = R0 > 0.05; m.scale.setScalar(Math.max(0.01, R0)); m.position.set(x, 0.1 + 0.35 * u, z);
    });
  }
  protected stage(id: number, f: number, light: number) { return id === 12 ? stage12(f, light) : id === 13 ? stage13(f) : stage19(f, light); }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    this.sky.position.copy(cam.position);
    cam.far = 600; cam.updateProjectionMatrix();
    return r;
  }
}

// ---------------- who stands where, effects ----------------
const white = (o: Outfit): Outfit => ({ ...o, skin: "#fbf8f2" });
const RUNNERS = [2, 5, 9, 7].map((v) => white(crowd(v)));
const VETW = white(VET), VSEED = 31;

/** landed decals of shot 12's rain (also lying there in 13 and 19) */
const rainSplats = (out: Stage, id: number, f: number) => {
  for (let i = 0; i < N12; i++) {
    const d = DROPS[i], st = id === 12 ? dropAt(d, f) : { landed: true, k: 99 };
    if (!st?.landed) continue;
    const grow = ease.out(clamp01((st.k + 1) / 4));
    flatCard(out, "pksplat", 256, 256, splat, d.land[0], (d.roof ? WAGON_ROOF : 0) + 0.012, d.land[2], (d.roof ? 0.9 : 0.7 + hash(i, 14) * 0.6) * grow, hash(i, 15) * 6);
  }
};

/** shot 12: four spectators run across the lane, arms up, while the blubber comes down */
const stage12 = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  RUNNERS.forEach((o, i) => {
    const x = -2.4 - i * 1.05 + 0.1 * (f - LEUTE), z = -0.9 + (i % 2) * 0.9 + 0.3 * i + 0.02 * (f - LEUTE);
    const ph = Math.floor(((((f / 17 + i * 0.31) % 1) + 1) % 1) * 8) / 8;
    const fo: FrontOpts = { mode: "march", phase: ph, expr: "shock", arms: i === 2 ? ["temple", "temple"] : ["up", "up"], facing: 1, look: 0.4, lift: 80, seed: 60 + i, light, blink: false, headTilt: i % 2 ? 4 : -3 };
    out.places.push(personAt("pkrun" + i, o, x, z, fo));
    contact(out, x, 0, z, 0.8);
  });
  rainSplats(out, 12, f);
  // a shadow under each falling chunk, growing as it comes down
  for (let i = 0; i < N12; i++) {
    const d = DROPS[i], st = dropAt(d, f);
    if (!st || st.landed) continue;
    contact(out, d.land[0], d.roof ? WAGON_ROOF : 0, d.land[2], d.s * 3 * (1 - 0.6 * st.k));
  }
  return out;
};

const sedanFx = (out: Stage, id: number, f: number) => {
  rainSplats(out, id, f);
  for (let i = 0; i < SHARDS.length; i++) {
    const s = shardAt(i, id, f);
    if (!s) continue;
    if (s.landed) flatCard(out, "pkshard" + (i % 4), 128, 128, shard(i % 4), s.p[0], 0.016, s.p[2], SHARDS[i].w * 1.4, s.rot);
    else card(out, "pkshard" + (i % 4), 128, 128, shard(i % 4), s.p[0], s.p[1], s.p[2], SHARDS[i].w * 1.4, false, s.rot);
  }
  for (let i = 2; i < BITS.length; i++) { const t = bitAt(i, id, f); if (t?.landed) flatCard(out, "pksplat", 256, 256, splat, t.p[0], 0.013, t.p[2], 0.55 + hash(i, 36) * 0.3, hash(i, 37) * 6); }
};

/** shot 13: the shiny new car with its bow, the chunk's shadow growing on the roof, the hit */
const stage13 = (f: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  const roof = L2W(-0.25, 0, 0.05);
  if (f < IMP) {
    for (let i = 0; i < 4; i++) {
      const ph = (f + i * 9) % 26, s = ph < 8 ? Math.sin((ph / 8) * Math.PI) : 0;
      if (s <= 0) continue;
      const p = L2W([2.55, 1.6, 0.4, -1.2][i], [0.62, 0.9, 1.43, 0.92][i], [0.76, 0.5, 0.82, 0.96][i]);
      card(out, "pksparkle", 128, 128, sparkle, p[0], p[1], p[2], 0.28 * s, false, f * 0.05);
    }
    const u = clamp01((f - (IMP - 20)) / 20);
    if (u > 0) contact(out, roof[0], ROOF_TOP + 0.05, roof[2], 0.5 + 1.4 * u * u);
  } else {
    const k = f - IMP;
    if (k < 7) { const t = clamp01(k / 7); card(out, "pkboom" + Math.round(t * 10), 600, 600, drawBoom(Math.round(t * 10) / 10), roof[0] + 0.2, 2.2, roof[2] + 0.6, 2.2 + 1.4 * ease.out(t)); }
  }
  contact(out, roof[0], 0, roof[2], 4.4);
  sedanFx(out, 13, f);
  return out;
};

// ---------------- the veteran (shot 19) ----------------
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
/** canvas position of the near (stick) hand in bodySide for the stout veteran: same maths as toon.ts */
const sideHand = (mode: "march" | "stand", phase: number, stride: number): { h: [number, number]; lean: number } => {
  const a = 118, b = a * (0.94 + 0.08 * (rnd(VSEED, 1) - 0.5)), W = 2 * a, HH = 2 * b, u = W / 100;
  const ankY = 975 - 4 * u, legLen = (1.32 + 0.12) * HH - 4 * u;
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const Sx = 370 * stride;
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: Sx / 2 - Sx * s, stance: true, s }; }
      const s = (c - 0.5) / 0.5;
      return { x: -Sx / 2 + Sx * s - (Sx / Math.PI) * Math.sin(2 * Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    lean = 4 + 3 * Math.cos(2 * 2 * Math.PI * phase);
    nearFwd = nL.x / (Sx / 2);
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - 1.15 * HH, Ta = 0.36 * W, tcx = 300 + 2 * u;
  const Sh: [number, number] = [tcx + 0.05 * Ta, chin + 0.14 * HH], aLen = 0.95 * HH, ang = rad(-30) * nearFwd;
  const e: [number, number] = [Sh[0] + Math.sin(ang) * aLen * 0.5, Sh[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
  const h: [number, number] = [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5];
  const L = rad(lean), dx = h[0] - 300, dy = h[1] - hipY;
  return { h: [300 + dx * Math.cos(L) - dy * Math.sin(L), hipY + dx * Math.sin(L) + dy * Math.cos(L)], lean };
};
/** the red stick, gripped upright in a fist at (hx, hy) (the whale/draw.ts stick at hand scale, body-weight ink) */
const stickAt = (p: Pen, hx: number, hy: number, tilt = 0) => {
  const w = 17, top = -125, bot = 40, c = Math.cos(tilt), s = Math.sin(tilt);
  const Rt = (x: number, y: number): [number, number] => [hx + x * c - y * s, hy + x * s + y * c];
  p.rot = null;
  p.stroke([Rt(0, top), Rt(6, top - 22), Rt(-4, top - 42)], 6, "#3a2a22");
  p.poly([Rt(-w, top), Rt(w, top), Rt(w, bot), Rt(-w, bot)], "#d9342b", 0);
  p.poly([Rt(-w, top), Rt(w, top), Rt(w, top + 16), Rt(-w, top + 16)], "#a8221c", 0);
  p.poly([Rt(w - 9, top + 20), Rt(w - 3, top + 20), Rt(w - 3, bot - 8), Rt(w - 9, bot - 8)], "#f2735f", 0);
  p.poly([Rt(-w, top), Rt(w, top), Rt(w, bot), Rt(-w, bot)], null, 9);
  p.dot(hx, hy, 15);
};
/** raised right hand of the stout veteran in the front view (stand, no tilt), as in truck.ts */
const HAND_UP = (() => {
  const a = 118, b = a * (0.94 + 0.08 * (rnd(VSEED, 1) - 0.5)), W = 2 * a, HH = 2 * b, u = W / 100;
  const torsoBot = 975 - 1.32 * HH, chin = torsoBot - 1.15 * HH, Ta = ((0.92 / 2) * W) / 1.06;
  return [300 + (Ta * 1.1 + 22 * u), chin + 0.12 * HH - 0.75 * HH] as [number, number];
})();
const vetFront = (p: Pen, fo: FrontOpts) => { bodyFront(p, VETW, fo); stickAt(p, HAND_UP[0], HAND_UP[1]); };

/** shot 19: the wreck; the veteran walks in from the right with his stick, stops, turns to the lens on "Mann" */
const stage19 = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  sedanFx(out, 19, f);
  const roof = L2W(-0.25, 0, 0.05);
  contact(out, roof[0], 0, roof[2], 4.4);
  // stink rising off the chunk, two flies circling it
  for (let k = 0; k < 3; k++) { const ph = (f / 26 + k / 3) % 1, q8 = Math.round(ph * 8) % 8; card(out, "pkstink" + q8, 300, 420, drawStink(q8 / 8), roof[0] - 0.45 + k * 0.45, 2.1 + ph * 0.5, roof[2], 0.5); }
  for (let i = 0; i < 2; i++) { const a = f * 0.31 + i * 3; card(out, "pkfly", 80, 80, fly, roof[0] + 0.7 * Math.cos(a), 2.0 + 0.2 * Math.sin(a * 1.7) + i * 0.2, roof[2] + 0.5 * Math.sin(a), 0.06); }
  // the walk: from off the right edge to his mark beside the wreck
  const t0 = A(19), t1 = GEH - 6, speed = 1.6, path = (speed * (t1 - t0)) / 30;
  const dir: [number, number] = [-0.985, -0.17];
  const turn = MANN - LEAD;
  if (f < t1) {
    const d = path - (speed * (f - t0)) / 30, x = VP[0] - dir[0] * d, z = VP[2] - dir[1] * d;
    const ph = Math.floor((((f - t0) / 30) % 1) * 8) / 8, stride = speed / 1.6;
    const { h, lean } = sideHand("march", ph, stride);
    out.places.push({ ...personAt("pkvetW" + ph, VETW, x, z, { mode: "stand", headTilt: 0 }, (p) => { bodySide(p, VETW, { mode: "march", phase: ph, expr: "neutral", stride, light, seed: VSEED, blink: 0.35 }); stickAt(p, h[0], h[1], rad(lean)); }), mirror: true });
    contact(out, x, 0, z, 0.95);
  } else if (f < turn) {
    const { h } = sideHand("stand", 0, 1), bl = blinkAt(f, 4) ? 1 : 0.35;
    out.places.push({ ...personAt("pkvetS" + bl, VETW, VP[0], VP[2], { mode: "stand", headTilt: 0 }, (p) => { bodySide(p, VETW, { mode: "stand", expr: "neutral", light, seed: VSEED, blink: bl }); stickAt(p, h[0], h[1]); }), mirror: true });
    contact(out, VP[0], 0, VP[2], 0.95);
  } else {
    // front: deadpan into the lens, the stick up; one slow heavy blink at the very end
    const k = f - turn, end = f - (HATTE + 12);
    const lid = end >= 0 && end < 9 ? (end < 3 ? 0.35 + 0.22 * end : end < 5 ? 1 : Math.max(0.35, 1 - 0.18 * (end - 4))) : 0.35;
    const fo: FrontOpts = { mode: "stand", seed: VSEED, light, expr: "neutral", arms: ["hang", "up"], look: k < 3 ? -0.4 : 0, facing: k < 2 ? -1 : 0, blink: Math.round(lid * 4) / 4, headTilt: k < 3 ? -2 : 0 };
    out.places.push(personAt("pkvetF", VETW, VP[0], VP[2], fo, vetFront));
    contact(out, VP[0], 0, VP[2], 0.95);
  }
  return out;
};
