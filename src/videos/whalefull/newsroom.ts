// The small-town newspaper office in the evening, 1970 (shot 18): a mint plaster room with a walnut dado, a window with
// half-lowered venetian blinds onto a painted sunset over the town roofs, warm low light falling in from the left in
// stripes across the desk and the back wall, a cork board of pinned clippings and photos, an olive filing cabinet, a
// coat rack, and the big desk across the foreground (teal typewriter with a typed sheet, green banker lamp, red rotary
// phone, coffee mug with steam, paper stacks, a spike of notes). A reporter (crowd outfit, white head) stands behind it.
// On "Zeitung" the next day's paper flies in and slaps down (3D slab with drawPaper as its top face), from "Es" the
// camera cranes up and over it until the headline fills the top of the frame.
// Room x -4..4, z -3..3; camera looks toward -z.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit } from "../pigeon/build";
import { placeProp } from "../pigeon/props";
import { ctex } from "../pigeon/paint";
import { panelTex, grainTex, plasterTex } from "../pigeon/ptex";
import { NOINK } from "../pigeon/ink";
import { Pen, FrontOpts, bodyFront } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, roomShell, personAt, card, flatCard, ease, q, blinkAt, LEAD, clamp01, contact } from "./room";
import { crowd, drawPaper } from "../whale/draw";
import { A, beat } from "./shots";

const S18 = A(18), ZEIT = beat(18, "Zeitung"), ES = beat(18, "Es"), RICHTIG = beat(18, "richtig");

// ---------------- layout ----------------
const DESK_Y = 0.76, DX0 = -0.95, DX1 = 0.95, DZ0 = -1.5, DZ1 = -0.62;
/** where the paper lands (centre of the slab) and its size (700 x 900 drawing) */
const PX = 0.0, PZ = -1.0, PW = 0.5, PD = PW * (900 / 700), PT = 0.008, PYAW = 0.05;
/** the reporter behind the desk */
const RX = 0.36, RZ = -1.95;

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  18: {
    keys: [
      // on the desk from above: typewriter, lamp and mug, the seated reporter and the sunset window behind
      { f: S18, pos: [0.2, 1.86, 1.55], look: [0.04, 0.8, -1.0], fov: 48 },
      // a slow glide in that settles as the paper slaps down on "Zeitung"
      { f: S18 + 4, dur: ZEIT - S18 - 2, pos: [0.14, 1.85, 1.2], look: [0.03, 0.8, -1.0], fov: 48 },
      // from "Es": crane up and over the paper, headline in the upper part of the frame
      { f: ES - 4, dur: 14, pos: [0.0, 1.84, -0.28], look: [0.0, DESK_Y, -0.93], fov: 40 },
    ],
    creep: 0.0008, kicks: [ZEIT], punch: [RICHTIG], cInf: [5, 5, 4],
  },
};
export const newsroomCam = camOf(CAMS);
export const newsroomDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const linoTex = () => ctex("wfnLino", 512, 512, (g, r) => {
  const n = 8, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = (i + j) % 2 === 0, l = 0.92 + r() * 0.12;
    g.fillStyle = a ? `rgb(${92 * l},${128 * l},${104 * l})` : `rgb(${214 * l},${202 * l},${168 * l})`;
    g.fillRect(i * s, j * s, s, s);
  }
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,50,40,0.12)" : "rgba(255,250,230,0.12)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2); }
  g.strokeStyle = "rgba(70,60,50,0.25)"; g.lineWidth = 2;
  for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, k * s); g.lineTo(512, k * s); g.stroke(); }
});
const ceilTex = () => ctex("wfnCeil", 256, 256, (g, r) => {
  g.fillStyle = "#eee6d6"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(120,110,100,0.3)"; for (let i = 0; i < 500; i++) g.fillRect(r() * 256, r() * 256, 2, 2);
  g.strokeStyle = "#a99c8a"; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256);
});
/** the view out of the window: violet-to-orange sunset, a low sun, pink cloud streaks, the town's roofs, a water tower,
 *  a church spire and telephone wires as violet silhouettes with lit windows */
