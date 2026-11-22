// The Oregon State Highway Department office, 1970 (shot 4): walnut-panelled room with a cork board holding a big
// painted road map of the coast, grey filing cabinets, a rainy window onto a grey coast, a wall clock, a radiator and a
// wooden desk across the foreground (orange desk lamp, avocado rotary phone, coffee mug, folder stacks, blotter).
// Thornton stands behind the desk: head down over his papers, looks up proud on "George", an idea bulb pops above him
// on "Idee" (card + HDR halo for the bloom), on "Dynamit" he holds one red stick up with a big grin while the camera
// pushes in fast. Room x -4..4, z -3..3; camera looks toward -z.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit } from "../pigeon/build";
import { placeProp } from "../pigeon/props";
import { ctex, rep } from "../pigeon/paint";
import { panelTex, grainTex } from "../pigeon/ptex";
import { NOINK } from "../pigeon/ink";
import { Pen, FrontOpts, bodyFront, headBlob } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, roomShell, personAt, card, flatCard, ease, q, blinkAt, LEAD } from "./room";
import { THORNTON } from "../whale/draw";
import { A, beat } from "./shots";

const GEORGE = beat(4, "George"), IDEE = beat(4, "Idee"), DYN = beat(4, "Dynamit");

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  4: {
    keys: [
      // wide on the office, then a long glide in toward Thornton that lands on "George"
      { f: A(4), pos: [0.6, 1.62, 2.3], look: [0.02, 1.32, -1.6], fov: 42 },
      { f: A(4) + 8, dur: GEORGE - A(4) - 6, pos: [0.32, 1.56, 0.95], look: [0.02, 1.4, -1.6], fov: 40 },
      // tilt up a little so the bulb fits above his head
      { f: IDEE - 16, dur: 18, pos: [0.3, 1.5, 1.15], look: [0.04, 1.36, -1.6], fov: 40 },
      // fast push-in on "Dynamit", framed toward the raised stick
      { f: DYN - 3, dur: 9, pos: [0.34, 1.42, 0.45], look: [0.14, 1.32, -1.6], fov: 40 },
    ],
    creep: 0.001, kicks: [DYN], cInf: [7, 7, 7, 8],
  },
};
export const officeCam = camOf(CAMS);
export const officeDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const carpetTex = () => ctex("wfoCarpet", 512, 512, (g, r) => {
  g.fillStyle = "#b8682f"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(120,58,22,0.35)" : "rgba(236,160,92,0.3)";
    g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3);
  }
  g.strokeStyle = "rgba(110,52,20,0.25)"; g.lineWidth = 3;
  for (let x = 0; x < 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(512, x); g.stroke(); }
});
const ceilTex = () => ctex("wfoCeil", 256, 256, (g, r) => {
  g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(120,110,100,0.35)"; for (let i = 0; i < 500; i++) g.fillRect(r() * 256, r() * 256, 2, 2);
  g.strokeStyle = "#a99c8a"; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256);
});
const corkTex = () => ctex("wfoCork", 512, 512, (g, r) => {
  g.fillStyle = "#c78d55"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,70,30,0.4)" : "rgba(240,190,130,0.35)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2 + r() * 3); }
});
/** big painted road map of the Oregon coast: Pacific on the left, coast road (red) and highways (yellow), a red circle at
 *  the beach where the whale lies */
