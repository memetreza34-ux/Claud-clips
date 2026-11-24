// Our own drawings for "Der explodierende Wal" (Pen, design space per function): the whale, blubber chunks, the sand
// cloud, the new car, seagull, dynamite, crate, detonator, TV camera, stink lines, chalk diagrams, egg splat,
// bulldozer, newspaper, the cast outfits. All generic designs, no likeness of real people.
import { Pen, Outfit, INK, shade } from "../pigeon/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 14, j = 0.22): P2[] =>
  Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, r = 1 - j / 2 + j * hash(i, seed); return [cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)] as P2; });

// ---------------- cast ----------------
/** the engineer: white shirt, grey slacks, yellow hard hat */
export const THORNTON: Outfit = { jacket: "#f1f0ea", pants: "#4a4e5a", boots: "#2e2a28", hat: "cap", cap: "#f5c22a", buttons: "#c9ccd2", skin: "#fbf8f2" };
/** the veteran who warned: brown work jacket, olive cap, moustache, stout */
export const VET: Outfit = { jacket: "#8a4b32", pants: "#3f4a3a", boots: "#3a2a22", hat: "cap", cap: "#5d6b33", moustache: "#6a5440", buttons: "#d8c08a", build: "stout", skin: "#ecd0b6" };
/** the calm woman on the dune */
export const WOMAN: Outfit = { jacket: "#e8d8b0", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#a0522d", dress: "#3f8fa0", skin: "#ffe2c2" };
const COATS = ["#3f6fb5", "#c25a3a", "#5d7a3a", "#d9a441", "#2f5f6a", "#7b5ac9", "#b04a6a"];
const HAIRS = ["#3a2a1e", "#d9b26a", "#6a3a22", "#2a2a2a", "#9a6a3a"];
const SKINS = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067", "#8d5a3c"];
/** spectators in 1970s colours */
export const crowd = (v: number): Outfit => {
  const o: Outfit = { jacket: COATS[v % 7], pants: ["#3b3f52", "#5a4a3a", "#2f4a6a"][v % 3], boots: "#4a3426", skin: SKINS[v % 5], hat: "hair", hair: HAIRS[v % 5] };
  if (v % 3 === 1) return { ...o, dress: ["#d9a441", "#c25a7a", "#5a8fc2", "#e07a3a"][v % 4] };
  if (v % 4 === 2) return { ...o, hat: "cap", cap: ["#c0353a", "#2f5f6a"][v % 2] };
  return o;
};

// ---------------- the whale ----------------
const SKIN_W = "#6d7c8c", SKIN_D = "#4b5868", BELLY = "#b9c4cc";
/** dead sperm whale lying on the sand, 1400 x 620 design, belly line at y = 600.
 *  gone: 0 intact .. 1 (a crater bitten out of the middle, after the blast); scorch darkens it. */
export const drawWhale = (o: { gone?: number; scorch?: number; eye?: "x" | "dot" } = {}) => (p: Pen) => {
  const gone = o.gone ?? 0, sc = o.scorch ?? 0, g = p.g;
  const base = sc ? shade(SKIN_W, 1 - 0.35 * sc) : SKIN_W;
  // big boxy head on the left, body tapering right to the flukes
  const body: P2[] = [[60, 600], [40, 420], [70, 250], [160, 170], [420, 150], [640, 190], [860, 260], [1060, 340], [1200, 420], [1250, 470], [1230, 560], [1150, 600]];
  p.gradFill(body, base, SKIN_D, rad(-110), 0.3);
  // belly band and throat grooves
  p.clip(body, () => {
    p.poly([[40, 600], [60, 520], [400, 540], [800, 560], [1180, 560], [1240, 600]], BELLY, 0);
    for (let i = 0; i < 7; i++) p.stroke([[90 + i * 40, 590], [140 + i * 44, 540]], 5, shade(BELLY, 0.8));
    // wrinkles on the back
    for (let i = 0; i < 9; i++) p.arc(500 + i * 70, 260 + i * 22, 30, 12, 200, 340, 4, shade(base, 0.8));
    if (gone > 0) {
      // crater: the middle blown out, raw blubber showing
      const c = blob(640, 330 + 120 * (1 - gone), 260 * gone + 40, 230 * gone + 30, 9, 16, 0.3);
      p.poly(c, "#f0c7b8", 0);
      p.poly(blob(640, 360 + 120 * (1 - gone), 180 * gone + 20, 150 * gone + 20, 4, 14, 0.35), "#d98e86", 0);
      for (let i = 0; i < 8; i++) p.stroke([[520 + i * 30, 300], [530 + i * 30, 420]], 4, "#c97a74");
    }
    if (sc > 0) { g.globalAlpha = 0.5 * sc; p.poly(blob(640, 360, 420, 260, 3), "#2a2028", 0); g.globalAlpha = 1; }
  });
  p.poly(body, null, 10);
  // flukes
  p.poly([[1230, 470], [1330, 380], [1390, 420], [1300, 500], [1390, 600], [1320, 610], [1220, 540]], base, 10);
  // pectoral flipper
  p.poly([[430, 540], [520, 500], [560, 590], [470, 610]], shade(base, 0.9), 8);
  // mouth line and eye
  p.stroke([[60, 520], [240, 540], [330, 535]], 7);
  const ex = 250, ey = 400;
  if ((o.eye ?? "x") === "x") { p.stroke([[ex - 18, ey - 18], [ex + 18, ey + 18]], 9); p.stroke([[ex + 18, ey - 18], [ex - 18, ey + 18]], 9); }
  else p.ell(ex, ey, 10, 10, INK, 0);
};

/** a blubber chunk, 220 x 180 design, seed picks the shape */
export const drawChunk = (seed: number) => (p: Pen) => {
  const pts = blob(110, 95, 90, 70, seed, 12, 0.35);
  p.poly(pts, "#f2d0c2", 7);
  p.clip(pts, () => {
    p.poly(blob(110 + 30 * (hash(seed, 2) - 0.5), 50, 110, 40, seed + 3, 10, 0.2), SKIN_W, 0);
    p.ell(120, 120, 30, 18, "#e2a69c", 0);
  });
  p.poly(pts, null, 7);
};

/** a sand / smoke puff of the blast, 300 x 300; col fades with a */
export const drawPuff = (col: string) => (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(150, 150, 10, 150, 150, 148);
  const clear = col.replace(/rgba?\(([^,]+),([^,]+),([^,)]+)(,[^)]*)?\)/, "rgba($1,$2,$3,0)");
  gr.addColorStop(0, col); gr.addColorStop(0.45, col); gr.addColorStop(1, clear);
  g.fillStyle = gr; g.fillRect(0, 0, 300, 300);
};

