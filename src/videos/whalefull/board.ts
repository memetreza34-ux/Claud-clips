// The chalkboard in the highway office (shots 5 and 15): a big green board with a wooden frame, chalk tray, chalk and
// eraser on a wood-panelled back wall; a cork board with the pinned road map and notes on its right, notes, a
// calendar and a poster on its left, a window with the pines (day) or the night sky, a hanging enamel lamp above it, a pendant
// and a plant as blurred foreground. The chalk drawing is a live canvas on the board that draws itself stroke group by
// stroke group on the beats (drawChalk from whale/draw.ts plus our own boom, dynamite and the two answer lines).
// Room x -4..4, z -3..3; the board hangs on the back wall (z = -3), chalk area 2.0 x 1.4 m centred at (0, 1.75).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit } from "../pigeon/build";
import { placeProp } from "../pigeon/props";
import { ctex, planksHD } from "../pigeon/paint";
import { panelTex, plasterTex, nightTex } from "../pigeon/ptex";
import { NOINK } from "../pigeon/ink";
import { Pen } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, roomShell, personAt, contact, card, clamp01, LEAD, q, blinkAt, isNight } from "./room";
import { THORNTON, drawChalk } from "../whale/draw";
import { A, beat } from "./shots";

// ---------------- beats ----------------
const S5 = A(5), STUECKE = beat(5, "Stücke"), MOEWEN = beat(5, "Möwen"), AUFESSEN = beat(5, "aufessen");
const S15 = A(15), DYNAMIT = beat(15, "Dynamit"), NICHT = beat(15, "nicht"), KLEIN = beat(15, "klein"), SCHNELL = beat(15, "schnell");

// board geometry (chalk canvas 1000 x 700 design units on 2.0 x 1.4 m)
const BZ = -2.93, BX0 = -1.0, BY1 = 2.45, CW = 2.0, CH = 1.4;
const bx = (c: number) => BX0 + (c / 1000) * CW;

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  // opens from the left, looking right across the board (the shot's warm key is frozen from this first view and comes
  // from screen right: a frontal first view would put the board in shade), glides right with the chalk (boom, crumbs
  // on "Stücke"), then down to the gulls and "lecker!" with Thornton at the right edge
  5: { keys: [
    { f: S5, pos: [-2.45, 1.72, -0.1], look: [bx(330), 1.92, BZ], fov: 40 },
    { f: S5 + 12, dur: 24, pos: [0.0, 1.78, -0.1], look: [bx(680), 1.95, BZ], fov: 40 },
    { f: MOEWEN - 14, dur: 16, pos: [0.78, 1.38, 0.2], look: [bx(810), 1.16, BZ], fov: 40 },
  ], creep: 0.0008, punch: [AUFESSEN], cInf: [6, 7, 8] },
  // night: the whale, right to the dynamite and the big chunks on "Dynamit", down-left to the answers on "klein", push
  // in on "schnell"
  15: { keys: [
    { f: S15, pos: [-0.5, 1.75, 0.35], look: [bx(300), 1.95, BZ], fov: 42 },
    { f: DYNAMIT - 4, dur: 20, pos: [0.3, 1.75, -0.1], look: [bx(720), 1.88, BZ], fov: 44 },
    { f: KLEIN - 6, dur: 14, pos: [-0.4, 1.6, -0.3], look: [bx(300), 1.45, BZ], fov: 42 },
    { f: SCHNELL - 8, dur: 12, pos: [-0.5, 1.4, -0.2], look: [bx(290), 1.2, BZ], fov: 44 },
  ], creep: 0.0008, punch: [SCHNELL], cInf: [6, 7, 7, 9] },
};
export const boardCam = camOf(CAMS);
export const boardDof = dofOf(CAMS);

