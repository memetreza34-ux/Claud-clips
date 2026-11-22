// Extra drawings for the 2.5D bat short (Pen, own designs): flame, balance scale, crate with lid, smoke puff, ember.
import { Pen } from "../pigeon/toon";

type P2 = [number, number];

/** cartoon flame, 256 x 384 design, phase 0..3 */
export const drawFlame = (ph: number) => (p: Pen) => {
  const sway = [0, 14, -10, 6][ph], h = [300, 340, 280, 320][ph];
  p.poly([[40, 370], [20, 260], [70, 200 - ph * 6], [90, 300], [128 + sway, 380 - h], [170, 280], [196, 180 + ph * 8], [236, 270], [216, 370]], "#ff7a1a", 8);
  p.poly([[80, 370], [70, 300], [128 + sway * 0.6, 380 - h * 0.62], [190, 300], [180, 370]], "#ffd23a", 0);
  p.poly([[110, 370], [104, 330], [128 + sway * 0.3, 380 - h * 0.35], [152, 330], [148, 370]], "#fff3b0", 0);
};
export const drawEmber = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  gr.addColorStop(0, "rgba(255,240,170,1)"); gr.addColorStop(0.4, "rgba(255,170,60,0.8)"); gr.addColorStop(1, "rgba(255,120,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
};
export const drawSmoke = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 10, 128, 128, 124);
  gr.addColorStop(0, "rgba(50,40,50,0.6)"); gr.addColorStop(1, "rgba(50,40,50,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};

/** brass balance scale, 800 x 700 design (base at the bottom); tilt in radians (positive: right pan down) */
export const drawScale = (tilt: number) => (p: Pen) => {
  const cx = 400, top = 170, arm = 300, brass = "#d8b25a", dark = "#a8823a";
  p.poly([[260, 690], [540, 690], [520, 640], [280, 640]], brass, 8);
  p.poly([[388, 640], [412, 640], [408, top], [392, top]], brass, 7);
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const L: P2 = [cx - arm * c, top - arm * s], R: P2 = [cx + arm * c, top + arm * s];
  p.band([L, R], brass, 18, 7);
  p.ell(cx, top, 18, 18, dark, 6);
  for (const e of [L, R]) {
    const py = e[1] + 220;
    p.stroke([e, [e[0] - 90, py]], 4); p.stroke([e, [e[0] + 90, py]], 4);
    p.ell(e[0], py + 8, 110, 24, brass, 7);
  }
};
/** pan positions (design space of drawScale) for placing things on the pans */
export const scalePans = (tilt: number) => {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  return { L: [400 - 300 * c, 170 - 300 * s + 220] as P2, R: [400 + 300 * c, 170 + 300 * s + 220] as P2 };
};

/** wooden crate stencilled GEHEIM, 600 x 520 design; lid 0 (shut) .. 1 (flung open) */
export const drawCrate = (lid: number) => (p: Pen) => {
  const wood = "#b98a52", dark = "#8a6436";
  p.poly([[60, 500], [540, 500], [540, 200], [60, 200]], wood, 9);
  for (let i = 1; i < 4; i++) p.stroke([[60, 200 + i * 75], [540, 200 + i * 75]], 5, dark);
  p.stroke([[60, 200], [540, 500]], 7, dark); p.stroke([[540, 200], [60, 500]], 7, dark);
  p.poly([[150, 300], [450, 300], [450, 400], [150, 400]], "#d9c08a", 0);
  const g = p.g; g.fillStyle = "#2a2a2a"; g.font = "bold 64px Arial Black, Arial, sans-serif"; g.fillText("GEHEIM", 168, 374);
  // lid hinged at the back right edge: swings up and over
  const a = -2.2 * lid;
  p.rot = [a, 540, 200];
  p.poly([[50, 200], [550, 200], [550, 165], [50, 165]], "#c79a5e", 9);
  p.rot = null;
};