const mapTex = () => ctex("wfoMap", 1024, 768, (g, r) => {
  g.fillStyle = "#f3e7c4"; g.fillRect(0, 0, 1024, 768);
  const coast: [number, number][] = [];
  for (let y = 0; y <= 768; y += 32) coast.push([300 + 50 * Math.sin(y / 90) + 30 * Math.sin(y / 31) + (r() - 0.5) * 18, y]);
  g.fillStyle = "#86bfdc"; g.beginPath(); g.moveTo(0, 0); coast.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(0, 768); g.closePath(); g.fill();
  g.strokeStyle = "rgba(40,90,140,0.4)"; g.lineWidth = 3;
  for (let i = 0; i < 40; i++) { const x = 30 + r() * 220, y = r() * 760; g.beginPath(); g.arc(x, y, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  g.fillStyle = "#a9c77e";
  for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(420 + r() * 600, r() * 768, 40 + r() * 70, 30 + r() * 50, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = "#d9b77a";
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(700 + r() * 320, r() * 768, 40 + r() * 60, 24 + r() * 40, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "#3a4a6a"; g.lineWidth = 6; g.beginPath(); coast.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.strokeStyle = "#5a9ac8"; g.lineWidth = 5;
  for (const y0 of [190, 470, 640]) { g.beginPath(); g.moveTo(330, y0); for (let x = 330; x < 900; x += 60) g.lineTo(x, y0 + 30 * Math.sin(x / 70) + (x - 330) * 0.08); g.stroke(); }
  g.setLineDash([12, 10]); g.strokeStyle = "rgba(110,70,90,0.55)"; g.lineWidth = 3;
  for (const y of [140, 330, 560]) { g.beginPath(); g.moveTo(330, y); g.lineTo(1024, y + 40); g.stroke(); }
  g.beginPath(); g.moveTo(720, 0); g.lineTo(700, 768); g.stroke(); g.setLineDash([]);
  const road = (pts: [number, number][], col: string, w: number) => {
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = "#5a3a2a"; g.lineWidth = w + 6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke();
  };
  road([[360, 120], [560, 160], [760, 120], [1024, 150]], "#f2c23a", 10);
  road([[360, 480], [520, 440], [700, 470], [1024, 420]], "#f2c23a", 10);
  road([[700, 0], [690, 300], [720, 520], [700, 768]], "#f2c23a", 12);
  road(coast.map(([x, y]) => [x + 46, y]), "#d63a2c", 14);
  for (const [x, y] of [[370, 120], [372, 300], [355, 480], [380, 640], [700, 120], [705, 470], [690, 300]]) {
    g.fillStyle = "#2a2a3a"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    g.fillStyle = "rgba(40,40,60,0.6)"; for (let k = 0; k < 3; k++) g.fillRect(x + 18, y - 8 + k * 8, 40 + r() * 30, 4);
  }
  g.strokeStyle = "#d02a24"; g.lineWidth = 9; g.beginPath(); g.ellipse(355, 395, 58, 44, -0.2, 0, 7); g.stroke();
  g.strokeStyle = "#3a3048"; g.lineWidth = 4; g.fillStyle = "#fbf4dc";
  g.fillRect(820, 610, 180, 130); g.strokeRect(820, 610, 180, 130);
  for (let k = 0; k < 4; k++) { g.fillStyle = ["#d63a2c", "#f2c23a", "#5a9ac8", "#a9c77e"][k]; g.fillRect(836, 626 + k * 28, 34, 14); g.fillStyle = "rgba(40,40,60,0.6)"; g.fillRect(882, 630 + k * 28, 90, 5); }
  g.fillStyle = "#3a3048"; g.beginPath(); g.moveTo(130, 60); g.lineTo(146, 120); g.lineTo(130, 110); g.lineTo(114, 120); g.closePath(); g.fill();
  g.beginPath(); g.arc(130, 120, 34, 0, 7); g.stroke();
  g.strokeStyle = "#5a4636"; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 754);
});
/** the view out of the window: overcast grey sky, a grey sea with foam lines, a dark forested headland */
const outsideTex = () => ctex("wfoOutside", 512, 640, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, "#7d8a9c"); gr.addColorStop(0.55, "#b4bec8"); gr.addColorStop(1, "#c8cdd2");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 16; i++) { g.fillStyle = r() < 0.5 ? "rgba(96,106,124,0.55)" : "rgba(210,216,222,0.5)"; g.beginPath(); g.ellipse(r() * 512, 40 + r() * 220, 60 + r() * 90, 20 + r() * 30, 0, 0, 7); g.fill(); }
  g.fillStyle = "#6f8290"; g.fillRect(0, 380, 512, 260);
  g.strokeStyle = "rgba(235,240,242,0.7)"; g.lineWidth = 3;
  for (let i = 0; i < 22; i++) { const y = 400 + r() * 230, x = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r() * 50, y + 2); g.stroke(); }
  g.fillStyle = "#3f5648"; g.beginPath(); g.moveTo(512, 300); g.lineTo(380, 330); g.lineTo(300, 400); g.lineTo(512, 420); g.closePath(); g.fill();
  for (let i = 0; i < 16; i++) { const x = 330 + i * 12 + r() * 6, y = 340 - (i * 3) + r() * 10; g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 10, y + 6); g.lineTo(x - 10, y + 6); g.closePath(); g.fill(); }
  g.fillStyle = "#4f6656"; g.beginPath(); g.moveTo(0, 360); g.lineTo(120, 350); g.lineTo(200, 390); g.lineTo(0, 400); g.closePath(); g.fill();
  g.fillStyle = "#b8ab92"; g.fillRect(0, 590, 512, 50);
  g.fillStyle = "rgba(200,206,214,0.25)"; g.fillRect(0, 0, 512, 640);
});
/** rain on the glass: thin streaks and drops on transparency, scrolled down in tick() */
const rainTex = () => ctex("wfoRain", 256, 512, (g, r) => {
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(230,238,250,0.55)"; g.lineWidth = 2;
  for (let i = 0; i < 90; i++) { const x = r() * 256, y = r() * 512, l = 20 + r() * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + l); g.stroke(); }
  g.fillStyle = "rgba(240,246,255,0.6)";
  for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * 256, r() * 512, 3, 4, 0, 0, 7); g.fill(); }
});
const clockTex = () => ctex("wfoClock", 256, 256, (g) => {
  g.fillStyle = "#fbf6e8"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = "#2a2230";
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.save(); g.translate(128 + 100 * Math.sin(a), 128 - 100 * Math.cos(a)); g.rotate(a); g.fillRect(-4, -12, 8, k % 3 ? 14 : 24); g.restore(); }
  g.strokeStyle = "#c0353a"; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
});
const dialTex = () => ctex("wfoDial", 256, 256, (g) => {
  g.fillStyle = "#e9e2cc"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#3a3a2e";
  for (let k = 0; k < 10; k++) { const a = -0.6 + (k / 10) * Math.PI * 1.6; g.beginPath(); g.arc(128 + 86 * Math.cos(a), 128 + 86 * Math.sin(a), 18, 0, 7); g.fill(); }
  g.fillStyle = "#fbf8f0"; g.beginPath(); g.arc(128, 128, 44, 0, 7); g.fill();
});
const notesTex = (key: string, col: string) => ctex("wfoNote" + key, 128, 160, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 128, 160);
  g.fillStyle = "rgba(50,40,60,0.55)"; for (let y = 30; y < 150; y += 18) g.fillRect(12, y, 60 + r() * 50, 4);
});
const glowTex = () => ctex("wfoGlow", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// ---------------- effect drawings ----------------
/** the idea bulb, 400 x 480: glass with filament, screw base, short rays (ink outlined) */
const drawBulb = (p: Pen) => {
  for (let k = 0; k < 8; k++) {
    if (k === 4) continue; // no ray down into the base
    const a = ((k * 45 - 90) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), n = -s, m = c, r0 = 140, r1 = 192, w = 13;
    p.poly([[200 + c * r0 + n * w, 190 + s * r0 + m * w], [200 + c * r1, 190 + s * r1], [200 + c * r0 - n * w, 190 + s * r0 - m * w]], "#ffe066", 7);
  }
  p.poly([[160, 270], [240, 270], [232, 300], [168, 300]], "#fff1a0", 0);
  p.ell(200, 190, 108, 112, "#fff3a6", 10);
  p.arc(200, 190, 80, 84, 200, 250, 12, "#ffffff");
  p.stroke([[176, 290], [178, 210], [188, 196], [196, 214], [204, 196], [212, 214], [222, 196], [222, 290]], 6, "#e27a1e");
  p.poly([[160, 296], [240, 296], [236, 380], [164, 380]], "#a9adb6", 9);
  for (const y of [318, 340, 362]) p.stroke([[164, y], [236, y - 6]], 6, "#6f7380");
  p.poly([[176, 380], [224, 380], [212, 408], [188, 408]], "#4a4452", 8);
};
/** fuse spark, 200 x 200 */
const drawSpark = (k: number) => (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + k, r = i % 2 ? 34 : 90 - 10 * ((i + k * 3) % 3); pts.push([100 + r * Math.cos(a), 100 + r * Math.sin(a)]); }
  p.poly(pts, "#ffd23a", 6);
  p.ell(100, 100, 28, 28, "#fff6c8", 0);
};
/** office papers lying on the desk, 300 x 220 */
const drawMemo = (p: Pen) => {
  p.poly([[20, 30], [270, 10], [285, 190], [30, 210]], "#f6f1e4", 6);
  for (let i = 0; i < 7; i++) p.stroke([[50, 50 + i * 20], [200 + (i % 3) * 20, 40 + i * 20]], 5, "#9a9aa8");
  p.poly([[210, 140], [262, 136], [266, 176], [214, 180]], "#d63a2c", 0);
};
const steam = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(64, 64, 0, 64, 64, 60);
  gr.addColorStop(0, "rgba(255,250,240,0.16)"); gr.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