// ---------------- painted textures ----------------
/** slate: deep green with eraser swirls and ghosts of old lessons */
const slateTex = () => ctex("bdSlate", 1024, 720, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 1024, 720); gr.addColorStop(0, "#2f6a4e"); gr.addColorStop(1, "#26573f");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 720);
  for (let i = 0; i < 26; i++) {
    const x = r() * 1024, y = r() * 720, rr = 60 + r() * 140;
    g.strokeStyle = `rgba(230,240,230,${0.03 + 0.04 * r()})`; g.lineWidth = 18 + r() * 30; g.lineCap = "round";
    g.beginPath(); g.arc(x, y, rr, r() * 6, r() * 6 + 1.5 + r() * 2); g.stroke();
  }
  g.fillStyle = "rgba(235,240,230,0.07)"; g.font = "bold 46px Arial, sans-serif";
  for (const [t, x, y] of [["v = s / t", 90, 640], ["1/2 t", 560, 90], ["E = m·v²", 760, 660], ["x 20", 380, 420]] as const) g.fillText(t, x, y);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,20,10,0.08)"; g.fillRect(r() * 1024, r() * 720, 2 + r() * 4, 2 + r() * 4); }
});
/** cork with the pinned highway map and paper notes */
const corkTex = () => ctex("bdCork", 512, 640, (g, r) => {
  g.fillStyle = "#c99a62"; g.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 2200; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,70,30,0.28)" : "rgba(240,200,140,0.3)"; g.fillRect(r() * 512, r() * 640, 2 + r() * 3, 2 + r() * 3); }
  // road map
  g.save(); g.translate(40, 40); g.rotate(-0.03);
  g.fillStyle = "#eef0dc"; g.fillRect(0, 0, 400, 330);
  g.fillStyle = "#9cc8e0"; g.beginPath(); g.moveTo(0, 0); g.lineTo(80, 0); g.bezierCurveTo(60, 110, 100, 200, 50, 330); g.lineTo(0, 330); g.closePath(); g.fill();
  g.fillStyle = "#bcd89a"; for (const [x, y, w, h] of [[150, 40, 90, 60], [260, 180, 110, 80], [120, 220, 70, 70]]) g.fillRect(x, y, w, h);
  g.lineCap = "round";
  for (const [w, c] of [[11, "#d9342b"], [6, "#ffd34a"]] as const) {
    g.strokeStyle = c; g.lineWidth = w;
    g.beginPath(); g.moveTo(120, 0); g.bezierCurveTo(110, 120, 170, 200, 130, 330); g.stroke();
    g.beginPath(); g.moveTo(130, 160); g.bezierCurveTo(220, 150, 300, 120, 400, 140); g.stroke();
  }
  g.strokeStyle = "#7a6a5a"; g.lineWidth = 3; g.beginPath(); g.moveTo(130, 160); g.lineTo(400, 300); g.stroke();
  g.fillStyle = "#3a2e4a"; g.font = "bold 22px Arial, sans-serif"; g.fillText("US 101", 150, 120); g.fillText("FLORENCE", 200, 300);
  g.strokeStyle = "#d9342b"; g.lineWidth = 6; g.beginPath(); g.arc(78, 200, 20, 0, 7); g.stroke();
  g.strokeStyle = "#3a2e4a"; g.lineWidth = 4; g.strokeRect(0, 0, 400, 330);
  g.restore();
  // notes
  const note = (x: number, y: number, w: number, h: number, c: string, a: number) => {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = "rgba(60,30,20,0.25)"; g.fillRect(5, 6, w, h);
    g.fillStyle = c; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(60,50,70,0.55)"; g.lineWidth = 4;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(12, 24 + k * 22); g.lineTo(w - 14 - (k % 2) * 30, 24 + k * 22); g.stroke(); }
    g.restore();
  };
  note(30, 410, 150, 130, "#fff3a8", 0.06); note(210, 400, 130, 150, "#ffffff", -0.04); note(360, 420, 120, 120, "#ffc6c0", 0.08);
  for (const [x, y, c] of [[60, 52, "#d9342b"], [430, 60, "#3f6fb5"], [70, 360, "#3f6fb5"], [420, 350, "#d9342b"], [100, 420, "#5ab04a"], [270, 408, "#d9342b"], [420, 428, "#3f6fb5"]] as const) {
    g.fillStyle = "rgba(40,20,20,0.35)"; g.beginPath(); g.arc(x + 4, y + 5, 10, 0, 7); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(x - 3, y - 3, 3, 0, 7); g.fill();
  }
});
/** wall calendar "NOV 1970" with a red ring on the day */
const calTex = () => ctex("bdCal", 256, 340, (g) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, 256, 340);
  g.fillStyle = "#3f6fb5"; g.fillRect(0, 0, 256, 110);
  g.fillStyle = "#fbf6e8"; g.font = "bold 44px Arial, sans-serif"; g.textAlign = "center"; g.fillText("NOV 1970", 128, 72);
  g.fillStyle = "#e2dccb"; for (let rr = 0; rr < 5; rr++) for (let c = 0; c < 7; c++) g.fillRect(12 + c * 34, 126 + rr * 40, 28, 32);
  g.strokeStyle = "#d9342b"; g.lineWidth = 6; g.beginPath(); g.ellipse(12 + 3 * 34 + 14, 126 + 1 * 40 + 16, 22, 20, 0, 0, 7); g.stroke();
  g.strokeStyle = "#2a2030"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 334);
});
/** a "SAFETY FIRST" poster of the highway division */
const posterTex = () => ctex("bdPoster", 256, 360, (g) => {
  g.fillStyle = "#f5c22a"; g.fillRect(0, 0, 256, 360);
  g.fillStyle = "#2a2030"; g.beginPath(); g.moveTo(128, 50); g.lineTo(220, 210); g.lineTo(36, 210); g.closePath(); g.fill();
  g.fillStyle = "#f5c22a"; g.beginPath(); g.moveTo(128, 85); g.lineTo(195, 195); g.lineTo(61, 195); g.closePath(); g.fill();
  g.fillStyle = "#2a2030"; g.fillRect(120, 110, 16, 50); g.fillRect(120, 168, 16, 16);
  g.font = "bold 40px Arial, sans-serif"; g.textAlign = "center"; g.fillText("SAFETY", 128, 270); g.fillText("FIRST", 128, 318);
  g.lineWidth = 8; g.strokeRect(4, 4, 248, 352);
});
/** day view out of the window: blue sky, clouds, a pine ridge */
const dayView = () => ctex("bdDay", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#4f8fe0"); gr.addColorStop(0.7, "#a9cdf0"); gr.addColorStop(1, "#e8d9bf");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#fff7ee"; for (const [x, y, s] of [[120, 120, 1], [380, 80, 0.8]]) for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + (i - 2.5) * 34 * s, y - Math.sin((i / 5) * Math.PI) * 30 * s, 34 * s, 0, 7); g.fill(); }
  for (let k = 0; k < 2; k++) {
    g.fillStyle = k ? "#2f6a3e" : "#4f8a5e";
    for (let x = -20; x < 540; x += 26 + r() * 10) { const h = (k ? 170 : 120) + r() * 70, y0 = 512 - (k ? 0 : 60); g.beginPath(); g.moveTo(x - 24, y0); g.lineTo(x, y0 - h); g.lineTo(x + 24, y0); g.closePath(); g.fill(); }
  }
});
const nightView = () => nightTex("boardwin", false);