const sunsetTex = () => ctex("wfnSunset", 640, 640, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 640);
  gr.addColorStop(0, "#5d4a9a"); gr.addColorStop(0.3, "#c2588a"); gr.addColorStop(0.55, "#ff8a4a"); gr.addColorStop(0.72, "#ffc56e"); gr.addColorStop(1, "#ffd99a");
  g.fillStyle = gr; g.fillRect(0, 0, 640, 640);
  const sg = g.createRadialGradient(220, 440, 0, 220, 440, 260); sg.addColorStop(0, "rgba(255,246,200,0.95)"); sg.addColorStop(0.25, "rgba(255,220,140,0.55)"); sg.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = sg; g.fillRect(0, 0, 640, 640);
  for (let i = 0; i < 9; i++) {
    const y = 90 + i * 38 + r() * 20, x = r() * 640;
    g.fillStyle = i < 4 ? "rgba(255,150,170,0.55)" : "rgba(255,190,120,0.55)";
    g.beginPath(); g.ellipse(x, y, 90 + r() * 140, 7 + r() * 8, 0, 0, 7); g.fill();
  }
  // far hills, then the roofs
  g.fillStyle = "#b8607a"; g.beginPath(); g.moveTo(0, 500); for (let x = 0; x <= 640; x += 40) g.lineTo(x, 480 + 18 * Math.sin(x / 90) + r() * 8); g.lineTo(640, 640); g.lineTo(0, 640); g.fill();
  g.fillStyle = "#6e3f78";
  let x = -10;
  while (x < 650) {
    const w = 50 + r() * 70, h = 40 + r() * 60, y = 560 - h;
    g.fillRect(x, y, w, 640 - y);
    g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + w / 2, y - 26 - r() * 20); g.lineTo(x + w + 6, y); g.fill();
    g.fillStyle = "#ffd36a"; for (let k = 0; k < 3; k++) if (r() < 0.6) g.fillRect(x + 8 + k * 16, y + 14 + r() * 20, 8, 10);
    g.fillStyle = "#6e3f78"; x += w + 4;
  }
  // water tower and church spire
  g.fillRect(470, 360, 6, 140); g.fillRect(520, 360, 6, 140); g.beginPath(); g.ellipse(498, 350, 46, 30, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(452, 345); g.lineTo(498, 306); g.lineTo(544, 345); g.fill();
  g.beginPath(); g.moveTo(90, 470); g.lineTo(108, 340); g.lineTo(126, 470); g.fill(); g.fillRect(84, 470, 48, 60);
  // telephone poles and sagging wires
  g.fillRect(330, 380, 6, 180); g.fillRect(310, 392, 46, 5); g.fillRect(600, 400, 6, 160); g.fillRect(580, 410, 46, 5);
  g.strokeStyle = "#6e3f78"; g.lineWidth = 2;
  for (const dy of [0, 8]) { g.beginPath(); g.moveTo(0, 400 + dy); g.quadraticCurveTo(160, 440 + dy, 333, 394 + dy); g.quadraticCurveTo(470, 440 + dy, 603, 412 + dy); g.lineTo(640, 420 + dy); g.stroke(); }
});
/** cork with pinned clippings, photos (generic little scenes), index cards and red yarn */
const corkTex = () => ctex("wfnCork", 1024, 880, (g, r) => {
  g.fillStyle = "#c78d55"; g.fillRect(0, 0, 1024, 880);
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,70,30,0.35)" : "rgba(240,190,130,0.32)"; g.fillRect(r() * 1024, r() * 880, 2 + r() * 4, 2 + r() * 3); }
  const INKC = "#3a2e3e";
  const clip = (x: number, y: number, w: number, h: number, rot: number, photo: boolean) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = "rgba(60,40,30,0.25)"; g.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    g.fillStyle = "#f1e8cf"; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = INKC; g.fillRect(-w / 2 + 12, -h / 2 + 14, w - 24, 16); g.fillRect(-w / 2 + 12, -h / 2 + 36, (w - 24) * 0.7, 12);
    let y0 = -h / 2 + 62;
    const ph = -h / 2 + 62 + h * 0.32;
    if (photo) { g.fillStyle = "#9a958a"; g.fillRect(-w / 2 + 12, y0, w * 0.45, h * 0.32); g.fillStyle = "#6a665e"; g.beginPath(); g.ellipse(-w / 2 + 12 + w * 0.22, y0 + h * 0.2, w * 0.14, h * 0.06, 0, 0, 7); g.fill(); }
    g.fillStyle = "rgba(60,50,60,0.55)";
    for (; y0 < h / 2 - 14; y0 += 11) {
      const beside = photo && y0 < ph;
      g.fillRect(beside ? -w / 2 + 20 + w * 0.45 : -w / 2 + 12, y0, (beside ? w * 0.45 - 30 : w - 24) * (0.75 + 0.25 * r()), 5);
    }
    g.strokeStyle = "rgba(70,50,40,0.6)"; g.lineWidth = 2; g.strokeRect(-w / 2, -h / 2, w, h);
    g.restore();
  };
  const polaroid = (x: number, y: number, rot: number, scene: (w: number) => void) => {
    const w = 170;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = "rgba(60,40,30,0.28)"; g.fillRect(-w / 2 + 6, -w / 2 + 8, w, w * 1.18);
    g.fillStyle = "#fbf7ec"; g.fillRect(-w / 2, -w / 2, w, w * 1.18);
    g.save(); g.beginPath(); g.rect(-w / 2 + 12, -w / 2 + 12, w - 24, w - 24); g.clip(); g.translate(-w / 2 + 12, -w / 2 + 12); scene(w - 24); g.restore();
    g.strokeStyle = "rgba(70,50,40,0.7)"; g.lineWidth = 3; g.strokeRect(-w / 2, -w / 2, w, w * 1.18);
    g.restore();
  };
  // beach with a stranded whale
  const beachPic = (w: number) => {
    g.fillStyle = "#8fc3e6"; g.fillRect(0, 0, w, w); g.fillStyle = "#4f8fb8"; g.fillRect(0, w * 0.42, w, w * 0.16); g.fillStyle = "#e6cf98"; g.fillRect(0, w * 0.56, w, w);
    g.fillStyle = "#6d7c8c"; g.beginPath(); g.ellipse(w * 0.5, w * 0.66, w * 0.34, w * 0.1, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(w * 0.15, w * 0.66); g.lineTo(w * 0.04, w * 0.56); g.lineTo(w * 0.08, w * 0.7); g.fill();
  };
  // lighthouse on the headland
  const lightPic = (w: number) => {
    g.fillStyle = "#f2b27a"; g.fillRect(0, 0, w, w); g.fillStyle = "#5f8f5a"; g.beginPath(); g.moveTo(0, w * 0.75); g.lineTo(w, w * 0.6); g.lineTo(w, w); g.lineTo(0, w); g.fill();
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? "#fbf4e4" : "#d63a2c"; g.fillRect(w * 0.42, w * (0.25 + k * 0.1), w * 0.16, w * 0.1); }
    g.fillStyle = "#3a3048"; g.fillRect(w * 0.4, w * 0.18, w * 0.2, w * 0.07); g.fillStyle = "#ffe066"; g.fillRect(w * 0.44, w * 0.12, w * 0.12, w * 0.07);
  };
  // a car in front of a shop
  const carPic = (w: number) => {
    g.fillStyle = "#d9e6ef"; g.fillRect(0, 0, w, w); g.fillStyle = "#c89a6a"; g.fillRect(0, w * 0.1, w, w * 0.45); g.fillStyle = "#8a7a6a"; g.fillRect(0, w * 0.72, w, w);
    g.fillStyle = "#3f8f6a"; g.beginPath(); g.moveTo(w * 0.1, w * 0.72); g.lineTo(w * 0.15, w * 0.56); g.lineTo(w * 0.32, w * 0.54); g.lineTo(w * 0.42, w * 0.42); g.lineTo(w * 0.7, w * 0.42); g.lineTo(w * 0.8, w * 0.55); g.lineTo(w * 0.92, w * 0.58); g.lineTo(w * 0.92, w * 0.72); g.fill();
    g.fillStyle = "#2f2a36"; for (const cx of [0.28, 0.76]) { g.beginPath(); g.arc(w * cx, w * 0.74, w * 0.07, 0, 7); g.fill(); }
  };
  // a gull on a post
  const gullPic = (w: number) => {
    g.fillStyle = "#a8d0ea"; g.fillRect(0, 0, w, w); g.fillStyle = "#7a5a3a"; g.fillRect(w * 0.44, w * 0.6, w * 0.12, w * 0.4);
    g.fillStyle = "#fbfbf6"; g.beginPath(); g.ellipse(w * 0.5, w * 0.5, w * 0.18, w * 0.11, 0, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.64, w * 0.38, w * 0.07, 0, 7); g.fill();
    g.fillStyle = "#8a96a6"; g.beginPath(); g.ellipse(w * 0.44, w * 0.47, w * 0.15, w * 0.06, -0.2, 0, 7); g.fill();
    g.fillStyle = "#f2b234"; g.beginPath(); g.moveTo(w * 0.7, w * 0.38); g.lineTo(w * 0.82, w * 0.4); g.lineTo(w * 0.7, w * 0.42); g.fill();
  };
  clip(150, 150, 220, 260, -0.05, true);
  polaroid(420, 160, 0.06, beachPic);
  clip(690, 170, 250, 200, 0.03, false);
  polaroid(910, 210, -0.08, gullPic);
  polaroid(140, 520, 0.07, lightPic);
  clip(400, 500, 260, 300, -0.02, true);
  polaroid(690, 520, -0.04, carPic);
  clip(900, 600, 200, 280, 0.05, false);
  // yellow index cards
  for (const [cx, cy, rt] of [[260, 770, -0.06], [560, 800, 0.04], [800, 820, -0.03]] as const) {
    g.save(); g.translate(cx, cy); g.rotate(rt); g.fillStyle = "#f7e27a"; g.fillRect(-90, -50, 180, 100);
    g.fillStyle = "rgba(60,50,60,0.55)"; for (let k = 0; k < 4; k++) g.fillRect(-76, -32 + k * 18, 120 + r() * 30, 5); g.restore();
  }
  // red yarn between pins
  const pins: [number, number][] = [[150, 30], [420, 60], [910, 110], [400, 360], [690, 420], [140, 420]];
  g.strokeStyle = "#d02a24"; g.lineWidth = 4;
  for (const [a, b] of [[0, 3], [1, 4], [2, 4], [5, 3]]) { g.beginPath(); g.moveTo(pins[a][0], pins[a][1]); g.lineTo(pins[b][0], pins[b][1]); g.stroke(); }
  for (const [px, py] of pins) { g.fillStyle = "#e0352c"; g.beginPath(); g.arc(px, py, 11, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(px - 3, py - 3, 4, 0, 7); g.fill(); }
});
/** wall calendar: NOVEMBER 1970 with a red circle on the 12th */
const calTex = () => ctex("wfnCal", 256, 340, (g) => {
  g.fillStyle = "#f6f0de"; g.fillRect(0, 0, 256, 340);
  g.fillStyle = "#d9a441"; g.fillRect(0, 0, 256, 120);
  g.fillStyle = "#b04a2c"; g.beginPath(); g.arc(128, 70, 40, 0, 7); g.fill();
  g.fillStyle = "#c2412c"; g.fillRect(0, 120, 256, 40);
  g.fillStyle = "#fbf4e4"; g.font = "bold 26px Arial, sans-serif"; g.textAlign = "center"; g.fillText("NOVEMBER 1970", 128, 149);
  g.fillStyle = "#3a2e3e"; g.font = "bold 18px Arial, sans-serif";
  for (let d = 1; d <= 30; d++) { const c = (d + 6) % 7, rw = Math.floor((d + 6) / 7); g.fillText(String(d), 22 + c * 35, 188 + rw * 30); }
  g.strokeStyle = "#d02a24"; g.lineWidth = 4; g.beginPath(); g.arc(22 + ((12 + 6) % 7) * 35, 182 + Math.floor(18 / 7) * 30, 15, 0, 7); g.stroke();
});
const clockTex = () => ctex("wfnClock", 256, 256, (g) => {
  g.fillStyle = "#fbf6e8"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = "#2a2230";
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.save(); g.translate(128 + 100 * Math.sin(a), 128 - 100 * Math.cos(a)); g.rotate(a); g.fillRect(-4, -12, 8, k % 3 ? 14 : 24); g.restore(); }
});
const dialTex = () => ctex("wfnDial", 256, 256, (g) => {
  g.fillStyle = "#efe6d0"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#3a3a2e";
  for (let k = 0; k < 10; k++) { const a = -0.6 + (k / 10) * Math.PI * 1.6; g.beginPath(); g.arc(128 + 86 * Math.cos(a), 128 + 86 * Math.sin(a), 18, 0, 7); g.fill(); }
  g.fillStyle = "#fbf8f0"; g.beginPath(); g.arc(128, 128, 44, 0, 7); g.fill();
});
/** the sheet in the typewriter: a few typed lines */
const sheetTex = () => ctex("wfnSheet", 256, 300, (g, r) => {
  g.fillStyle = "#fbf7ea"; g.fillRect(0, 0, 256, 300);
  g.fillStyle = "rgba(50,40,60,0.7)"; for (let y = 40; y < 280; y += 20) g.fillRect(26, y, 140 + r() * 80, 5);
});
/** the next day's paper, front page up */
const paperTex = () => ctex("wfnPaper", 700, 900, (g) => drawPaper(new Pen(g)));
/** sun through venetian blinds: soft warm bands on transparency with soft ends */
const stripeTex = () => ctex("wfnStripes", 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const y = 30 + i * (452 / n), h = (452 / n) * 0.55;
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.2, "rgba(255,255,255,1)"); gr.addColorStop(0.8, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(20, y, 472, h);
  }
  g.globalCompositeOperation = "destination-in";
  const m = g.createLinearGradient(0, 0, 512, 0); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(0.12, "rgba(0,0,0,1)"); m.addColorStop(0.88, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = m; g.fillRect(0, 0, 512, 512); g.globalCompositeOperation = "source-over";
});
const glowTex = () => ctex("wfnGlow", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// ---------------- effect drawings ----------------
/** an older paper lying on a stack, 300 x 380 */
const drawOldPaper = (seed: number) => (p: Pen) => {
  const g = p.g;
  p.poly([[14, 14], [286, 10], [290, 368], [10, 372]], "#efe6cc", 5);
  g.fillStyle = "#3a2e3e"; g.fillRect(36, 34, 228, 22);
  p.stroke([[30, 68], [270, 68]], 3);
  g.fillStyle = "#3a2e3e"; g.fillRect(36, 84, 200 - (seed % 3) * 30, 16); g.fillRect(36, 108, 150, 16);
  g.fillStyle = "#b9b2a0"; g.fillRect(36, 140, seed % 2 ? 228 : 120, 110);
  g.fillStyle = "rgba(60,50,60,0.5)"; for (let y = 266; y < 350; y += 12) g.fillRect(36, y, 228 - ((y + seed * 7) % 5) * 12, 5);
  if (seed % 2 === 0) for (let y = 146; y < 250; y += 12) g.fillRect(170, y, 94, 5);
};
const steam = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(64, 64, 0, 64, 64, 60);
  gr.addColorStop(0, "rgba(255,250,240,0.2)"); gr.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};