/** cartoon boom star, 600 x 600, t 0..1 */
export const drawBoom = (t: number) => (p: Pen) => {
  const c = 300, e = 1 - (1 - t) ** 3, n = 14, pts: P2[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = (i / (2 * n)) * Math.PI * 2, r = (i % 2 ? 120 : 280) * (0.4 + 0.6 * e) * (0.85 + 0.3 * hash(i, 5));
    pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
  }
  p.poly(pts, "#ffb02e", 10);
  p.poly(pts.map(([x, y]) => [c + (x - c) * 0.62, c + (y - c) * 0.62] as P2), "#ffe46a", 0);
  p.ell(c, c, 70 * (1 - t) + 20, 70 * (1 - t) + 20, "#ffffff", 0);
};

// ---------------- props ----------------
/** a stick of dynamite, 90 x 320 (fuse at the top) */
export const drawStick = (p: Pen) => {
  p.poly([[15, 60], [75, 60], [75, 310], [15, 310]], "#d9342b", 7);
  p.poly([[15, 60], [75, 60], [75, 85], [15, 85]], "#a8221c", 0);
  p.poly([[15, 60], [75, 60], [75, 310], [15, 310]], null, 7);
  p.stroke([[45, 60], [50, 30], [40, 8]], 6, "#3a2a22");
};
/** a crate of dynamite (sticks sticking out), 420 x 320, base at the bottom */
export const drawCrate = (p: Pen) => {
  const wood = "#c08f55", dark = "#8a6436";
  for (let i = 0; i < 6; i++) { const x = 80 + i * 52; p.poly([[x, 40 + 14 * hash(i, 1)], [x + 44, 40 + 14 * hash(i, 1)], [x + 44, 130], [x, 130]], "#d9342b", 6); p.stroke([[x + 22, 40 + 14 * hash(i, 1)], [x + 24, 18]], 5, "#3a2a22"); }
  p.poly([[40, 310], [380, 310], [380, 110], [40, 110]], wood, 8);
  for (let i = 1; i < 3; i++) p.stroke([[40, 110 + i * 67], [380, 110 + i * 67]], 5, dark);
  p.ell(210, 210, 46, 46, "#f3e2b0", 5);
  p.stroke([[190, 190], [230, 230]], 9, "#d9342b"); p.stroke([[230, 190], [190, 230]], 9, "#d9342b");
};
/** plunger detonator, 300 x 380, down 0..1 */
export const drawPlunger = (down: number) => (p: Pen) => {
  const y = 40 + 90 * down;
  p.stroke([[150, y + 20], [150, 230]], 16, "#8a8f98");
  p.band([[60, y], [240, y]], "#3a2a22", 26, 6, "round");
  p.poly([[40, 370], [260, 370], [260, 220], [40, 220]], "#b23a2a", 9);
  p.poly([[70, 250], [230, 250], [230, 280], [70, 280]], "#f3e2b0", 0);
  p.stroke([[260, 330], [300, 340]], 8, "#2a2a2a");
};
/** shiny new 1970s sedan, side view, 1000 x 380 (wheels on y = 360). crush 0..1 flattens the roof, bow = gift bow */
export const drawCar = (o: { crush?: number; bow?: boolean; col?: string } = {}) => (p: Pen) => {
  const c = o.crush ?? 0, col = o.col ?? "#2fa37a", roof = 70 + 120 * c;
  const body: P2[] = [[30, 300], [30, 220], [120, 200], [250, roof + 120], [300, roof], [660, roof], [740, roof + 120], [930, 200], [980, 230], [980, 300]];
  p.gradFill(body, col, shade(col, 0.7), rad(-100), 0.35); p.poly(body, null, 9);
  // windows
  if (c < 0.5) {
    p.poly([[275, roof + 112], [315, roof + 20], [470, roof + 20], [470, roof + 112]], "#bfe6f2", 6);
    p.poly([[490, roof + 112], [490, roof + 20], [645, roof + 20], [715, roof + 112]], "#bfe6f2", 6);
    p.stroke([[330, roof + 40], [300, roof + 90]], 8, "rgba(255,255,255,0.7)");
  } else {
    p.poly([[280, roof + 100], [300, roof + 30], [700, roof + 30], [720, roof + 100]], "#7a8e98", 6);
    for (let i = 0; i < 6; i++) p.stroke([[400 + i * 30, roof + 40], [380 + i * 50, roof + 95]], 4, "#e8f4f8");
  }
  // chrome trim, bumpers, lights
  p.band([[40, 250], [970, 250]], "#e6e9ee", 8, 2);
  p.band([[20, 300], [120, 300]], "#e6e9ee", 18, 4, "round"); p.band([[890, 300], [990, 300]], "#e6e9ee", 18, 4, "round");
  p.ell(960, 230, 16, 12, "#fff3b0", 5); p.ell(40, 235, 12, 10, "#e0402e", 5);
  for (const x of [220, 790]) { p.ell(x, 320, 68, 68, "#222", 8); p.ell(x, 320, 40, 40, "#f4f4f4", 4); p.ell(x, 320, 22, 22, "#c9ccd2", 4); }
  if (o.bow) {
    const bx = 480, by = roof - 6;
    p.ell(bx - 50, by - 30, 50, 30, "#e0303a", 7, 0, 360, -20); p.ell(bx + 50, by - 30, 50, 30, "#e0303a", 7, 0, 360, 20);
    p.ell(bx, by - 26, 20, 20, "#b81f28", 6);
  }
};
/** seagull, 300 x 240, wings 0 (up) .. 1 (down); pose "fly" | "stand" | "faint" */
export const drawGull = (o: { flap?: number; pose?: "fly" | "stand" | "faint" } = {}) => (p: Pen) => {
  const pose = o.pose ?? "fly", fl = o.flap ?? 0.5, W = "#ffffff", G = "#aeb8c2";
  if (pose === "fly") {
    const wy = 120 - 90 * (1 - fl) + 40 * fl;
    p.poly([[150, 120], [60, wy], [10, wy - 10], [70, 140]], G, 6); p.poly([[150, 120], [240, wy], [290, wy - 10], [230, 140]], G, 6);
    p.ell(150, 135, 60, 28, W, 7); p.ell(200, 118, 26, 22, W, 6); p.poly([[222, 116], [256, 122], [222, 130]], "#f5b62a", 5);
    p.dot(206, 112, 4);
    return;
  }
  if (pose === "faint") {
    // flat on its back: legs in the air, wing flopped out, X eyes, tongue out
    p.stroke([[130, 170], [120, 110], [108, 100]], 7, "#f5b62a"); p.stroke([[165, 170], [172, 108], [186, 98]], 7, "#f5b62a");
    p.poly([[100, 200], [40, 236], [120, 226]], G, 6);
    p.ell(150, 195, 70, 34, W, 7);
    p.ell(240, 205, 32, 28, W, 6); p.poly([[268, 210], [298, 222], [266, 226]], "#f5b62a", 5);
    p.stroke([[228, 196], [240, 208]], 4); p.stroke([[240, 196], [228, 208]], 4);
    p.ell(262, 232, 6, 10, "#e86e78", 3);
    return;
  }
  p.stroke([[135, 175], [130, 225]], 6, "#f5b62a"); p.stroke([[160, 175], [165, 225]], 6, "#f5b62a");
  p.ell(150, 140, 55, 45, W, 7); p.ell(115, 140, 45, 26, G, 6);
  p.ell(190, 82, 32, 30, W, 6); p.poly([[216, 80], [256, 88], [216, 98]], "#f5b62a", 5);
  p.dot(196, 76, 4);
};
/** green stink waves, 300 x 420, phase 0..1 */
export const drawStink = (ph: number) => (p: Pen) => {
  for (let k = 0; k < 3; k++) {
    const pts: P2[] = [];
    for (let i = 0; i <= 16; i++) { const y = 400 - i * 24; pts.push([70 + k * 80 + 22 * Math.sin(i * 0.8 + ph * Math.PI * 2 + k), y]); }
    p.stroke(pts, 12, ["#9ccc4a", "#7fb03a", "#b7d86a"][k]);
  }
};
/** 1970s TV news film camera seen from behind its operator's shoulder, 800 x 600 */
export const drawTVCam = (p: Pen) => {
  p.poly([[120, 600], [180, 380], [420, 300], [640, 340], [720, 600]], "#3a3f4a", 10); // operator's shoulder/back
  p.poly([[260, 330], [620, 330], [620, 150], [260, 150]], "#2a2d33", 10);
  p.ell(330, 150, 70, 70, "#2a2d33", 10); p.ell(500, 150, 70, 70, "#2a2d33", 10);
  p.ell(330, 150, 20, 20, "#777", 5); p.ell(500, 150, 20, 20, "#777", 5);
  p.poly([[620, 210], [760, 190], [760, 290], [620, 270]], "#1a1c20", 9);
  p.ell(700, 240, 18, 18, "#e0302a", 0);
};
/** sign post with a distance, 260 x 520 */
export const drawSign = (txt: string) => (p: Pen) => {
  p.poly([[118, 520], [142, 520], [142, 160], [118, 160]], "#8a6436", 6);
  p.poly([[10, 60], [220, 60], [255, 120], [220, 180], [10, 180]], "#f4ead2", 8);
  const g = p.g; g.fillStyle = INK; g.font = "bold 64px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.fillText(txt, 120, 145);
};
/** a measuring tape across the whale, 1400 x 200, u 0..1 unrolled */
export const drawTape = (u: number, label: string) => (p: Pen) => {
  const x1 = 40 + 1300 * u;
  p.band([[40, 150], [x1, 150]], "#f5d23a", 36, 4);
  for (let x = 60; x < x1; x += 40) p.stroke([[x, 134], [x, 150]], 4);
  p.poly([[x1 - 10, 110], [x1 + 50, 110], [x1 + 50, 190], [x1 - 10, 190]], "#e0402e", 7);
  if (u > 0.95) {
    const g = p.g;
    p.poly([[500, 10], [900, 10], [900, 110], [500, 110]], "#ffffff", 8);
    g.fillStyle = INK; g.font = "bold 84px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.fillText(label, 700, 92);
  }
};
/** bulldozer, side view, 700 x 420; blade 0 (low) .. 1 (raised) */
export const drawDozer = (blade: number) => (p: Pen) => {
  p.poly([[120, 330], [600, 330], [600, 180], [420, 180], [420, 80], [220, 80], [220, 180], [120, 180]], "#f2b51e", 9);
  p.poly([[250, 110], [390, 110], [390, 175], [250, 175]], "#bfe6f2", 6);
  p.poly([[100, 410], [620, 410], [660, 370], [620, 330], [100, 330], [60, 370]], "#3a3a3a", 9);
  for (let i = 0; i < 6; i++) p.ell(130 + i * 90, 370, 26, 26, "#777", 5);
  const by = 300 - 80 * blade;
  p.stroke([[600, 250], [640, by]], 14, "#555");
  p.poly([[630, by - 110], [690, by - 120], [700, by + 110], [640, by + 100]], "#f2b51e", 9);
  p.stroke([[480, 80], [480, 30]], 12, "#555");
};
/** a sand mound, 600 x 240 */
export const drawMound = (p: Pen) => p.poly(blob(300, 200, 280, 120, 7, 16, 0.12).map(([x, y]) => [x, Math.min(y, 230)] as P2), "#e5cf9c", 8);