// ---------------- the live chalk drawing ----------------
const CHALK = "rgba(245,245,235,0.92)";
type Seg = { at: number; dur: number; box: [number, number, number, number]; rtl?: boolean; draw: (p: Pen) => void };
const chalkText = (txt: string, x: number, y: number, size = 66) => (p: Pen) => {
  const g = p.g; g.fillStyle = CHALK; g.font = `bold ${size}px Arial, sans-serif`; g.textAlign = "left"; g.fillText(txt, x, y);
};
/** chalk boom star with "BUMM!" over the arrow (plan) */
const chalkBoom = (p: Pen) => {
  const c: [number, number] = [590, 95], pts: [number, number][] = [];
  for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI * 2, rr = i % 2 ? 34 : 70; pts.push([c[0] + rr * Math.cos(a), c[1] + rr * 0.8 * Math.sin(a)]); }
  p.stroke(pts, 8, CHALK);
  chalkText("BUMM!", 520, 190, 34)(p);
};
/** a chalk stick of dynamite with a sparking fuse (truth) */
const chalkStick = (p: Pen) => {
  const pts: [number, number][] = [[560, 150], [640, 90], [660, 115], [580, 175]];
  p.stroke([...pts, pts[0]], 8, CHALK); p.stroke([[650, 102], [672, 70], [668, 52]], 6, CHALK);
  for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.5; p.stroke([[668 + 14 * Math.cos(a), 52 + 14 * Math.sin(a)], [668 + 32 * Math.cos(a), 52 + 32 * Math.sin(a)]], 5, CHALK); }
};
/** crumbs at the gulls' beaks and little hearts (plan, "happy gulls eating") */
const chalkFeast = (p: Pen) => {
  for (let i = 0; i < 3; i++) {
    const x = 640 + i * 110;
    for (let k = 0; k < 3; k++) p.stroke([[x + 30 + k * 9, 556 + (k % 2) * 8], [x + 36 + k * 9, 560 + (k % 2) * 8]], 7, CHALK);
    const hx = x + 4, hy = 470;
    p.stroke([[hx, hy + 14], [hx - 14, hy], [hx - 8, hy - 9], [hx, hy - 2], [hx + 8, hy - 9], [hx + 14, hy], [hx, hy + 14]], 5, CHALK);
  }
};
const PLAN: Seg[] = [
  { at: S5 - 2, dur: 14, box: [40, 120, 500, 310], draw: drawChalk("plan", 0) },
  { at: S5 + 14, dur: 6, box: [500, 170, 660, 262], draw: drawChalk("plan", 0.25) },
  { at: S5 + 20, dur: 6, box: [500, 15, 690, 200], draw: chalkBoom },
  { at: STUECKE - 3, dur: 9, box: [670, 130, 940, 330], draw: drawChalk("plan", 0.5) },
  { at: MOEWEN - 14, dur: 6, box: [690, 370, 780, 470], draw: drawChalk("plan", 0.75) },
  { at: MOEWEN - 3, dur: 7, box: [580, 480, 880, 560], draw: drawChalk("plan", 1) },
  { at: MOEWEN + 6, dur: 8, box: [600, 440, 900, 600], draw: chalkFeast },
  { at: AUFESSEN - 4, dur: 9, box: [600, 575, 900, 665], draw: drawChalk("plan", 1) },
];
const TRUTH: Seg[] = [
  { at: S15 - 2, dur: 14, box: [40, 120, 500, 310], draw: drawChalk("truth", 0) },
  { at: DYNAMIT - 10, dur: 6, box: [500, 170, 660, 262], draw: drawChalk("truth", 0.25) },
  { at: DYNAMIT - 3, dur: 6, box: [540, 30, 700, 185], draw: chalkStick },
  { at: DYNAMIT + 6, dur: 10, box: [630, 60, 880, 560], draw: drawChalk("truth", 0.5) },
  { at: NICHT - 10, dur: 8, box: [440, 80, 640, 540], rtl: true, draw: drawChalk("truth", 0.75) },
  { at: KLEIN - 3, dur: 9, box: [70, 430, 520, 520], draw: chalkText("klein? nein.", 80, 500) },
  { at: SCHNELL - 3, dur: 9, box: [70, 520, 520, 610], draw: chalkText("schnell? ja!", 80, 590) },
  { at: SCHNELL + 8, dur: 6, box: [70, 600, 520, 640], draw: (p) => { p.stroke([[80, 612], [470, 606]], 7, CHALK); p.stroke([[90, 628], [440, 624]], 6, CHALK); } },
];

