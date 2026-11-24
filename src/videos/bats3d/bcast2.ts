// More of the bat short's cast (our own generic designs, no likeness): the President (only hands, letter and a raised
// brow are seen), the general (olive uniform, cap, big white moustache, medals), the clerk (olive shirt, side parting,
// deadpan), the orange cat, plus small effect drawings (thought bubble, letter, note, stamp, frost, target, map, ...).
import { Pen, Outfit, INK, mix, shade } from "../pigeon/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const ellPts = (cx: number, cy: number, rx: number, ry: number, n = 40): P2[] =>
  Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as P2; });

export const PRES: Outfit = { jacket: "#2f3446", pants: "#2f3446", boots: "#1e1e24", hat: "hair", hair: "#d8d8d8", buttons: "#c9ccd2", build: "stout" };
export const GENERAL: Outfit = { jacket: "#6f6c46", pants: "#5d5a3a", boots: INK, hat: "cap", cap: "#5d5a3a", buttons: "#e8c45a", moustache: "#f2f2f2", belt: "#4a3a22", build: "stout" };
export const CLERK: Outfit = { jacket: "#8a8858", pants: "#5d5a3a", boots: INK, hat: "hair", hair: "#3a2a1e", buttons: "#d9dde0" };

// ---------------- cat ----------------
export type CatLook = "calm" | "wide";
const CAT = "#f0922e", CAT_D = "#c46a1e", CAT_L = "#ffe3c0";
/** sitting orange cat, front view, in the 600 x 1000 space with the paws at y = 975 */
export const drawCat = (p: Pen, o: { look?: CatLook; light?: number; tail?: number }) => {
  const look = o.look ?? "wide", light = o.light ?? rad(-120), tail = o.tail ?? 0, ol = 9;
  p.rot = null;
  // tail curling round the side
  p.band([[420, 960], [500, 900 - 30 * tail], [520, 800 - 40 * tail], [480, 740]], CAT, 34, ol);
  // body (pear) and chest
  const body: P2[] = [[200, 975], [180, 860], [215, 720], [300, 680], [385, 720], [420, 860], [400, 975]];
  p.gradFill(body, CAT, CAT_D, light, 0.25); p.poly(body, null, ol);
  p.ell(300, 830, 62, 110, CAT_L, 0);
  for (const s of [-1, 1]) p.ell(300 + s * 52, 960, 40, 22, CAT_L, 7);
  // head with ears
  for (const s of [-1, 1]) {
    p.poly([[300 + s * 70, 520], [300 + s * 120, 400], [300 + s * 130, 560]], CAT, ol);
    p.poly([[300 + s * 86, 520], [300 + s * 116, 440], [300 + s * 118, 540]], "#f7b0b8", 0);
  }
  const head = ellPts(300, 580, 150, 118, 48);
  p.gradFill(head, CAT, CAT_D, light, 0.25); p.poly(head, null, ol);
  for (const s of [-1, 1]) p.stroke([[300 + s * 40, 470], [300 + s * 30, 510]], 10, CAT_D);
  // eyes
  for (const s of [-1, 1]) {
    const ex = 300 + s * 58, ey = 570;
    if (look === "wide") { p.ell(ex, ey, 40, 46, "#fff3a0", 6); p.ell(ex, ey + 2, 10, 32, INK, 0); p.ell(ex - 10, ey - 14, 8, 8, "#ffffff", 0); }
    else { p.ell(ex, ey, 34, 30, "#b8e070", 6); p.ell(ex, ey, 8, 24, INK, 0); }
  }
  // nose, mouth, whiskers
  p.poly([[288, 620], [312, 620], [300, 634]], "#e86a7a", 4);
  p.arc(288, 640, 14, 10, 10, 170, 5); p.arc(312, 640, 14, 10, 10, 170, 5);
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) p.stroke([[300 + s * 70, 630 + k * 12], [300 + s * 180, 610 + k * 26]], 4);
};
/** two eyes glowing out of the dark under the bed, on a 256 x 128 canvas */
export const fxEyes = (p: Pen) => {
  const g = p.g;
  for (const x of [80, 176]) {
    const gr = g.createRadialGradient(x, 64, 0, x, 64, 54);
    gr.addColorStop(0, "rgba(255,250,170,1)"); gr.addColorStop(0.35, "rgba(255,220,90,0.9)"); gr.addColorStop(1, "rgba(255,200,60,0)");
    g.fillStyle = gr; g.fillRect(x - 60, 0, 120, 128);
    p.ell(x, 64, 7, 22, INK, 0);
  }
};