// ---------------- Thornton with the stick ----------------
const SEED = 21, SU = 0.00216;
/** canvas position of the raised right hand in the "up" arm pose (same maths as toon.ts bodyFront, standing adult) */
const handUp = (): [number, number] => {
  const H = headBlob(SEED, 118, 0), HH = 2 * H.b, W = 2 * H.a, u = W / 100;
  const torsoBot = 975 - 1.4 * HH, chin = torsoBot - 1.1 * HH, Ta = (0.4 * W) / 1.06, shY = chin + 0.12 * HH;
  return [300 + Ta * 1.1 + 22 * u, shY - 0.75 * HH];
};
/** bodyFront plus one red stick of dynamite gripped in the raised right hand (drawn into the same card, so it sways
 *  with him) */
const thorntonDraw = (stick: boolean) => (p: Pen, fo: FrontOpts) => {
  bodyFront(p, THORNTON, fo);
  if (!stick) return;
  p.rot = null;
  const [hx, hy] = handUp(), a = (10 * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const R = (x: number, y: number): [number, number] => [hx + x * c - y * s, hy + x * s + y * c];
  const body = [R(-27, -150), R(27, -150), R(27, 52), R(-27, 52)];
  p.poly(body, "#d9342b", 0);
  p.poly([R(12, -150), R(22, -150), R(22, 52), R(12, 52)], "#a8221c", 0);
  p.poly([R(-20, -146), R(-12, -146), R(-12, 46), R(-20, 46)], "#f2705e", 0);
  p.poly([R(-27, -150), R(27, -150), R(27, -128), R(-27, -128)], "#a8221c", 0);
  p.poly([R(-27, -30), R(27, -30), R(27, -6), R(-27, -6)], "#f3e2b0", 0);
  p.poly(body, null, 10);
  p.line([R(0, -150), R(6, -178), R(-6, -200)], "#3a2a22", 6, false);
  // the hand grips the stick: redraw the hand dot on top
  p.dot(hx, hy + 6, 15);
};

// ---------------- the room ----------------
const DESK_Y = 0.76, TX = 0.0, TZ = -1.6, BULB_Y = 1.98;

export class OfficeWorld extends RoomWorld {
  private rain: THREE.Texture;
  private hands: THREE.Mesh[] = [];
  private halo: THREE.Mesh;
  private core: THREE.Mesh;
  private lampGlow: THREE.Mesh;

  constructor(kit: Kit) {
    super(officeCam);
    // key light: the warm preset's colours, but coming from the right and a little from the camera side (az 125, el 30)
    // instead of from behind, so the walnut back wall and the desk front catch the warm light instead of sinking into
    // the violet shade (RoomWorld keeps the per-shot sun in a private cache; we seed it for shot 4)
    const c0 = officeCam(4, A(4)), fw = V(c0.look[0] - c0.pos[0], 0, c0.look[2] - c0.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
    const az = (125 * Math.PI) / 180, el = (30 * Math.PI) / 180;
    const sun = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
    (this as unknown as { sunCache: Map<number, THREE.Vector3> }).sunCache.set(4, sun);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    const M = {
      floor: lam("wfoFloor", () => ({ map: carpetTex() })),
      low: lam("wfoLow", () => ({ map: panelTex("#6e4429") })),
      wall: lam("wfoWall", () => ({ map: panelTex("#9a6238") })),
      rail: lam("wfoRail", () => ({ color: "#4a2c1a" })),
      ceil: lam("wfoCeil", () => ({ map: ceilTex() })),
      desk: lam("wfoDesk", () => ({ map: grainTex("#8a5432") })),
      deskD: lam("wfoDeskD", () => ({ map: grainTex("#6b3f24") })),
      brass: lam("wfoBrass", () => ({ color: "#d4a84a" })),
      blotter: lam("wfoBlotter", () => ({ color: "#3d6b52" })),
      cab: lam("wfoCab", () => ({ color: "#8c949c" })),
      cabD: lam("wfoCabD", () => ({ color: "#6c737c" })),
      label: lam("wfoLabel", () => ({ color: "#f1ead6" })),
      cork: lam("wfoCork", () => ({ map: corkTex() })),
      frame: lam("wfoFrame", () => ({ color: "#5a3620" })),
      sash: lam("wfoSash", () => ({ color: "#e9e3d4" })),
      blind: lam("wfoBlind", () => ({ color: "#efe6cf" })),
      rad: lam("wfoRad", () => ({ color: "#c9c2b0" })),
      lamp: lam("wfoLampO", () => ({ color: "#ef7a22" })),
      lampD: lam("wfoLampD", () => ({ color: "#5a4636" })),
      phone: lam("wfoPhone", () => ({ color: "#8a9a3e" })),
      phoneD: lam("wfoPhoneD", () => ({ color: "#5f6c2a" })),
      dial: lam("wfoDialM", () => ({ map: dialTex() })),
      mug: lam("wfoMug", () => ({ color: "#f4efe2" })),
      mugB: lam("wfoMugB", () => ({ color: "#e0602a" })),
      coffee: lam("wfoCoffee", () => ({ color: "#4a2a18" })),
      manila: lam("wfoManila", () => ({ color: "#e6c47a" })),
      fGreen: lam("wfoFGreen", () => ({ color: "#5d9a62" })),
      fRed: lam("wfoFRed", () => ({ color: "#c8503a" })),
      fBlue: lam("wfoFBlue", () => ({ color: "#4f78b0" })),
      pencil: lam("wfoPencil", () => ({ color: "#f2c23a" })),
      clockR: lam("wfoClockR", () => ({ color: "#3a3040" })),
      pinR: lam("wfoPinR", () => ({ color: "#e0352c" })),
      pinB: lam("wfoPinB", () => ({ color: "#2f6fd0" })),
      pinY: lam("wfoPinY", () => ({ color: "#f4c430" })),
      hat: lam("wfoHat", () => ({ color: "#f5c22a" })),
    };
    // window hole on the back wall, right of Thornton
    const WX0 = 0.32, WX1 = 1.52, WY0 = 1.22, WY1 = 2.6;
    roomShell(walls, things, { floor: M.floor, low: M.low, wall: M.wall, rail: M.rail, ceil: M.ceil }, [[WX0, WX1, WY0, WY1]], [3, 2.2]);

    // ---- window: frame, mullions, sill, raised venetian blind, the rainy coast outside ----
    for (const [a, b] of [[V(WX0 - 0.07, WY0 - 0.08, -3.06), V(WX1 + 0.07, WY0, -2.84)], [V(WX0 - 0.07, WY1, -3.06), V(WX1 + 0.07, WY1 + 0.08, -2.94)],
      [V(WX0 - 0.07, WY0, -3.06), V(WX0, WY1, -2.94)], [V(WX1, WY0, -3.06), V(WX1 + 0.07, WY1, -2.94)],
      [V((WX0 + WX1) / 2 - 0.03, WY0, -3.04), V((WX0 + WX1) / 2 + 0.03, WY1, -2.98)], [V(WX0, 1.92, -3.04), V(WX1, 1.97, -2.98)]] as const) things.add(boxGeo(a, b), M.sash);
    for (let i = 0; i < 6; i++) { const y = WY1 - 0.04 - i * 0.035; things.add(boxGeo(V(WX0, y - 0.012, -2.97), V(WX1, y, -2.9)), M.blind); }
    things.add(boxGeo(V(WX0 + 0.25, 2.05, -2.93), V(WX0 + 0.26, WY1 - 0.2, -2.92)), M.lampD); // blind cord
    const view = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), new THREE.MeshBasicMaterial({ map: outsideTex(), color: new THREE.Color(0.95, 0.95, 0.97) }));
    view.position.set((WX0 + WX1) / 2, 1.9, -3.6); view.layers.set(NOINK); R.add(view);
    this.rain = rep(rainTex(), 2, 1.4);
    const rainM = new THREE.Mesh(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), new THREE.MeshBasicMaterial({ map: this.rain, transparent: true, depthWrite: false }));
    rainM.position.set((WX0 + WX1) / 2, (WY0 + WY1) / 2, -3.01); rainM.layers.set(NOINK); R.add(rainM);
    // radiator under the window
    things.add(boxGeo(V(WX0 + 0.05, 0.12, -2.96), V(WX1 - 0.05, 0.16, -2.8)), M.rad);
    for (let i = 0; i < 14; i++) { const x = WX0 + 0.1 + i * 0.075; things.add(boxGeo(V(x, 0.16, -2.95), V(x + 0.05, 0.82, -2.81)), M.rad); }
    things.add(boxGeo(V(WX0 + 0.05, 0.82, -2.96), V(WX1 - 0.05, 0.86, -2.8)), M.rad);

    // ---- cork board with the big road map, pinned notes and coloured pins (left of and behind Thornton) ----
    const CX0 = -1.75, CX1 = -0.02, CY0 = 1.18, CY1 = 2.46;
    things.add(boxGeo(V(CX0 - 0.06, CY0 - 0.06, -3.0), V(CX1 + 0.06, CY1 + 0.06, -2.95)), M.frame);
    things.add(boxGeo(V(CX0, CY0, -2.98), V(CX1, CY1, -2.94)), M.cork);
    const map = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.02), new THREE.MeshBasicMaterial({ map: mapTex(), color: new THREE.Color(0.92, 0.88, 0.82) }));
    map.position.set(-0.95, 1.84, -2.935); map.rotation.z = 0.015; R.add(map);
    for (const [x, y, k, col] of [[-1.62, 2.28, "a", "#f7e27a"], [-1.6, 1.4, "b", "#f6f1e4"], [-0.18, 1.32, "c", "#f4b8c8"]] as const) {
      const n = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), new THREE.MeshBasicMaterial({ map: notesTex(k, col), color: new THREE.Color(0.88, 0.85, 0.8) }));
      n.position.set(x, y, -2.932); n.rotation.z = (x + y) * 0.2; R.add(n);
    }
    const pin = new THREE.SphereGeometry(0.018, 10, 8);
    const pins: [number, number, THREE.Material][] = [[-1.55, 2.3, M.pinR], [-1.55, 1.42, M.pinB], [-0.2, 1.36, M.pinY], [-1.6, 2.32, M.pinY],
      [-1.32, 1.68, M.pinR], [-0.75, 2.2, M.pinB], [-0.48, 1.55, M.pinR], [-1.1, 1.45, M.pinY], [-0.32, 2.25, M.pinR], [-0.98, 1.9, M.pinB]];
    for (const [x, y, m] of pins) things.add(pin, m, new THREE.Matrix4().makeTranslation(x, y, -2.915));

    // ---- wall clock above the cork board ----
    const face = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32); face.rotateX(Math.PI / 2);
    things.add(face, M.clockR, new THREE.Matrix4().makeTranslation(-0.3, 2.78, -2.97));
    const cf = new THREE.Mesh(new THREE.CircleGeometry(0.18, 32), new THREE.MeshBasicMaterial({ map: clockTex(), color: new THREE.Color(0.9, 0.88, 0.85) }));
    cf.position.set(-0.3, 2.78, -2.94); R.add(cf);
    for (const [len, w] of [[0.11, 0.022], [0.16, 0.014]]) {
      const g = new THREE.BoxGeometry(w, len, 0.008); g.translate(0, len / 2 - 0.02, 0);
      const h = new THREE.Mesh(g, M.clockR); h.position.set(-0.3, 2.78, -2.93); R.add(h); this.hands.push(h);
    }

    // ---- filing cabinets on the left (grey metal, four drawers, handles and label holders) ----
    for (const [x0, h] of [[-2.0, 1.32], [-1.42, 1.32]] as const) {
      const x1 = x0 + 0.54, z0 = -2.95, z1 = -2.3;
      things.add(boxGeo(V(x0, 0, z0), V(x1, h, z1)), M.cab);
      for (let i = 0; i < 4; i++) {
        const y = 0.06 + i * ((h - 0.08) / 4), dh = (h - 0.08) / 4 - 0.03;
        things.add(boxGeo(V(x0 + 0.03, y, z1), V(x1 - 0.03, y + dh, z1 + 0.02)), M.cabD);
        things.add(boxGeo(V(x0 + 0.05, y + 0.02, z1 + 0.02), V(x1 - 0.05, y + dh - 0.02, z1 + 0.025)), M.cab);
        things.add(boxGeo(V((x0 + x1) / 2 - 0.08, y + dh * 0.55, z1 + 0.025), V((x0 + x1) / 2 + 0.08, y + dh * 0.62, z1 + 0.06)), M.brass);
        things.add(boxGeo(V((x0 + x1) / 2 - 0.06, y + dh * 0.72, z1 + 0.025), V((x0 + x1) / 2 + 0.06, y + dh * 0.86, z1 + 0.03)), M.label);
      }
    }
    // folders and a spare hard hat on top of the cabinets
    const fols = [M.manila, M.fGreen, M.manila, M.fRed, M.manila, M.fBlue];
    fols.forEach((m, i) => things.add(boxGeo(V(-1.38 + 0.01 * (i % 2), 1.32 + i * 0.03, -2.85), V(-0.94 - 0.01 * (i % 3), 1.345 + i * 0.03, -2.42)), m));
    const hat = new THREE.SphereGeometry(0.15, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2); hat.scale(1, 0.85, 1.1);
    things.add(hat, M.hat, new THREE.Matrix4().makeTranslation(-1.73, 1.32, -2.62));
    things.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), M.hat, new THREE.Matrix4().makeTranslation(-1.73, 1.33, -2.62));

    // ---- the desk across the foreground: top, two drawer pedestals facing the camera, modesty panel ----
    const DX0 = -0.92, DX1 = 0.92, DZ0 = -1.32, DZ1 = -0.66;
    things.add(boxGeo(V(DX0 - 0.04, DESK_Y - 0.05, DZ0 - 0.03), V(DX1 + 0.04, DESK_Y, DZ1 + 0.04)), M.desk);
    for (const [x0, x1] of [[DX0, DX0 + 0.46], [DX1 - 0.46, DX1]]) {
      things.add(boxGeo(V(x0, 0, DZ0), V(x1, DESK_Y - 0.05, DZ1)), M.deskD);
      for (let i = 0; i < 3; i++) {
        const y = 0.06 + i * 0.22;
        things.add(boxGeo(V(x0 + 0.03, y, DZ1), V(x1 - 0.03, y + 0.19, DZ1 + 0.02)), M.desk);
        things.add(boxGeo(V((x0 + x1) / 2 - 0.07, y + 0.1, DZ1 + 0.02), V((x0 + x1) / 2 + 0.07, y + 0.125, DZ1 + 0.045)), M.brass);
      }
    }
    things.add(boxGeo(V(DX0 + 0.46, 0.22, DZ1 - 0.12), V(DX1 - 0.46, DESK_Y - 0.05, DZ1 - 0.1)), M.deskD);
    things.add(boxGeo(V(DX0 + 0.47, DESK_Y - 0.16, DZ1 - 0.1), V(DX1 - 0.47, DESK_Y - 0.05, DZ1 + 0.01)), M.desk); // centre drawer
    things.add(boxGeo(V(-0.06, DESK_Y - 0.12, DZ1 + 0.01), V(0.06, DESK_Y - 0.1, DZ1 + 0.035)), M.brass);
    things.add(boxGeo(V(-0.36, DESK_Y, -1.2), V(0.3, DESK_Y + 0.008, -0.82)), M.blotter);

    // orange desk lamp on the left corner: base, two arm pieces, a cone shade with a glowing bulb inside
    const LX = -0.64, LZ = -1.02;
    things.add(new THREE.CylinderGeometry(0.09, 0.1, 0.03, 24), M.lamp, new THREE.Matrix4().makeTranslation(LX, DESK_Y + 0.015, LZ));
    const arm1 = new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8); arm1.rotateZ(-0.35); things.add(arm1, M.lampD, new THREE.Matrix4().makeTranslation(LX + 0.06, DESK_Y + 0.2, LZ));
    const arm2 = new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8); arm2.rotateZ(1.05); things.add(arm2, M.lampD, new THREE.Matrix4().makeTranslation(LX + 0.24, DESK_Y + 0.43, LZ));
    const shade = new THREE.CylinderGeometry(0.05, 0.13, 0.17, 24, 1, true); shade.rotateZ(0.5);
    things.add(shade, M.lamp, new THREE.Matrix4().makeTranslation(LX + 0.39, DESK_Y + 0.43, LZ));
    const cap = new THREE.SphereGeometry(0.052, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); cap.rotateZ(0.5);
    things.add(cap, M.lamp, new THREE.Matrix4().makeTranslation(LX + 0.35, DESK_Y + 0.5, LZ));
    const lb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.9, 1.1) }));
    lb.position.set(LX + 0.42, DESK_Y + 0.37, LZ); lb.layers.set(NOINK); R.add(lb);
    // warm light pool on the desk under the lamp
    const add = (col: THREE.Color) => new THREE.MeshBasicMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), add(new THREE.Color(0.55, 0.34, 0.14)));
    pool.rotation.x = -Math.PI / 2; pool.position.set(LX + 0.45, DESK_Y + 0.012, LZ + 0.05); pool.layers.set(NOINK); R.add(pool);
    this.lampGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), add(new THREE.Color(1.1, 0.75, 0.35)));
    this.lampGlow.position.set(LX + 0.43, DESK_Y + 0.36, LZ + 0.03); this.lampGlow.layers.set(NOINK); R.add(this.lampGlow);

    // avocado rotary phone on the right corner: body, sloped top, dial, handset on its cradle, curly cord
    const PX = 0.6, PZ = -0.98;
    things.add(boxGeo(V(PX - 0.12, DESK_Y, PZ - 0.1), V(PX + 0.12, DESK_Y + 0.07, PZ + 0.1)), M.phone);
    const top = new THREE.CylinderGeometry(0.09, 0.12, 0.05, 4, 1); top.rotateY(Math.PI / 4); top.scale(1.15, 1, 0.95);
    things.add(top, M.phone, new THREE.Matrix4().makeTranslation(PX, DESK_Y + 0.095, PZ));
    const dial = new THREE.CylinderGeometry(0.06, 0.06, 0.012, 24); dial.rotateX(0.5);
    things.add(dial, M.dial, new THREE.Matrix4().makeTranslation(PX, DESK_Y + 0.1, PZ + 0.07));
    for (const sx of [-1, 1]) things.add(boxGeo(V(PX + sx * 0.12 - 0.02, DESK_Y + 0.1, PZ - 0.04), V(PX + sx * 0.12 + 0.02, DESK_Y + 0.15, PZ + 0.0)), M.phoneD);
    things.add(boxGeo(V(PX - 0.1, DESK_Y + 0.15, PZ - 0.045), V(PX + 0.1, DESK_Y + 0.175, PZ + 0.005)), M.phone);
    for (const sx of [-1, 1]) things.add(new THREE.CylinderGeometry(0.04, 0.035, 0.05, 16), M.phone, new THREE.Matrix4().makeTranslation(PX + sx * 0.13, DESK_Y + 0.165, PZ - 0.02));
    for (let i = 0; i < 9; i++) { const t = new THREE.TorusGeometry(0.012, 0.004, 6, 10); t.rotateY(Math.PI / 2); things.add(t, M.phoneD, new THREE.Matrix4().makeTranslation(PX - 0.13 - i * 0.018, DESK_Y + 0.02, PZ + 0.05 + i * 0.006)); }

    // coffee mug (orange band) in front of the phone, steam in stage()
    things.add(new THREE.CylinderGeometry(0.045, 0.042, 0.11, 20), M.mug, new THREE.Matrix4().makeTranslation(0.3, DESK_Y + 0.055, -0.82));
    things.add(new THREE.CylinderGeometry(0.0465, 0.0465, 0.03, 20), M.mugB, new THREE.Matrix4().makeTranslation(0.3, DESK_Y + 0.07, -0.82));
    const cof = new THREE.CircleGeometry(0.04, 20); cof.rotateX(-Math.PI / 2); things.add(cof, M.coffee, new THREE.Matrix4().makeTranslation(0.3, DESK_Y + 0.1, -0.82));
    const hdl = new THREE.TorusGeometry(0.03, 0.009, 8, 14, Math.PI); hdl.rotateZ(-Math.PI / 2); things.add(hdl, M.mug, new THREE.Matrix4().makeTranslation(0.345, DESK_Y + 0.055, -0.82));

    // folder stacks: a messy one at the left behind the lamp, a tall one at the back right
    const stack = (x: number, z: number, n: number, yaw: number) => {
      for (let i = 0; i < n; i++) {
        const m = [M.manila, M.fGreen, M.manila, M.fRed, M.manila, M.fBlue, M.manila][i % 7], j = ((i * 37) % 7) / 7 - 0.5;
        const g = boxGeo(V(-0.17, 0, -0.12), V(0.17, 0.022, 0.12)); g.rotateY(yaw + j * 0.18);
        things.add(g, m, new THREE.Matrix4().makeTranslation(x + j * 0.02, DESK_Y + i * 0.024, z));
      }
    };
    stack(-0.3, -1.14, 6, 0.15); stack(0.62, -1.2, 9, -0.2);
    // pencil cup with pencils
    things.add(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 14, 1, true), M.fBlue, new THREE.Matrix4().makeTranslation(-0.5, DESK_Y + 0.045, -1.2));
    for (const [dx, dz, t] of [[-0.01, 0, 0.15], [0.012, 0.01, -0.12], [0, -0.012, 0.05]]) {
      const pg = new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6); pg.rotateZ(t); things.add(pg, M.pencil, new THREE.Matrix4().makeTranslation(-0.5 + dx, DESK_Y + 0.11, -1.2 + dz));
    }

    // ---- CC0 furniture: desk chair behind Thornton, plant, coat rack, trash can, books, radio ----
    const P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("chairDesk", 0.1, 0, -2.15, 1.05, Math.PI);
    P("pottedPlant", 1.85, 0, -2.6, 1.3);
    P("coatRackStanding", -2.6, 0, -2.4, 1.8);
    P("trashcan", 1.15, 0, -1.0, 0.36);
    P("books", -1.68, 1.32, -2.62, 0.12, 0.3);
    P("plantSmall2", -1.15, 1.5, -2.6, 0.25);
    P("radio", 1.25, 0.86, -2.88, 0.22);
    placeProp(walls, glow, kit, "rugRectangle", 0, 0.004, -1.6, { w: 2.8 });

    // ---- the idea bulb's glow (HDR halo + core, so the bloom picks it up), shown from "Idee" in tick() ----
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add(new THREE.Color(1.25, 1.0, 0.4)));
    this.core = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add(new THREE.Color(1.5, 1.4, 0.9)));
    for (const m of [this.halo, this.core]) { m.layers.set(NOINK); m.visible = false; m.renderOrder = 5; R.add(m); }

    walls.build(R, false);
    things.build(R, true);
    glow.build(R, false);
  }

  protected tick(_id: number, f: number) {
    this.rain.offset.set(0.0004 * f, (f * 0.035) % 1);
    // clock at ten past four, the minute hand creeping on
    const min = 10 + f / 60;
    this.hands[0].rotation.z = -((4 + min / 60) / 12) * Math.PI * 2;
    this.hands[1].rotation.z = -(min / 60) * Math.PI * 2;
    const t = (f - (IDEE - LEAD)) / 8, on = t >= 0, s = on ? ease.back(t, 2.2) : 0, flick = 1 + 0.06 * Math.sin(f * 1.7);
    this.halo.visible = this.core.visible = on;
    this.halo.position.set(TX, BULB_Y, TZ + 0.02); this.halo.scale.setScalar(0.8 * Math.max(0.01, s) * flick);
    this.core.position.set(TX, BULB_Y + 0.04, TZ + 0.06); this.core.scale.setScalar(0.32 * Math.max(0.01, s));
  }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    for (const m of [this.halo, this.core, this.lampGlow]) m.quaternion.copy(cam.quaternion);
    return r;
  }
  protected stage(id: number, f: number, light: number) { return officeStage(id, f, light); }
}