/** cartoon impact lines around the slap, 600 x 300 */
const drawSlap = (p: Pen) => {
  for (const [x0, y0, x1, y1] of [[110, 210, 20, 250], [120, 150, 30, 120], [200, 90, 160, 20], [400, 90, 440, 20], [480, 150, 570, 120], [490, 210, 580, 250]] as const)
    p.stroke([[x0, y0], [x1, y1]], 11);
};
/** small opaque inked dust puff, 160 x 120 */
const drawPuff = (k: number) => (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 1 + 0.14 * Math.sin(i * 2.7 + k); pts.push([80 + 62 * r * Math.cos(a), 64 + 42 * r * Math.sin(a)]); }
  p.poly(pts, "#f3e6c8", 7);
  p.ell(66, 52, 18, 10, "#fffaf0", 0);
};

// ---------------- the room ----------------
const M4 = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(1, 1, 1));

export class NewsroomWorld extends RoomWorld {
  private paper: THREE.Mesh;
  private glows: THREE.Mesh[] = [];
  private hands: THREE.Mesh[] = [];

  constructor(kit: Kit) {
    super(newsroomCam);
    // key: the golden preset's colours, but low from screen left and a little from the camera side (through a window in
    // the left wall, out of frame), so the desk, the paper and the reporter catch the warm light instead of the
    // default backlight (RoomWorld keeps the per-shot sun in a private cache; we seed it for shot 18)
    const c0 = newsroomCam(18, S18), fw = V(c0.look[0] - c0.pos[0], 0, c0.look[2] - c0.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
    const az = (-118 * Math.PI) / 180, el = (24 * Math.PI) / 180;
    const sun = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
    (this as unknown as { sunCache: Map<number, THREE.Vector3> }).sunCache.set(18, sun);

    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    const M = {
      floor: lam("wfnFloor", () => ({ map: linoTex() })),
      low: lam("wfnLow", () => ({ map: panelTex("#7a4a2c") })),
      wall: lam("wfnWall", () => ({ map: plasterTex("#a3c4a0") })),
      rail: lam("wfnRail", () => ({ color: "#4a2c1a" })),
      ceil: lam("wfnCeil", () => ({ map: ceilTex() })),
      desk: lam("wfnDesk", () => ({ map: grainTex("#8a5432") })),
      deskD: lam("wfnDeskD", () => ({ map: grainTex("#6b3f24") })),
      brass: lam("wfnBrass", () => ({ color: "#d4a84a" })),
      blotter: lam("wfnBlotter", () => ({ color: "#3d6b52" })),
      cab: lam("wfnCab", () => ({ color: "#7d8a52" })),
      cabD: lam("wfnCabD", () => ({ color: "#5f6b3c" })),
      label: lam("wfnLabel", () => ({ color: "#f1ead6" })),
      cork: lam("wfnCorkM", () => ({ map: corkTex() })),
      frame: lam("wfnFrame", () => ({ color: "#5a3620" })),
      sash: lam("wfnSash", () => ({ color: "#ece4d0" })),
      blind: lam("wfnBlind", () => ({ color: "#f2e6c6" })),
      tw: lam("wfnTw", () => ({ color: "#3f8f8c" })),
      twD: lam("wfnTwD", () => ({ color: "#2c6a68" })),
      key: lam("wfnKey", () => ({ color: "#efe6cf" })),
      keyD: lam("wfnKeyD", () => ({ color: "#3a3440" })),
      roll: lam("wfnRoll", () => ({ color: "#3a3440" })),
      chrome: lam("wfnChrome", () => ({ color: "#c9ccd4" })),
      sheet: lam("wfnSheetM", () => ({ map: sheetTex(), side: THREE.DoubleSide })),
      shade: lam("wfnShade", () => ({ color: "#2f9a5a" })),
      phone: lam("wfnPhone", () => ({ color: "#d0402e" })),
      phoneD: lam("wfnPhoneD", () => ({ color: "#9a2c22" })),
      dial: lam("wfnDialM", () => ({ map: dialTex() })),
      mug: lam("wfnMug", () => ({ color: "#f4efe2" })),
      mugB: lam("wfnMugB", () => ({ color: "#2f6fa0" })),
      coffee: lam("wfnCoffee", () => ({ color: "#4a2a18" })),
      newsp: lam("wfnNewsp", () => ({ color: "#ebe2c8" })),
      newsp2: lam("wfnNewsp2", () => ({ color: "#ddd2b4" })),
      twine: lam("wfnTwine", () => ({ color: "#b8864a" })),
      pencil: lam("wfnPencil", () => ({ color: "#f2c23a" })),
      cup: lam("wfnCup", () => ({ color: "#c8503a" })),
      clockR: lam("wfnClockR", () => ({ color: "#3a3040" })),
      cal: lam("wfnCalM", () => ({ map: calTex() })),
      paperTop: lam("wfnPaperTop", () => ({ map: paperTex() })),
      paperSide: lam("wfnPaperSide", () => ({ color: "#efe8d4" })),
    };
    // window hole in the back wall, left of the reporter
    const WX0 = -1.05, WX1 = -0.05, WY0 = 1.18, WY1 = 2.6;
    roomShell(walls, things, { floor: M.floor, low: M.low, wall: M.wall, rail: M.rail, ceil: M.ceil }, [[WX0, WX1, WY0, WY1]], [3, 2.2]);

    // ---- window: frame, sill, mullion, venetian blind half down with the slats tilted open, the sunset outside ----
    for (const [a, b] of [[V(WX0 - 0.07, WY0 - 0.08, -3.08), V(WX1 + 0.07, WY0, -2.84)], [V(WX0 - 0.07, WY1, -3.06), V(WX1 + 0.07, WY1 + 0.08, -2.94)],
      [V(WX0 - 0.07, WY0, -3.06), V(WX0, WY1, -2.94)], [V(WX1, WY0, -3.06), V(WX1 + 0.07, WY1, -2.94)],
      [V((WX0 + WX1) / 2 - 0.025, WY0, -3.04), V((WX0 + WX1) / 2 + 0.025, WY1, -2.99)], [V(WX0, 1.86, -3.04), V(WX1, 1.9, -2.99)]] as const) things.add(boxGeo(a, b), M.sash);
    things.add(boxGeo(V(WX0 - 0.02, WY1 - 0.07, -2.97), V(WX1 + 0.02, WY1 - 0.01, -2.88)), M.blind); // head rail
    const slat = new THREE.BoxGeometry(WX1 - WX0 - 0.02, 0.004, 0.045);
    const BOT = 1.78; // blind lowered to here
    for (let y = WY1 - 0.1; y > BOT; y -= 0.038) {
      const m = new THREE.Matrix4().makeRotationX(0.75); m.setPosition((WX0 + WX1) / 2, y, -2.93);
      things.add(slat, M.blind, m);
    }
    things.add(boxGeo(V(WX0, BOT - 0.03, -2.95), V(WX1, BOT, -2.9)), M.blind); // bottom rail
    for (const x of [WX0 + 0.18, WX1 - 0.18]) things.add(boxGeo(V(x, BOT, -2.915), V(x + 0.006, WY1 - 0.07, -2.909)), M.frame); // ladder cords
    things.add(boxGeo(V(WX1 - 0.12, 1.42, -2.9), V(WX1 - 0.114, BOT, -2.894)), M.frame); // pull cord
    things.add(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8), M.sash, M4(WX1 - 0.117, 1.41, -2.897));
    const view = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: sunsetTex(), color: new THREE.Color(1.08, 1.0, 0.96) }));
    view.position.set((WX0 + WX1) / 2 + 0.2, 1.75, -3.7); view.layers.set(NOINK); R.add(view);
    const sunDisk = new THREE.Mesh(new THREE.CircleGeometry(0.16, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.85, 1.15) }));
    sunDisk.position.set((WX0 + WX1) / 2 + 0.2 - 1.3 + (220 / 640) * 2.6, 1.75 + 1.3 - (440 / 640) * 2.6, -3.69); sunDisk.layers.set(NOINK); R.add(sunDisk);
    // a pot plant on the sill
    things.add(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 14), M.cup, M4(WX0 + 0.2, WY0 + 0.05, -2.92));

    // ---- light through the blinds: warm stripes on the desk, the back wall and the floor (additive, no ink) ----
    const add = (col: THREE.Color, tex = glowTex()) => new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const stripes = (w: number, h: number, col: THREE.Color, m: THREE.Matrix4) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), add(col, stripeTex()));
      s.applyMatrix4(m); s.layers.set(NOINK); s.renderOrder = 2; R.add(s);
    };
    const warm = new THREE.Color(0.62, 0.4, 0.17);
    const flatAt = (x: number, y: number, z: number, yaw: number) => new THREE.Matrix4().makeRotationY(yaw).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).setPosition(x, y, z);
    // desk: bands parallel to the left wall (along z), slanted a little
    stripes(2.0, 1.0, warm, flatAt(-0.05, DESK_Y + 0.003, -1.06, Math.PI / 2 - 0.25));
    // back wall right of the window: bands sloping down to the right
    stripes(1.7, 1.25, warm.clone().multiplyScalar(0.85), new THREE.Matrix4().makeRotationZ(-0.16).setPosition(0.95, 1.86, -2.985));
    // floor in front of the desk
    stripes(2.4, 1.4, warm.clone().multiplyScalar(0.7), flatAt(-0.4, 0.006, 0.0, Math.PI / 2 - 0.3));

    // ---- cork board with clippings, photos and pins (right of the reporter) ----
    const CX0 = 0.62, CX1 = 1.92, CY0 = 1.36, CY1 = 2.48;
    things.add(boxGeo(V(CX0 - 0.06, CY0 - 0.06, -3.0), V(CX1 + 0.06, CY1 + 0.06, -2.95)), M.frame);
    things.add(boxGeo(V(CX0, CY0, -2.98), V(CX1, CY1, -2.94)), M.cork);
    const pin = new THREE.SphereGeometry(0.016, 10, 8);
    for (const [u, v] of [[0.15, 0.08], [0.41, 0.1], [0.67, 0.12], [0.89, 0.18], [0.14, 0.53], [0.39, 0.5], [0.67, 0.52], [0.88, 0.62]] as const)
      things.add(pin, M.cup, new THREE.Matrix4().makeTranslation(CX0 + u * (CX1 - CX0), CY1 - v * (CY1 - CY0), -2.925));
    // calendar between window and cork board, wall clock above the window
    things.add(boxGeo(V(0.12, 2.08, -2.99), V(0.44, 2.5, -2.975)), M.cal);
    const face = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 32); face.rotateX(Math.PI / 2);
    things.add(face, M.clockR, M4(-0.55, 2.86, -2.97));
    const cf = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), new THREE.MeshBasicMaterial({ map: clockTex(), color: new THREE.Color(0.9, 0.88, 0.85) }));
    cf.position.set(-0.55, 2.86, -2.94); R.add(cf);
    for (const [len, w] of [[0.1, 0.02], [0.14, 0.012]]) {
      const g = new THREE.BoxGeometry(w, len, 0.008); g.translate(0, len / 2 - 0.02, 0);
      const h = new THREE.Mesh(g, M.clockR); h.position.set(-0.55, 2.86, -2.93); R.add(h); this.hands.push(h);
    }

    // ---- filing cabinet under the cork board, tied paper bundles on it and on the floor ----
    {
      const x0 = 0.95, x1 = 1.5, h = 1.3, z0 = -2.95, z1 = -2.35;
      things.add(boxGeo(V(x0, 0, z0), V(x1, h, z1)), M.cab);
      for (let i = 0; i < 4; i++) {
        const y = 0.06 + i * ((h - 0.08) / 4), dh = (h - 0.08) / 4 - 0.03;
        things.add(boxGeo(V(x0 + 0.03, y, z1), V(x1 - 0.03, y + dh, z1 + 0.02)), M.cabD);
        things.add(boxGeo(V(x0 + 0.05, y + 0.02, z1 + 0.02), V(x1 - 0.05, y + dh - 0.02, z1 + 0.025)), M.cab);
        things.add(boxGeo(V((x0 + x1) / 2 - 0.08, y + dh * 0.55, z1 + 0.025), V((x0 + x1) / 2 + 0.08, y + dh * 0.62, z1 + 0.06)), M.brass);
        things.add(boxGeo(V((x0 + x1) / 2 - 0.06, y + dh * 0.72, z1 + 0.025), V((x0 + x1) / 2 + 0.06, y + dh * 0.86, z1 + 0.03)), M.label);
      }
    }
    const bundle = (x: number, y: number, z: number, yaw: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const g = boxGeo(V(-0.2, 0, -0.15), V(0.2, 0.02, 0.15)); g.rotateY(yaw + (((i * 37) % 7) / 7 - 0.5) * 0.08);
        things.add(g, i % 2 ? M.newsp : M.newsp2, M4(x, y + i * 0.02, z));
      }
      for (const dx of [-0.08, 0.08]) { const t = boxGeo(V(dx - 0.008, -0.002, -0.155), V(dx + 0.008, n * 0.02 + 0.003, 0.155)); t.rotateY(yaw); things.add(t, M.twine, M4(x, y, z)); }
    };
    bundle(1.22, 1.3, -2.62, 0.1, 6);
    bundle(-1.6, 0, -2.5, 0.3, 9); bundle(-1.55, 0.18, -2.5, -0.2, 5);
    bundle(1.3, 0, -1.6, 0.5, 8);
    // tied bundles on the floor in front of the desk (fill the bottom left of the frame)
    bundle(-0.52, 0, -0.38, 0.35, 8); bundle(-0.5, 0.16, -0.4, -0.15, 7);

    // ---- the desk across the foreground ----
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
    things.add(boxGeo(V(DX0 + 0.47, DESK_Y - 0.16, DZ1 - 0.1), V(DX1 - 0.47, DESK_Y - 0.05, DZ1 + 0.01)), M.desk);
    things.add(boxGeo(V(-0.06, DESK_Y - 0.12, DZ1 + 0.01), V(0.06, DESK_Y - 0.1, DZ1 + 0.035)), M.brass);
    things.add(boxGeo(V(-0.34, DESK_Y, -1.3), V(0.34, DESK_Y + 0.006, -0.72)), M.blotter);

    // ---- teal typewriter on the left, turned toward the camera ----
    {
      const TW = M4(-0.56, DESK_Y, -1.08, 0.4), put = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) =>
        things.add(g, m, TW.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z)));
      put(boxGeo(V(-0.2, 0, -0.17), V(0.2, 0.04, 0.17)), M.twD);
      // sloped body: profile in (-z, y), extruded across x
      const sh = new THREE.Shape([new THREE.Vector2(-0.17, 0.04), new THREE.Vector2(-0.17, 0.065), new THREE.Vector2(0.02, 0.135), new THREE.Vector2(0.15, 0.14), new THREE.Vector2(0.15, 0.04)]);
      const body = new THREE.ExtrudeGeometry(sh, { depth: 0.38, bevelEnabled: false }); body.rotateY(Math.PI / 2); body.translate(-0.19, 0, 0);
      put(body, M.tw);
      // four rows of round keys on the slope and the space bar
      const kg = new THREE.CylinderGeometry(0.0115, 0.0115, 0.012, 12), kr = new THREE.CylinderGeometry(0.014, 0.014, 0.006, 12);
      for (let row = 0; row < 4; row++) for (let k = 0; k < 10; k++) {
        const z = 0.145 - row * 0.038, y = 0.065 + (0.17 - z) * 0.37 + 0.01, x = -0.15 + k * 0.032 + (row % 2) * 0.012;
        put(kr, M.keyD, x, y - 0.004, z); put(kg, M.key, x, y + 0.002, z);
      }
      put(boxGeo(V(-0.1, 0.07, 0.155), V(0.1, 0.085, 0.175)), M.chrome);
      // carriage: frame, platen roller, knobs, return lever, ribbon spools
      put(boxGeo(V(-0.23, 0.135, -0.14), V(0.23, 0.155, -0.04)), M.tw);
      const roll = new THREE.CylinderGeometry(0.03, 0.03, 0.44, 18); roll.rotateZ(Math.PI / 2); put(roll, M.roll, 0, 0.18, -0.09);
      const knob = new THREE.CylinderGeometry(0.024, 0.024, 0.03, 16); knob.rotateZ(Math.PI / 2);
      put(knob, M.keyD, -0.24, 0.18, -0.09); put(knob, M.keyD, 0.24, 0.18, -0.09);
      put(boxGeo(V(-0.27, 0.2, -0.07), V(-0.25, 0.21, 0.02)), M.chrome); put(boxGeo(V(-0.33, 0.2, 0.0), V(-0.25, 0.21, 0.02)), M.chrome);
      for (const x of [-0.08, 0.08]) put(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), M.keyD, x, 0.142, -0.01);
      put(boxGeo(V(-0.04, 0.14, 0.0), V(0.04, 0.16, 0.03)), M.cup);
      // typed sheet standing out of the platen, leaning back
      const sheet = new THREE.PlaneGeometry(0.21, 0.26); sheet.translate(0, 0.13, 0); sheet.rotateX(-0.22);
      put(sheet, M.sheet, 0, 0.19, -0.11);
    }

    // ---- green banker lamp at the back, a little left of the paper ----
    {
      const LX = -0.36, LZ = -1.36;
      things.add(new THREE.CylinderGeometry(0.075, 0.085, 0.03, 24), M.brass, M4(LX, DESK_Y + 0.015, LZ));
      things.add(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 10), M.brass, M4(LX, DESK_Y + 0.17, LZ));
      things.add(boxGeo(V(LX - 0.01, DESK_Y + 0.3, LZ - 0.01), V(LX + 0.01, DESK_Y + 0.32, LZ + 0.06)), M.brass);
      const shade = new THREE.CylinderGeometry(0.075, 0.075, 0.36, 24, 1, false, -Math.PI / 2, Math.PI); shade.rotateX(-Math.PI / 2); shade.rotateY(Math.PI / 2);
      things.add(shade, M.shade, M4(LX, DESK_Y + 0.33, LZ + 0.06, 0.1));
      for (const sx of [-1, 1]) { const e = new THREE.CircleGeometry(0.075, 20, 0, Math.PI); e.rotateY(sx * Math.PI / 2); e.translate(sx * 0.18, 0, 0); things.add(e, M.brass, M4(LX, DESK_Y + 0.33, LZ + 0.06, 0.1)); }
      things.add(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6), M.brass, M4(LX + 0.05, DESK_Y + 0.25, LZ + 0.06));
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 1.05) }));
      bulb.position.set(LX, DESK_Y + 0.31, LZ + 0.06); bulb.rotation.y = 0.1; bulb.layers.set(NOINK); R.add(bulb);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), add(new THREE.Color(0.5, 0.36, 0.14)));
      pool.rotation.x = -Math.PI / 2; pool.position.set(LX, DESK_Y + 0.004, LZ + 0.15); pool.layers.set(NOINK); R.add(pool);
      const g1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), add(new THREE.Color(0.9, 0.7, 0.35)));
      g1.position.set(LX, DESK_Y + 0.28, LZ + 0.1); g1.layers.set(NOINK); R.add(g1); this.glows.push(g1);
    }

    // ---- red rotary phone at the back right ----
    {
      const PHX = 0.64, PHZ = -1.24;
      things.add(boxGeo(V(PHX - 0.12, DESK_Y, PHZ - 0.1), V(PHX + 0.12, DESK_Y + 0.07, PHZ + 0.1)), M.phone);
      const top = new THREE.CylinderGeometry(0.09, 0.12, 0.05, 4, 1); top.rotateY(Math.PI / 4); top.scale(1.15, 1, 0.95);
      things.add(top, M.phone, M4(PHX, DESK_Y + 0.095, PHZ));
      const dial = new THREE.CylinderGeometry(0.06, 0.06, 0.012, 24); dial.rotateX(0.5);
      things.add(dial, M.dial, M4(PHX, DESK_Y + 0.1, PHZ + 0.07));
      for (const sx of [-1, 1]) things.add(boxGeo(V(PHX + sx * 0.12 - 0.02, DESK_Y + 0.1, PHZ - 0.04), V(PHX + sx * 0.12 + 0.02, DESK_Y + 0.15, PHZ)), M.phoneD);
      things.add(boxGeo(V(PHX - 0.1, DESK_Y + 0.15, PHZ - 0.045), V(PHX + 0.1, DESK_Y + 0.175, PHZ + 0.005)), M.phone);
      for (const sx of [-1, 1]) things.add(new THREE.CylinderGeometry(0.04, 0.035, 0.05, 16), M.phone, M4(PHX + sx * 0.13, DESK_Y + 0.165, PHZ - 0.02));
      for (let i = 0; i < 9; i++) { const t = new THREE.TorusGeometry(0.012, 0.004, 6, 10); t.rotateY(Math.PI / 2); things.add(t, M.phoneD, M4(PHX - 0.14 - i * 0.018, DESK_Y + 0.02, PHZ + 0.05 + i * 0.008)); }
    }

    // ---- coffee mug at the front right (steam in stage()) ----
    things.add(new THREE.CylinderGeometry(0.045, 0.042, 0.11, 20), M.mug, M4(0.56, DESK_Y + 0.055, -0.82));
    things.add(new THREE.CylinderGeometry(0.0465, 0.0465, 0.03, 20), M.mugB, M4(0.56, DESK_Y + 0.07, -0.82));
    const cof = new THREE.CircleGeometry(0.04, 20); cof.rotateX(-Math.PI / 2); things.add(cof, M.coffee, M4(0.56, DESK_Y + 0.1, -0.82));
    const hdl = new THREE.TorusGeometry(0.03, 0.009, 8, 14, Math.PI); hdl.rotateZ(-Math.PI / 2); things.add(hdl, M.mug, M4(0.605, DESK_Y + 0.055, -0.82));

    // ---- paper stacks: a tall one at the back right, a low one at the front left, a spike of notes, pencil cup ----
    const stack = (x: number, z: number, n: number, yaw: number) => {
      for (let i = 0; i < n; i++) {
        const j = ((i * 37) % 7) / 7 - 0.5, g = boxGeo(V(-0.15, 0, -0.19), V(0.15, 0.012, 0.19)); g.rotateY(yaw + j * 0.16);
        things.add(g, i % 3 ? M.newsp : M.newsp2, M4(x + j * 0.02, DESK_Y + i * 0.013, z));
      }
    };
    stack(0.78, -1.32, 16, -0.15); stack(-0.74, -0.78, 5, 0.25); stack(0.36, -1.36, 4, 0.4);
    things.add(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 16), M.keyD, M4(0.3, DESK_Y + 0.006, -0.72));
    things.add(new THREE.CylinderGeometry(0.0025, 0.0025, 0.16, 6), M.chrome, M4(0.3, DESK_Y + 0.08, -0.72));
    for (let i = 0; i < 5; i++) { const g = boxGeo(V(-0.04, 0, -0.03), V(0.04, 0.002, 0.03)); g.rotateY(i * 0.9); things.add(g, M.label, M4(0.3, DESK_Y + 0.02 + i * 0.006, -0.72)); }
    things.add(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 14, 1, true), M.cup, M4(0.9, DESK_Y + 0.045, -0.82));
    for (const [dx, dz, t] of [[-0.01, 0, 0.15], [0.012, 0.01, -0.12], [0, -0.012, 0.05]]) {
      const pg = new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6); pg.rotateZ(t); things.add(pg, M.pencil, M4(0.9 + dx, DESK_Y + 0.11, -0.82 + dz));
    }

    // ---- CC0 furniture: chair behind the reporter, coat rack, plant, bookcase, trash can, radio ----
    const P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("chairDesk", 0.36, 0, -2.65, 1.05, Math.PI + 0.2);
    P("coatRackStanding", 1.9, 0, -2.55, 1.8);
    P("pottedPlant", -1.45, 0, -2.6, 1.25);
    P("bookcaseClosedWide", -2.6, 0, -2.75, 1.9);
    P("trashcan", 0.66, 0, -0.32, 0.36);
    for (const [x, z, r] of [[0.42, -0.2, 0.045], [0.5, 0.02, 0.04], [0.86, -0.12, 0.05], [0.66, -0.32 + 0.0, 0.05]] as const) {
      const ball = new THREE.IcosahedronGeometry(r, 0); things.add(ball, M.newsp, M4(x, z === -0.32 ? 0.36 : r * 0.8, z, x * 7));
    }
    P("radio", 1.25, 1.42, -2.75, 0.2, -0.2);
    P("plantSmall1", 1.05, 1.42, -2.6, 0.24);
    placeProp(walls, glow, kit, "rugRectangle", 0, 0.004, -1.4, { w: 2.6 });

    // ---- the next day's paper: a thin slab, drawPaper on its top face, animated in tick() ----
    const pg = new THREE.BoxGeometry(PW, PT, PD);
    this.paper = new THREE.Mesh(pg, [M.paperSide, M.paperSide, M.paperTop, M.paperSide, M.paperSide, M.paperSide]);
    this.paper.castShadow = true; this.paper.receiveShadow = true; this.paper.visible = false;
    R.add(this.paper);

    walls.build(R, false);
    things.build(R, true);
    glow.build(R, false);
  }

  protected tick(_id: number, f: number) {
    // clock at twenty to seven
    const min = 40 + f / 60;
    this.hands[0].rotation.z = -((6 + min / 60) / 12) * Math.PI * 2;
    this.hands[1].rotation.z = -(min / 60) * Math.PI * 2;
    const s = paperAt(f), P = this.paper;
    P.visible = s.on;
    P.position.set(s.x, s.y, s.z); P.rotation.set(s.rx, s.ry, s.rz, "YXZ");
  }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    for (const m of this.glows) m.quaternion.copy(cam.quaternion);
    return r;
  }
  protected stage(id: number, f: number, light: number) { return newsroomStage(id, f, light); }
}