// ---------------- paper things ----------------
const paper = (p: Pen, w: number, h: number, col = "#fbf6e8") => p.poly([[10, 10], [w - 10, 10], [w - 10, h - 10], [10, h - 10]], col, 6);
const write = (p: Pen, text: string, x: number, y: number, px: number, col = "#1e2a50", font = "Georgia, serif", italic = true) => {
  const g = p.g; g.fillStyle = col; g.font = `${italic ? "italic " : ""}bold ${px}px ${font}`; g.fillText(text, x, y);
};
/** Lytle's letter: a big tooth on the letterhead, scribble lines, the signature; 360 x 480 */
export const fxLetter = (p: Pen) => {
  paper(p, 360, 480);
  const t: P2[] = [[150, 40], [210, 40], [222, 70], [212, 120], [196, 96], [180, 120], [164, 96], [148, 120], [138, 70]];
  p.poly(t, "#ffffff", 5);
  for (let i = 0; i < 9; i++) p.stroke([[40, 170 + i * 28], [320 - (i % 3) * 40, 170 + i * 28]], 4, "#9aa3b8");
  write(p, "Lytle, Zahnarzt", 120, 440, 26);
};
/** the President's hands holding a sheet up (seen from the desk side), 520 x 300: two thumbs over the bottom corners */
export const fxHands = (p: Pen) => {
  for (const s of [-1, 1]) {
    const x = 260 + s * 200;
    p.poly([[x - 50, 300], [x - 46, 190], [x - 10, 150], [x + 30, 170], [x + 50, 300]], "#2f3446", 8);
    p.ell(x, 150, 46, 40, "#f2d0b0", 8);
    p.ell(x - s * 30, 120, 16, 30, "#f2d0b0", 7);
  }
};
/** the forwarding note being written; k = share of the words written (0..1); 420 x 260 */
export const fxNote = (k: number) => (p: Pen) => {
  paper(p, 420, 260, "#fff9d8");
  const words = ["Dieser", "Mann", "ist", "kein", "Spinner."], n = Math.round(k * words.length);
  write(p, words.slice(0, Math.min(3, n)).join(" "), 30, 100, 40);
  if (n > 3) write(p, words.slice(3, n).join(" "), 30, 160, 40);
};
/** red rubber stamp "GEPRÜFT", 300 x 140 */
export const fxStamp = (p: Pen) => {
  p.g.save(); p.g.translate(150, 70); p.g.rotate(rad(-8)); p.g.translate(-150, -70);
  p.poly([[16, 16], [284, 16], [284, 124], [16, 124]], null, 10);
  p.g.strokeStyle = "#c8323a"; p.g.lineWidth = 10; p.g.strokeRect(16, 16, 268, 108);
  write(p, "GEPRÜFT", 40, 92, 52, "#c8323a", "Arial Black, Arial, sans-serif", false);
  p.g.restore();
};
/** a framed sheet on the wall: kind "note" (the President's note) or "diploma"; 320 x 400 */
export const fxFrame = (kind: "note" | "diploma") => (p: Pen) => {
  p.poly([[0, 0], [320, 0], [320, 400], [0, 400]], kind === "note" ? "#b07a3a" : "#3a2a22", 8);
  p.poly([[30, 30], [290, 30], [290, 370], [30, 370]], kind === "note" ? "#fff9d8" : "#f6f0de", 5);
  if (kind === "note") {
    write(p, "Dieser Mann", 50, 170, 36); write(p, "ist kein", 50, 220, 36); write(p, "Spinner.", 50, 270, 36);
    p.g.save(); p.g.translate(200, 330); p.g.rotate(rad(-10));
    p.g.strokeStyle = "#c8323a"; p.g.lineWidth = 5; p.g.strokeRect(-70, -24, 140, 44);
    write(p, "GEPRÜFT", -60, 10, 26, "#c8323a", "Arial Black, Arial, sans-serif", false); p.g.restore();
  } else {
    write(p, "DIPLOM", 90, 110, 44, "#3a2a22", "Georgia, serif", false);
    for (let i = 0; i < 5; i++) p.stroke([[70, 160 + i * 30], [250, 160 + i * 30]], 4, "#b8ae98");
    p.ell(160, 320, 30, 30, "#d8a33a", 5);
  }
};
/** the report in the typewriter; n = characters typed; 520 x 620 */
export const REPORT = "Ein Feuer zerstörte einen großen Teil des Testmaterials.";
export const fxReport = (n: number) => (p: Pen) => {
  paper(p, 520, 620);
  const g = p.g; g.fillStyle = "#222630"; g.font = "bold 30px Courier New, monospace";
  g.fillText("BERICHT  -  15.5.1943", 40, 70);
  for (let i = 0; i < 3; i++) p.stroke([[40, 110 + i * 26], [470 - i * 60, 110 + i * 26]], 3, "#b8bcc8");
  const words = REPORT.slice(0, n).split(" "), lines: string[] = [""];
  for (const w of words) { if ((lines[lines.length - 1] + " " + w).length > 22) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); }
  g.font = "bold 36px Courier New, monospace";
  lines.forEach((l, i) => g.fillText(l, 40, 260 + i * 52));
};
/** charred sign "HANGAR 1" lying on the desk; 360 x 140 */
export const fxBurntSign = (p: Pen) => {
  p.poly([[10, 20], [340, 10], [350, 120], [30, 130], [12, 90]], "#d8c8a0", 7);
  write(p, "HANGAR 1", 50, 92, 52, "#3a2a22", "Arial Black, Arial, sans-serif", false);
  const g = p.g, gr = g.createRadialGradient(330, 110, 0, 330, 110, 150);
  gr.addColorStop(0, "rgba(20,14,12,1)"); gr.addColorStop(0.5, "rgba(40,24,16,0.85)"); gr.addColorStop(1, "rgba(40,24,16,0)");
  g.fillStyle = gr; g.fillRect(150, 0, 210, 140);
};
/** thought bubble: a roof with three bats hanging asleep under the eave, "zzz"; 520 x 420 */
export const fxThought = (sleep: (p: Pen, x: number, y: number) => void) => (p: Pen) => {
  for (const [x, y, r] of [[60, 380, 18], [110, 330, 28]] as const) p.ell(x, y, r, r, "#ffffff", 6);
  const cloud: P2[] = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cloud.push([300 + 200 * Math.cos(a) + 14 * Math.sin(5 * a), 170 + 140 * Math.sin(a) + 10 * Math.cos(4 * a)]); }
  p.poly(cloud, "#ffffff", 7);
  p.poly([[150, 170], [300, 70], [450, 170], [420, 180], [300, 104], [180, 180]], "#c8523a", 6);
  p.poly([[190, 180], [410, 180], [410, 280], [190, 280]], "#e8d8b8", 6);
  for (const x of [230, 300, 370]) sleep(p, x, 190);
  write(p, "z z z", 380, 120, 30, "#5a6a9a", "Arial, sans-serif", false);
};
/** frost cracking over the lens; t 0..1; 512 x 512 */
export const fxFrost = (t: number) => (p: Pen) => {
  const g = p.g;
  for (const [cx, cy] of [[0, 0], [512, 0], [0, 512], [512, 512]] as const) {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 300);
    gr.addColorStop(0, "rgba(230,245,255,0.85)"); gr.addColorStop(1, "rgba(230,245,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  }
  if (t > 0) {
    g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 4;
    const arms = 7;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 + 0.3; let x = 256, y = 256;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 1; k <= 4; k++) { x += Math.cos(a + 0.4 * Math.sin(k * 3 + i)) * 60 * t; y += Math.sin(a + 0.4 * Math.cos(k * 2 + i)) * 60 * t; g.lineTo(x, y); }
      g.stroke();
    }
  }
};
/** archery target hung on a nail; 300 x 340 */
export const fxTarget = (p: Pen) => {
  p.stroke([[150, 10], [150, 40]], 6);
  for (let i = 0; i < 5; i++) p.ell(150, 190, 140 - i * 28, 140 - i * 28, i % 2 ? "#ffffff" : "#d8323a", 6);
  write(p, "ZIEL", 104, 330, 36, "#2a2a3a", "Arial Black, Arial, sans-serif", false);
};
/** speed lines; 400 x 200 */
export const fxSpeed = (p: Pen) => { for (let i = 0; i < 7; i++) p.stroke([[20 + (i % 3) * 30, 20 + i * 26], [380 - (i % 2) * 60, 20 + i * 26]], 6, "rgba(255,255,255,0.9)"); };
/** a thermometer, mercury rising to k and bursting at k >= 1; 140 x 440 */
export const fxThermo = (k: number) => (p: Pen) => {
  p.poly([[50, 30], [90, 30], [90, 340], [50, 340]], "#ffffff", 7);
  p.ell(70, 370, 48, 48, "#e0302a", 7);
  p.poly([[60, 360 - 320 * Math.min(1, k)], [80, 360 - 320 * Math.min(1, k)], [80, 360], [60, 360]], "#e0302a", 0);
  for (let i = 0; i < 6; i++) p.stroke([[90, 70 + i * 48], [110, 70 + i * 48]], 4);
  if (k >= 1) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.stroke([[70 + 40 * Math.cos(a), 26 + 40 * Math.sin(a)], [70 + 70 * Math.cos(a), 26 + 70 * Math.sin(a)]], 6, "#ff7a1a"); }
};
/** wooden crate lid with stencil; 420 x 300 */
export const fxCrateLabel = (p: Pen) => {
  p.poly([[0, 0], [420, 0], [420, 300], [0, 300]], "#b98a52", 8);
  for (let i = 1; i < 4; i++) p.stroke([[0, i * 75], [420, i * 75]], 5, shade("#b98a52", 0.7));
  write(p, "GEHEIM", 90, 180, 64, "#2a2a2a", "Arial Black, Arial, sans-serif", false);
};
/** Pacific map, Japan on the left, the USA on the right; dash = share of the dotted line drawn (it stops at the US
 *  coast); 1200 x 800 */