/** the next day's newspaper, 700 x 900: headline, quote, photo of the crater */
export const drawPaper = (p: Pen) => {
  const g = p.g;
  p.poly([[20, 20], [680, 20], [680, 880], [20, 880]], "#f6f0de", 8);
  g.fillStyle = INK; g.textAlign = "center";
  g.font = "bold 46px Georgia, serif"; g.fillText("DIE KÜSTENZEITUNG", 350, 90);
  p.stroke([[50, 115], [650, 115]], 5);
  g.font = "bold 70px Georgia, serif"; g.fillText("„Es lief genau", 350, 210); g.fillText("richtig.“", 350, 290);
  p.poly([[70, 330], [630, 330], [630, 640], [70, 640]], "#c9c3b0", 5);
  p.poly(blob(350, 560, 200, 50, 4), "#8f8a7a", 0); p.ell(350, 540, 120, 40, "#5a5650", 0);
  for (let i = 0; i < 9; i++) p.stroke([[70, 680 + i * 22], [i % 3 === 2 ? 420 : 630, 680 + i * 22]], 7, "#9a9488");
};

/** chalk diagram on the board. kind "plan": whale -> dynamite -> small bits -> gulls; "truth": whale -> big chunks with speed lines */
export const drawChalk = (kind: "plan" | "truth", u: number) => (p: Pen) => {
  const C = "rgba(245,245,235,0.92)", w = 9, g = p.g;
  const step = (i: number) => u * 4 >= i;
  g.lineCap = "round";
  // whale outline
  const wh: P2[] = [[60, 260], [60, 180], [120, 140], [280, 140], [380, 190], [420, 240], [470, 200], [480, 280], [420, 260], [300, 290], [80, 290]];
  p.stroke([...wh, wh[0]], w, C); p.stroke([[110, 200], [130, 220]], 6, C); p.stroke([[130, 200], [110, 220]], 6, C);
  if (step(1)) { p.stroke([[520, 220], [640, 220]], w, C); p.stroke([[610, 195], [645, 220], [610, 245]], w, C); }
  if (kind === "plan") {
    if (step(2)) for (let i = 0; i < 14; i++) { const x = 690 + 220 * hash(i, 1), y = 150 + 150 * hash(i, 2); p.stroke([[x, y], [x + 12, y + 8]], 10, C); }
    if (step(3)) { p.stroke([[700, 380], [760, 450]], w, C); p.stroke([[750, 440], [760, 455], [742, 452]], w, C); }
    if (step(4)) for (let i = 0; i < 3; i++) { const x = 640 + i * 110, y = 520; p.stroke([[x - 40, y - 20], [x, y], [x + 40, y - 20]], w, C); p.stroke([[x, y], [x + 10, y + 26]], 6, C); }
    if (step(4)) { g.fillStyle = C; g.font = "bold 60px Arial, sans-serif"; g.textAlign = "left"; g.fillText("lecker!", 620, 640); }
  } else {
    if (step(2)) for (let i = 0; i < 4; i++) {
      const x = 700 + 60 * (i % 2), y = 120 + i * 120, r = 40 + 14 * (i % 2);
      p.stroke([...blob(x, y, r, r * 0.8, i + 2, 10, 0.3), blob(x, y, r, r * 0.8, i + 2, 10, 0.3)[0]], w, C);
      if (step(3)) for (let k = 0; k < 3; k++) p.stroke([[x - r - 30 - k * 10, y - 16 + k * 16], [x - r - 120 - k * 20, y - 16 + k * 16]], 6, C);
    }
    if (step(4)) { g.fillStyle = C; g.font = "bold 66px Arial, sans-serif"; g.textAlign = "left"; g.fillText("klein? nein.", 80, 500); g.fillText("schnell? ja!", 80, 590); }
  }
};

/** exploded egg inside the microwave window, 700 x 420, t 0..1 */
export const drawEggSplat = (t: number) => (p: Pen) => {
  if (t <= 0) { p.ell(350, 300, 60, 76, "#fbf3e2", 7); return; }
  const e = Math.min(1, t * 2);
  p.poly(blob(350, 230, 330 * e, 190 * e, 3, 22, 0.45), "#fff8ec", 0);
  p.poly(blob(330, 240, 120 * e + 10, 90 * e + 10, 8, 14, 0.4), "#ffcf2e", 5);
  for (let i = 0; i < 12; i++) { const a = hash(i, 3) * Math.PI * 2, d = 160 + 160 * hash(i, 4); p.ell(350 + d * Math.cos(a) * e, 230 + d * 0.6 * Math.sin(a) * e, 14, 10, i % 3 ? "#fff8ec" : "#ffcf2e", 3); }
  for (let i = 0; i < 4; i++) { const x = 140 + i * 140; p.poly([[x, 330], [x + 40, 290], [x + 70, 340]], "#fbf3e2", 5); }
};