// ---------------- the paper's flight ----------------
const LAND = ZEIT - 1, FLY0 = LAND - 9;
/** flies in from the top right, spinning a little, falls faster and faster, slaps flat, bounces once and settles */
const paperAt = (f: number) => {
  const end = { x: PX, y: DESK_Y + PT / 2 + 0.001, z: PZ };
  if (f < FLY0) return { on: false, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
  if (f < LAND) {
    const t = (f - FLY0) / (LAND - FLY0), k = 1 - t;
    return { on: true, x: end.x + 0.75 * k, y: end.y + 1.35 * (1 - t * t), z: end.z + 0.35 * k * k, rx: 1.1 * k, ry: PYAW + 0.8 * k, rz: -0.45 * k };
  }
  const d = f - LAND, dec = Math.exp(-d / 3.2);
  return { on: true, x: end.x, y: end.y + 0.03 * dec * Math.abs(Math.sin(d * 0.85)), z: end.z, rx: 0.05 * dec * Math.sin(d * 1.1), ry: PYAW, rz: -0.04 * dec * Math.sin(d * 1.3 + 0.6) };
};

// ---------------- who stands where ----------------
const REP = { ...crowd(3), skin: "#fbf8f2" };
export const newsroomStage = (_id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] }, L = q(light);
  const hit = LAND - LEAD, es = ES - LEAD;
  let o: FrontOpts;
  if (f < hit) o = { expr: "neutral", blink: blinkAt(f, 5) ? 1 : 0.4, look: -0.35, headTilt: 5, arms: ["hang", "hip"] };
  else if (f < hit + 10) o = { expr: "shock", blink: false, look: -0.2, headTilt: 0, arms: ["up", "hip"], tilt: q(-2 * (1 - ease.out((f - hit) / 10))) };
  else if (f < es) o = { expr: "whistle", blink: blinkAt(f, 5), look: -0.25, headTilt: 6, arms: ["cheek", "hip"] };
  else o = { expr: "smile", blink: blinkAt(f, 5), look: -0.3, headTilt: 8, arms: ["cheek", "hip"] };
  // seated behind the desk (the card is lifted to the chair's seat height)
  out.places.push({ ...personAt("REPORTER", REP, RX, RZ, { mode: "sit", seed: 33, light: L, ...o }, (p, fo) => bodyFront(p, REP, fo)), y: 0.3 });
  // papers lying on the stacks
  flatCard(out, "oldp|1", 300, 380, drawOldPaper(1), 0.78, DESK_Y + 16 * 0.013 + 0.002, -1.32, 0.28, -0.12);
  flatCard(out, "oldp|2", 300, 380, drawOldPaper(2), -0.74, DESK_Y + 5 * 0.013 + 0.002, -0.78, 0.28, 0.3);
  flatCard(out, "oldp|3", 300, 380, drawOldPaper(3), 0.36, DESK_Y + 4 * 0.013 + 0.002, -1.36, 0.26, 0.45);
  // steam from the mug, stirred by the slap
  const stir = f >= LAND ? Math.exp(-(f - LAND) / 8) : 0;
  for (let i = 0; i < 3; i++) {
    const t = (f * 0.012 + i / 3) % 1;
    card(out, "steam", 128, 128, steam, 0.56 + 0.03 * Math.sin(t * 6 + i) + 0.05 * stir, DESK_Y + 0.15 + 0.22 * t, -0.82, 0.05 + 0.04 * t, true);
  }
  // the slap: impact lines and four small dust puffs sliding out from under the paper
  const d = f - LAND;
  if (d >= 0 && d < 6) card(out, "slap", 600, 300, drawSlap, PX, DESK_Y + 0.12 + 0.01 * d, PZ + 0.1, 0.62 + 0.05 * d);
  if (d >= 0 && d < 12) {
    const k = ease.out(d / 12), sz = 0.07 * (1 - clamp01((d - 6) / 6)) + 0.01;
    for (const [sx, sz2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const)
      card(out, `npuff|${(sx + 2) * 2 + sz2}`, 160, 120, drawPuff(sx + sz2 * 3), PX + sx * (PW / 2 + 0.03 + 0.08 * k), DESK_Y + 0.025 + 0.02 * k, PZ + sz2 * (PD / 2 - 0.05 + 0.04 * k), sz);
  }
  if (f >= LAND - 4) contact(out, PX, DESK_Y + 0.001, PZ, f < LAND ? 0.3 + 0.3 * clamp01((f - LAND + 4) / 4) : 0.62);
  return out;
};