export const fxMap = (dash: number) => (p: Pen) => {
  const g = p.g;
  g.fillStyle = "#e8d8b0"; g.fillRect(0, 0, 1200, 800);
  p.poly([[30, 30], [1170, 30], [1170, 770], [30, 770]], "#7fb6d8", 10);
  for (let i = 0; i < 6; i++) p.stroke([[30, 120 + i * 120], [1170, 120 + i * 120]], 2, "rgba(40,80,120,0.25)");
  for (let i = 0; i < 9; i++) p.stroke([[30 + i * 130, 30], [30 + i * 130, 770]], 2, "rgba(40,80,120,0.25)");
  const land = "#c9b27a";
  p.poly([[860, 60], [1170, 60], [1170, 700], [1020, 690], [960, 560], [900, 470], [880, 360], [840, 250], [850, 140]], land, 8); // USA
  p.poly([[130, 240], [175, 200], [215, 260], [205, 360], [170, 450], [130, 470], [118, 400], [150, 330]], land, 8); // Japan
  p.poly([[60, 60], [150, 60], [120, 180], [60, 220]], land, 8); // mainland edge
  write(p, "USA", 980, 330, 64, "#3a2a1a", "Arial Black, Arial, sans-serif", false);
  write(p, "JAPAN", 60, 560, 54, "#3a2a1a", "Arial Black, Arial, sans-serif", false);
  // dotted route from inland USA westward; it ends right at the coast
  const a: P2 = [1040, 330], b: P2 = [868, 300], n = Math.round(16 * dash);
  for (let i = 0; i < n; i++) { const u = i / 16; p.dot(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 9, "#c8323a"); }
  if (dash >= 1) { p.stroke([[850, 280], [880, 320]], 9, "#c8323a"); p.stroke([[880, 280], [850, 320]], 9, "#c8323a"); }
};
/** tiny victory flag on a stick; 160 x 260 */
export const fxFlag = (p: Pen) => {
  p.stroke([[30, 20], [30, 250]], 8);
  p.poly([[34, 24], [150, 50], [34, 90]], "#ffd23a", 6);
};
export { mix };