class ChalkLayer {
  mat: THREE.MeshBasicMaterial;
  private tex: THREE.CanvasTexture; private g: CanvasRenderingContext2D; private key = ""; private grain: HTMLCanvasElement;
  constructor(parent: THREE.Object3D) {
    const cv = document.createElement("canvas"); cv.width = 2000; cv.height = 1400;
    this.g = cv.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), this.mat);
    mesh.position.set(BX0 + CW / 2, BY1 - CH / 2, BZ + 0.006); mesh.layers.set(NOINK);
    parent.add(mesh);
    // chalk grain: random holes punched out of the strokes
    this.grain = document.createElement("canvas"); this.grain.width = 2000; this.grain.height = 1400;
    const gg = this.grain.getContext("2d")!;
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 26000; i++) { gg.fillStyle = `rgba(0,0,0,${0.25 + 0.6 * r()})`; gg.fillRect(r() * 2000, r() * 1400, 2 + r() * 4, 1 + r() * 3); }
  }
  update(segs: Seg[] | null, f: number) {
    const prog = (segs ?? []).map((s) => Math.round(clamp01((f - s.at) / s.dur) * 8) / 8);
    const key = segs ? prog.join(",") : "none";
    if (key === this.key) return;
    this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 2000, 1400);
    if (segs) {
      g.setTransform(2, 0, 0, 2, 0, 0);
      const p = new Pen(g);
      segs.forEach((s, i) => {
        const k = prog[i]; if (k <= 0) return;
        const [x0, y0, x1, y1] = s.box, w = (x1 - x0) * k;
        g.save(); g.beginPath(); g.rect(s.rtl ? x1 - w : x0, y0, w, y1 - y0); g.clip(); s.draw(p); g.restore();
      });
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "destination-out"; g.drawImage(this.grain, 0, 0); g.globalCompositeOperation = "source-over";
    }
    this.tex.needsUpdate = true;
  }
}