// ---------------- who stands where ----------------
export const officeStage = (_id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] }, L = q(light);
  const up = GEORGE - LEAD, idea = IDEE - LEAD, dyn = DYN - LEAD;
  let o: FrontOpts;
  if (f < up) {
    // bent over his papers: lids half down, head tipped, writing hand on the desk
    o = { expr: "neutral", blink: blinkAt(f, 3) ? 1 : 0.55, headTilt: 7, look: -0.2, arms: ["hang", "cross"] };
  } else if (f < idea) {
    // looks up, proud: a little rise of the chest that springs and settles
    const k = ease.spring((f - up) / 26, 1.6, 5);
    o = { expr: "smile", blink: blinkAt(f, 3), look: 0.1, arms: ["hip", "hip"], tilt: q(-3 * (1 - k)), headTilt: Math.round(-3 * (1 - k)) };
  } else if (f < dyn) {
    o = { expr: "grin", blink: false, look: 0.2, arms: ["hip", "lift"], headTilt: -3 };
  } else {
    o = { expr: "grin", blink: false, look: 0.15, arms: ["hip", "up"], headTilt: 2 };
  }
  const stick = f >= dyn;
  out.places.push(personAt(stick ? "THORNTONx" : "THORNTON", THORNTON, TX, TZ, { mode: "stand", seed: SEED, light: L, ...o }, thorntonDraw(stick)));
  // fuse spark flickering at the tip of the stick
  if (stick) {
    const [hx, hy] = handUp(), k = (f >> 1) % 3;
    card(out, `spark|${k}`, 200, 200, drawSpark(k), TX + (hx - 300) * SU + 0.01, (975 - hy) * SU + 0.43, TZ + 0.05, 0.09 + 0.02 * k, false, f * 0.4);
  }
  // the idea bulb pops in with an overshoot above his head
  if (f >= idea) {
    const s = ease.back((f - idea) / 8, 2.2);
    card(out, "bulb", 400, 480, drawBulb, TX, BULB_Y + 0.03, TZ + 0.04, 0.34 * Math.max(0.05, s), false, 0.04 * Math.sin(f / 5));
  }
  // papers on the blotter, steam from the mug
  flatCard(out, "memo", 300, 220, drawMemo, -0.05, DESK_Y + 0.01, -1.02, 0.36, 0.12);
  flatCard(out, "memo", 300, 220, drawMemo, 0.12, DESK_Y + 0.012, -0.95, 0.3, -0.25);
  for (let i = 0; i < 3; i++) {
    const t = (f * 0.012 + i / 3) % 1;
    card(out, "steam", 128, 128, steam, 0.3 + 0.03 * Math.sin(t * 6 + i), DESK_Y + 0.14 + 0.22 * t, -0.82, 0.05 + 0.04 * t, true);
  }
  return out;
};