/** warm light pool of the hanging lamp on the board, 256 x 256 */
const fxPool = (a: number) => (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 70, 0, 128, 110, 128);
  gr.addColorStop(0, `rgba(255,214,150,${a})`); gr.addColorStop(0.55, `rgba(255,190,120,${a * 0.4})`); gr.addColorStop(1, "rgba(255,190,120,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};

// ---------------- the room ----------------
export class BoardWorld extends RoomWorld {
  private chalk: ChalkLayer;
  private views: THREE.MeshBasicMaterial[] = [];
  private bulbs: THREE.MeshBasicMaterial[] = [];

  constructor(kit: Kit) {
    super(boardCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    const M = {
      floor: lam("bdFloor", () => ({ map: planksHD(), color: "#c99a6c" })),
      low: lam("bdLow", () => ({ map: panelTex("#7a4a2e") })),
      wall: lam("bdWall", () => ({ map: panelTex("#b07a4c") })),
      rail: lam("bdRail", () => ({ color: "#4a2e1e" })),
      ceil: lam("bdCeil", () => ({ map: plasterTex("#efe4cf") })),
      frame: lam("bdFrame", () => ({ color: "#9a6236" })),
      frameD: lam("bdFrameD", () => ({ color: "#6a3e22" })),
      slate: lam("bdSlateM", () => ({ map: slateTex() })),
      cork: lam("bdCorkM", () => ({ map: corkTex() })),
      cal: lam("bdCalM", () => ({ map: calTex() })),
      poster: lam("bdPosterM", () => ({ map: posterTex() })),
      chalk: lam("bdChalkM", () => ({ color: "#f7f5ec" })),
      chalkY: lam("bdChalkY", () => ({ color: "#ffe27a" })),
      felt: lam("bdFelt", () => ({ color: "#5a5a66" })),
      eraserTop: lam("bdEraser", () => ({ color: "#c08a4e" })),
      shade: lam("bdShade", () => ({ color: "#2f7a5a" })),
      cord: lam("bdCord", () => ({ color: "#3a2a2a" })),
      winF: lam("bdWinF", () => ({ color: "#f1ead8" })),
      desk: lam("bdDesk", () => ({ color: "#8a5a36" })),
      paper: lam("bdPaper", () => ({ color: "#f6f0de" })),
      mug: lam("bdMug", () => ({ color: "#d9342b" })),
    };
    // window on the back wall right of the board
    roomShell(walls, things, { floor: M.floor, low: M.low, wall: M.wall, rail: M.rail, ceil: M.ceil }, [[2.5, 3.5, 1.35, 2.6]], [2.4, 1.8]);
    for (const [a, b] of [[V(2.44, 1.29, -3.04), V(3.56, 1.37, -2.86)], [V(2.44, 2.58, -3.04), V(3.56, 2.66, -2.94)], [V(2.44, 1.35, -3.04), V(2.52, 2.6, -2.94)],
      [V(3.48, 1.35, -3.04), V(3.56, 2.6, -2.94)], [V(2.97, 1.35, -3.02), V(3.03, 2.6, -2.98)], [V(2.5, 1.95, -3.02), V(3.5, 2.0, -2.98)]] as const) things.add(boxGeo(a, b), M.winF);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: dayView() }));
    view.position.set(3.0, 1.95, -3.5); view.layers.set(NOINK); R.add(view); this.views.push(view.material);

    // the board: dark frame, slate, lighter moulding, chalk tray with chalk and an eraser
    const fx0 = BX0 - 0.1, fx1 = BX0 + CW + 0.1, fy0 = BY1 - CH - 0.1, fy1 = BY1 + 0.1;
    things.add(boxGeo(V(fx0 - 0.03, fy0 - 0.03, -2.99), V(fx1 + 0.03, fy1 + 0.03, -2.965)), M.frameD);
    walls.add(boxGeo(V(BX0 - 0.02, BY1 - CH - 0.02, -2.97), V(BX0 + CW + 0.02, BY1 + 0.02, BZ)), M.slate);
    for (const [a, b] of [[V(fx0, fy1 - 0.1, -2.97), V(fx1, fy1, -2.9)], [V(fx0, fy0, -2.97), V(fx1, fy0 + 0.1, -2.9)],
      [V(fx0, fy0, -2.97), V(fx0 + 0.1, fy1, -2.9)], [V(fx1 - 0.1, fy0, -2.97), V(fx1, fy1, -2.9)]] as const) things.add(boxGeo(a, b), M.frame);
    things.add(boxGeo(V(fx0 + 0.05, fy0 - 0.02, -2.97), V(fx1 - 0.05, fy0 + 0.02, -2.78)), M.frame); // tray
    things.add(boxGeo(V(fx0 + 0.05, fy0 + 0.02, -2.8), V(fx1 - 0.05, fy0 + 0.05, -2.78)), M.frameD); // tray lip
    for (const [x, z, m] of [[-0.7, -2.84, M.chalk], [-0.62, -2.82, M.chalk], [0.3, -2.83, M.chalkY], [0.75, -2.84, M.chalk]] as const)
      things.add(boxGeo(V(x, fy0 + 0.02, z - 0.007), V(x + 0.08, fy0 + 0.034, z + 0.007)), m);
    things.add(boxGeo(V(0.45, fy0 + 0.02, -2.88), V(0.6, fy0 + 0.05, -2.82)), M.felt);
    things.add(boxGeo(V(0.45, fy0 + 0.05, -2.88), V(0.6, fy0 + 0.075, -2.82)), M.eraserTop);
    // cork board with the road map right of the board (seen behind Thornton and in the views from the left);
    // calendar, poster and notes on the left
    things.add(boxGeo(V(1.22, 1.2, -2.99), V(2.3, 2.5, -2.95)), M.frameD);
    walls.add(boxGeo(V(1.26, 1.24, -2.97), V(2.26, 2.46, -2.94)), M.cork);
    walls.add(boxGeo(V(-1.75, 1.75, -2.98), V(-1.35, 2.28, -2.965)), M.cal);
    walls.add(boxGeo(V(-2.35, 1.6, -2.98), V(-1.9, 2.23, -2.965)), M.poster);
    for (const [x, y, a] of [[-1.5, 1.4, 0.1], [-1.75, 1.3, -0.08]] as const) {
      const pg = boxGeo(V(-0.1, -0.13, 0), V(0.1, 0.13, 0.006)); pg.rotateZ(a); pg.translate(x, y, -2.97); things.add(pg, M.paper);
    }
    // hanging enamel lamp over the board (and a second one in the foreground, blurred)
    const lamp = (x: number, y: number, z: number) => {
      things.add(boxGeo(V(x - 0.006, y + 0.18, z - 0.006), V(x + 0.006, 3.2, z + 0.006)), M.cord);
      const sh = new THREE.CylinderGeometry(0.07, 0.3, 0.2, 24, 1, true); sh.translate(x, y + 0.1, z); things.add(sh, M.shade);
      const top = new THREE.CylinderGeometry(0.05, 0.07, 0.06, 16); top.translate(x, y + 0.22, z); things.add(top, M.shade);
      const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.5, 0.95) }); this.bulbs.push(bm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10), bm); bulb.position.set(x, y + 0.03, z); bulb.layers.set(NOINK); R.add(bulb);
    };
    lamp(0, 2.72, -2.35); lamp(0.95, 2.55, -0.95);
    // desk against the right wall with papers and a mug
    things.add(boxGeo(V(2.6, 0.72, -2.6), V(3.9, 0.78, -1.3)), M.desk);
    for (const [x, z] of [[2.65, -2.55], [3.85, -2.55], [2.65, -1.35], [3.85, -1.35]]) things.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.72, z + 0.04)), M.frameD);
    things.add(boxGeo(V(2.8, 0.78, -2.3), V(3.2, 0.79, -2.0)), M.paper);
    const mug = new THREE.CylinderGeometry(0.045, 0.04, 0.11, 16); mug.translate(3.35, 0.835, -1.9); things.add(mug, M.mug);
    // CC0 furniture
    const P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("bookcaseOpen", -3.75, 0, -1.6, 1.9, Math.PI / 2); P("bookcaseClosedWide", -3.78, 0, 0.1, 1.5, Math.PI / 2);
    P("pottedPlant", -2.7, 0, -2.65, 1.3); P("pottedPlant", -0.95, 0, -0.55, 1.65, 0.6);
    P("coatRackStanding", 3.7, 0, -2.65, 1.8); P("chairDesk", 3.1, 0, -0.9, 1.0, Math.PI);
    P("trashcan", -1.5, 0, -2.6, 0.45); P("books", 3.5, 0.78, -2.35, 0.16, 0.3); P("radio", -3.65, 1.5, -1.6, 0.28, Math.PI / 2);
    P("chair", 2.9, 0, -0.4, 0.95, -0.5); P("cardboardBoxClosed", -2.1, 0, -2.6, 0.45, 0.2);
    walls.build(R, false); things.build(R, true); glow.build(R, false);
    this.chalk = new ChalkLayer(R);
  }

  protected tick(id: number, f: number) {
    const night = isNight(id);
    for (const v of this.views) v.map = night ? nightView() : dayView();
    // the chalk is unlit: dim and cool it at night, the lamp keeps it readable
    if (night) this.chalk.mat.color.setRGB(0.78, 0.84, 1.0); else this.chalk.mat.color.setRGB(0.97, 0.96, 0.92);
    // at night only the board lamp burns; the foreground pendant is off
    this.bulbs.forEach((b, i) => (i === 1 && night ? b.color.setRGB(0.25, 0.25, 0.3) : b.color.setRGB(1.9, 1.5, 0.95)));
    this.chalk.update(id === 5 ? PLAN : id === 15 ? TRUTH : null, f);
  }
  protected stage(id: number, f: number, light: number) { return boardStage(id, f, light); }
}

// ---------------- who stands where ----------------
const boardStage = (id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] }, L = q(light);
  // warm pool of the lamp on the upper board (strong at night: the one warm light in the blue room)
  if (isNight(id)) card(out, "pool|n", 256, 256, fxPool(0.42), 0, 2.2, BZ + 0.03, 1.7, true);
  else card(out, "pool|d", 256, 256, fxPool(0.1), 0, 2.2, BZ + 0.03, 1.8, true);
  if (id === 5) {
    // Thornton at the right edge of the board, chalk in hand, proud grin from "Möwen"
    const proud = f >= MOEWEN - LEAD, point = f >= AUFESSEN - LEAD;
    out.places.push(personAt("THORNTON", THORNTON, 1.12, -2.55, {
      mode: "stand", expr: proud ? "grin" : "smile", facing: -1, look: -1, blink: blinkAt(f, 3), light: L,
      arms: point ? ["point", "hip"] : f >= MOEWEN - 16 ? ["reach", "hip"] : ["hang", "hip"], reachLift: 0.35,
    }));
    contact(out, 1.12, 0, -2.55, 0.6);
  }
  return out;
};
