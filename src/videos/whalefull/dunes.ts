// The dune crest of the whale short (shots 9, 11), built in code: a grassy sand ridge high above the beach with a
// picnic camp (blanket, basket, thermos, cooler, radio, a striped umbrella, a spotting scope), a slatted sand fence,
// shore pines inland, and far below (a 1:4 miniature, 65-90 m away) the long beach with the grey whale, its crates,
// two trucks, the sea with foam lines and a forested headland. Spectators are Pen cards; a "400 m" sign post (3D)
// pops up on "vierhundert"; in shot 11 3D blubber chunks come down out of the golden sky.
// World units are metres; the crest top is y ~ 0, its beach-side edge runs along x at z ~ -1.2 and ends at x ~ -11.
import * as THREE from "three";
import { Batch, Kit, V, boxGeo, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { placeProp } from "../pigeon/props";
import { Pen, FrontOpts, Outfit, bodyFront, headBlob } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, personAt, contact, card, V3, clamp01, ease, LEAD, blinkAt } from "./room";
import { WOMAN, crowd, drawGull } from "../whale/draw";
import { A, beat } from "./shots";

const ZUS = beat(9, "Zuschauer"), VIER = beat(9, "vierhundert");
const JUB = beat(11, "jubeln"), FRAU = beat(11, "Frau"), DA = beat(11, "Da"), WAL = beat(11, "Wal");

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  // behind the end of the crowd line, looking along the crest down to the whale far below; rises and pulls back
  9: { keys: [
    { f: A(9), pos: [6.2, 2.2, 2.5], look: [-6, 0.8, -4.6], fov: 40 },
    { f: ZUS + 4, dur: 40, pos: [8.5, 3.0, 4.0], look: [-6, 0.6, -4.6], fov: 38 },
  ], creep: 0.0005, punch: [VIER], cInf: [1.8, 1.6] },
  // in front of the crowd on the slope, low, looking up at them with the sky behind
  11: { keys: [
    { f: A(11), pos: [0.35, -0.2, -5.7], look: [0, 1.45, 0], fov: 54 },
    { f: FRAU - 2, dur: 12, pos: [0.12, -0.05, -4.5], look: [0, 1.6, -0.3], fov: 47 },
    { f: DA - 1, dur: 14, pos: [0.1, -0.35, -4.9], look: [0, 2.6, 1.0], fov: 60 },
  ], creep: 0.0008, kicks: [WAL], cInf: [3.2, 3.0, 3.2] },
};
export const dunesCam = camOf(CAMS);
const dof0 = dofOf(CAMS);
/** shot 11 keeps the woman sharp while the camera tilts up into the sky */
export const dunesDof = (id: number, f: number) => {
  const d = dof0(id, f);
  return id === 11 ? { ...d, focus: () => [0, 1.5, -0.7] as [number, number, number] } : d;
};

// ---------------- terrain ----------------
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const sm = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const XEND = -11;
/** distance past the crest edge (beach side -z, and the ridge's end toward -x), soft max of both */
const past = (x: number, z: number) => {
  const a = -1.2 + 0.22 * Math.sin(x * 0.45) - z, b = XEND + 0.6 * Math.sin(z * 0.5) - x;
  const k = 1.5; return k * Math.log(Math.exp(a / k) + Math.exp(b / k));
};
/** height of the dune at (x, z): flat grassy crest, rounded edge, long slip face down to the beach (-5.9) */
export const groundY = (x: number, z: number) => {
  const d = past(x, z);
  let y = 0.05 * Math.sin(x * 0.7 + 1) + 0.04 * Math.sin(x * 1.3 + z * 0.9);
  y += 0.3 * sm(0.2, 2.6, z) + 1.4 * sm(5, 16, z) * (0.5 + 0.5 * Math.sin(x * 0.22 + z * 0.1)) + 3.2 * sm(18, 34, z) * (0.6 + 0.4 * Math.sin(x * 0.13));
  if (d > 0) y = y * (1 - sm(0, 6, d)) - 5.8 * sm(0, 20, d) - 0.6 * clamp01((d - 20) / 6);
  return y;
};

// ---------------- painted textures ----------------
const sandTex = () => ctex("dnSand", 1024, 1024, (g, r) => {
  g.fillStyle = "#eccb92"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2400; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,120,70,0.13)" : "rgba(255,242,210,0.2)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 7, 1 + r() * 3); }
  g.strokeStyle = "rgba(176,128,78,0.22)"; g.lineWidth = 4;
  for (let i = 0; i < 22; i++) { const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 12 * Math.sin(x / 80 + i)); g.stroke(); }
  // painted grass patches
  for (let i = 0; i < 46; i++) {
    const cx = r() * 1024, cy = r() * 1024, s = 30 + r() * 70;
    g.fillStyle = "rgba(122,150,62,0.55)"; g.beginPath(); g.ellipse(cx, cy, s, s * 0.6, r() * 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = i % 2 ? "#6f8f36" : "#9cb653"; g.lineWidth = 3;
    for (let k = 0; k < 14; k++) { const x = cx + (r() - 0.5) * s * 1.5, y = cy + (r() - 0.5) * s * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 14, y - 12 - r() * 14); g.stroke(); }
  }
});
const beachTex = () => ctex("dnBeach", 1024, 1024, (g, r) => {
  g.fillStyle = "#efcf98"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,120,70,0.12)" : "rgba(255,242,210,0.2)"; g.fillRect(r() * 1024, r() * 1024, 3 + r() * 9, 1 + r() * 3); }
  g.strokeStyle = "rgba(176,128,78,0.2)"; g.lineWidth = 5;
  for (let i = 0; i < 16; i++) { const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 14 * Math.sin(x / 100 + i)); g.stroke(); }
});
const wetTex = () => ctex("dnWet", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#a3bdb4"); gr.addColorStop(1, "#cfae80");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,255,255,0.25)"; for (let i = 0; i < 60; i++) g.fillRect(r() * 512, r() * 512, 30 + r() * 80, 2);
});
const seaTex = () => ctex("dnSea", 1024, 1024, (g, r) => {
  const gr = g.createLinearGradient(1024, 0, 0, 0); gr.addColorStop(0, "#5cc9c9"); gr.addColorStop(0.3, "#2aa0ba"); gr.addColorStop(1, "#1f6eaa");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 170; i++) {
    const x = r() * 1024, y = r() * 1024, w = 20 + r() * 70;
    g.strokeStyle = r() < 0.6 ? "rgba(255,255,255,0.55)" : "rgba(14,60,110,0.35)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
const foamTex = () => ctex("dnFoam", 1024, 128, (g, r) => {
  g.clearRect(0, 0, 1024, 128);
  for (let k = 0; k < 3; k++) {
    g.fillStyle = `rgba(255,255,255,${0.95 - k * 0.25})`; g.beginPath(); g.moveTo(0, 128);
    for (let x = 0; x <= 1024; x += 16) g.lineTo(x, 40 + k * 26 + 10 * Math.sin(x / 40 + k * 2) + 6 * r());
    g.lineTo(1024, 128); g.closePath(); g.fill();
  }
});
/** sky dome texture: zenith at the canvas top, horizon at 50 %, puffy clouds on the horizon band */
const skyTex = (key: string, top: string, mid: string, mix: string, hor: string, lit: string, shade: string) => ctex(key, 2048, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, top); gr.addColorStop(0.3, mid); gr.addColorStop(0.44, mix); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
  const cloud = (cx: number, cy: number, s: number) => {
    for (let i = 0; i < 9; i++) {
      const x = cx + (i - 4) * 34 * s + (r() - 0.5) * 20 * s, y = cy - Math.sin((i / 8) * Math.PI) * 40 * s, rr = (34 + r() * 22) * s;
      g.fillStyle = shade; g.beginPath(); g.arc(x - 6 * s, y + 8 * s, rr, 0, Math.PI * 2); g.fill();
      g.fillStyle = lit; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
    }
  };
  // canvas y = 0.5 - elevation / 180: a low band of small clouds (5-20 deg up) and a few higher puffs
  for (let i = 0; i < 34; i++) cloud(i * 62 + r() * 40, 410 + r() * 60, 0.22 + r() * 0.25);
  for (let i = 0; i < 9; i++) cloud(i * 230 + r() * 120, 150 + r() * 200, 0.3 + r() * 0.3);
});
const cliffTex = () => ctex("dnCliff", 512, 512, (g, r) => {
  const cols = ["#5f7a48", "#6b8a52", "#4f6a3e", "#7a9358", "#566f43"];
  for (let y = 0, i = 0; y < 512; i++) { const h = 14 + r() * 30; g.fillStyle = cols[i % 5]; g.fillRect(0, y, 512, h); y += h; }
  g.fillStyle = "rgba(90,140,60,0.55)"; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * 512, r() * 140, 6 + r() * 14, 0, Math.PI * 2); g.fill(); }
});
const whaleTex = () => ctex("dnWhale", 512, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#6c7a94"); gr.addColorStop(0.6, "#7d8aa2"); gr.addColorStop(0.8, "#c4ccd8"); gr.addColorStop(1, "#d2d8e0");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "rgba(40,48,64,0.4)"; g.lineWidth = 2;
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = r() * 150; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 7, y + 3, x + 16 + r() * 10, y); g.stroke(); }
});
const blanketTex = () => ctex("dnBlanket", 512, 512, (g) => {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#f4ece0" : "#d63a34"; g.fillRect(i * 64, j * 64, 64, 64); }
  g.fillStyle = "rgba(214,58,52,0.45)"; for (let i = 0; i < 8; i++) { g.fillRect(i * 64 + 28, 0, 8, 512); g.fillRect(0, i * 64 + 28, 512, 8); }
});
const wickerTex = () => ctex("dnWicker", 256, 256, (g) => {
  g.fillStyle = "#c99a5a"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#8d6634"; g.lineWidth = 4;
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < 256; x += 32) { g.beginPath(); g.ellipse(x + 8, y + 8, 12, 6, 0, 0, Math.PI * 2); g.stroke(); }
});
const stripeTex = () => ctex("dnStripe", 512, 64, (g) => {
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#f7f0e2" : ["#e05a2c", "#2f8fb0"][(i >> 1) % 2]; g.fillRect((i * 512) / 12, 0, 512 / 12 + 1, 64); }
});
const signTex = () => ctex("dnSign400", 1100, 420, (g) => {
  g.fillStyle = "#f6e9c6"; g.fillRect(0, 0, 1100, 420);
  g.strokeStyle = "#c44a2e"; g.lineWidth = 22; g.strokeRect(220, 40, 840, 340);
  g.fillStyle = "#2b2430"; g.font = "bold 230px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("400 m", 640, 222);
  g.fillStyle = "#c44a2e"; g.beginPath(); g.moveTo(185, 130); g.lineTo(60, 210); g.lineTo(185, 290); g.closePath(); g.fill();
});

// ---------------- the cast ----------------
const white = (o: Outfit): Outfit => ({ ...o, skin: "#fbf8f2" });
const FOLK: Outfit[] = [1, 2, 3, 4, 5, 6, 7, 8].map((v) => white(crowd(v)));
const LADY = white(WOMAN);
/** binoculars held up to the eyes (both hands at the temples), drawn over the face */
const withBinoculars = (o: Outfit) => (p: Pen, fo: FrontOpts) => {
  bodyFront(p, o, fo);
  const H = headBlob(fo.seed ?? 1, 118, fo.facing ?? 0), u = (2 * H.a) / 100, hc = 975 - 6 * H.b, fx = 300 + 7 * u * (fo.facing ?? 0);
  p.poly([[fx - 30 * u, hc - 4 * u], [fx + 30 * u, hc - 4 * u], [fx + 30 * u, hc + 4 * u], [fx - 30 * u, hc + 4 * u]], "#4a4250", 2 * u);
  for (const s of [-1, 1]) {
    p.poly([[fx + s * 13 * u - 11 * u, hc - 13 * u], [fx + s * 13 * u + 11 * u, hc - 13 * u], [fx + s * 13 * u + 12 * u, hc + 13 * u], [fx + s * 13 * u - 12 * u, hc + 13 * u]], "#3b3540", 2.4 * u);
    p.ell(fx + s * 13 * u, hc + 2 * u, 8 * u, 8 * u, "#86bde0", 2 * u);
    p.ell(fx + s * 13 * u - 2 * u, hc - u, 2.5 * u, 2.5 * u, "#e8f6ff", 0);
  }
};

// ---------------- world ----------------
export class DunesWorld extends RoomWorld {
  private sky = new THREE.Mesh();
  private skyWarm!: THREE.Material;
  private skyGold!: THREE.Material;
  private sign = new THREE.Group();
  private chunks: THREE.Group[] = [];
  constructor(kit: Kit) {
    super(dunesCam);
    this.dust = false;
    const R = this.root;
    const ground = new Batch(), things = new Batch(), glow = new Batch(), far = new Batch();
    const M = {
      sand: lam("dnSand", () => ({ map: sandTex() })),
      beach: lam("dnBeach", () => ({ map: beachTex() })),
      wet: lam("dnWet", () => ({ map: wetTex() })),
      sea: lam("dnSea", () => ({ map: seaTex() })),
      cliff: lam("dnCliff", () => ({ map: cliffTex(), side: THREE.DoubleSide })),
      far: lam("dnFar", () => ({ color: "#2f6a4e", side: THREE.DoubleSide })),
      far2: lam("dnFar2", () => ({ color: "#4f5f9a", side: THREE.DoubleSide })),
      dune: lam("dnDune", () => ({ color: "#e8c58c" })),
      tree: lam("dnTree", () => ({ color: "#2f6b45" })),
      tree2: lam("dnTree2", () => ({ color: "#3f8550" })),
      trunk: lam("dnTrunk", () => ({ color: "#6a4630" })),
      grass: lam("dnGrass", () => ({ color: "#86a948", side: THREE.DoubleSide })),
      grass2: lam("dnGrass2", () => ({ color: "#a9c45c", side: THREE.DoubleSide })),
      grass3: lam("dnGrass3", () => ({ color: "#c9b46a", side: THREE.DoubleSide })),
      slat: lam("dnSlat", () => ({ color: "#b0875c" })),
      wire: lam("dnWire", () => ({ color: "#4a4250" })),
      blanket: lam("dnBlanket", () => ({ map: blanketTex() })),
      wicker: lam("dnWicker", () => ({ map: wickerTex() })),
      thermos: lam("dnThermos", () => ({ color: "#d9342b" })),
      cap: lam("dnCap", () => ({ color: "#f3efe6" })),
      cup: lam("dnCup", () => ({ color: "#3f8fd0" })),
      cooler: lam("dnCooler", () => ({ color: "#2f7fb5" })),
      stripe: lam("dnStripe", () => ({ map: stripeTex(), side: THREE.DoubleSide })),
      pole: lam("dnPole", () => ({ color: "#e9e2d2" })),
      scope: lam("dnScope", () => ({ color: "#3b4a5a" })),
      wood: lam("dnWood", () => ({ color: "#8a6436" })),
      signFace: lam("dnSignFace", () => ({ map: signTex() })),
      whale: lam("dnWhaleSkin", () => ({ map: whaleTex() })),
      fin: lam("dnFin", () => ({ color: "#6d7b92" })),
      crate: lam("dnCrate", () => ({ color: "#c48f55" })),
      red: lam("dnRed", () => ({ color: "#d9342b" })),
      truck: lam("dnTruck", () => ({ color: "#f08a24" })),
      truck2: lam("dnTruck2", () => ({ color: "#f1ede2" })),
      people: lam("dnPeople", () => ({ color: "#3f6fb5" })),
      head: lam("dnHead", () => ({ color: "#fbf8f2" })),
      flesh: lam("dnFlesh", () => ({ color: "#f4ab9c" })),
      fat: lam("dnFat", () => ({ color: "#f6dcb4" })),
      hide: lam("dnHide", () => ({ color: "#7d8ba6" })),
      log: lam("dnLog", () => ({ color: "#a98463" })),
    };

    // ---- the dune: one displaced heightfield, UVs in 6 m tiles ----
    {
      const g = new THREE.PlaneGeometry(150, 100, 150, 100); g.rotateX(-Math.PI / 2); g.translate(-25, 0, 18);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundY(x, z)); uv.setXY(i, x / 6, z / 6); }
      g.computeVertexNormals(); ground.add(g, M.sand);
    }
    // marram grass: tufts of 5 blades, dense on the crest, thinning down the slip face
    const tuft = (x: number, z: number, h: number, i: number) => {
      const y = groundY(x, z);
      for (let k = 0; k < 5; k++) {
        const hh = h * (0.7 + 0.5 * hash(i * 5 + k, 3)), b = new THREE.ConeGeometry(0.035, hh, 3);
        b.translate(0, hh / 2, 0); b.rotateZ((k - 2) * 0.22 + (hash(i, k) - 0.5) * 0.3); b.rotateY(hash(i, k + 9) * 3);
        b.translate(x, y - 0.03, z); things.add(b, [M.grass, M.grass2, M.grass3][(i + k) % 3]);
      }
    };
    let n = 0;
    for (let i = 0; i < 520; i++) { // crest and inland
      const x = -16 + hash(i, 1) * 30, z = -2.2 + hash(i, 2) * 14;
      if (Math.abs(z + 0.2) < 0.9 && x > -9 && x < 3.5 && hash(i, 4) < 0.75) continue; // keep the crowd's strip lighter
      tuft(x, z, 0.4 + hash(i, 3) * 0.6, n++);
    }
    for (let i = 0; i < 260; i++) { // the slip face
      const x = -14 + hash(i, 5) * 26, z = -2.5 - hash(i, 6) * 10;
      if (hash(i, 7) < 0.4 + 0.05 * (z + 2.5) || Math.hypot(x, z + 5) < 2.6) continue; // none on shot 11's lens
      tuft(x, z, 0.35 + hash(i, 8) * 0.5, n++);
    }
    for (let i = 0; i < 70; i++) { // foreground of shot 11: low tufts on the slope, kept out of the lens
      const x = (hash(i, 11) - 0.5) * 6, z = -2.2 - hash(i, 12) * 1.6;
      if (Math.abs(x) < 1.3) continue;
      tuft(x, z, 0.3 + hash(i, 13) * 0.35, n++);
    }
    // shore pines inland, behind the crest
    for (let i = 0; i < 46; i++) {
      const x = -40 + hash(i, 21) * 70, z = 7 + hash(i, 22) * 30, y = groundY(x, z), h = 3 + hash(i, 23) * 4;
      const tr = new THREE.CylinderGeometry(0.12, 0.18, h * 0.5, 6); tr.translate(x, y + h * 0.25, z); things.add(tr, M.trunk);
      for (let k = 0; k < 3; k++) { const c = new THREE.ConeGeometry(h * (0.32 - k * 0.07), h * 0.42, 7); c.translate(x, y + h * (0.42 + k * 0.2), z); things.add(c, (i + k) % 3 ? M.tree : M.tree2); }
    }
    // the slatted sand fence along the crest edge beyond the crowd
    const fz = (x: number) => -1.75 + 0.22 * Math.sin(x * 0.45);
    for (let k = 0; k < 70; k++) {
      const x = -3.6 - k * 0.12, z = fz(x), y = groundY(x, z), h = 0.95 + 0.08 * Math.sin(k * 1.7);
      const s = boxGeo(V(-0.035, 0, -0.012), V(0.035, h, 0.012)); s.rotateZ(0.06 * Math.sin(k)); s.translate(x, y - 0.1, z); things.add(s, M.slat);
    }
    for (const yy of [0.25, 0.75]) {
      const pts = Array.from({ length: 12 }, (_, k) => { const x = -3.6 - k * 0.76; return V(x, groundY(x, fz(x)) - 0.1 + yy, fz(x) - 0.013); });
      things.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 4), M.wire);
    }
    // a bleached log on the crest
    { const c = new THREE.CylinderGeometry(0.17, 0.14, 2.4, 9); c.rotateZ(Math.PI / 2); c.rotateY(0.5); c.translate(-5.2, groundY(-5.2, 0.9) + 0.12, 0.9); things.add(c, M.log); }

    // ---- the picnic camp behind the crowd ----
    const BX = -2.4, BZ = 0.9, by = Math.max(...[[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7], [0, 0]].map(([dx, dz]) => groundY(BX + dx, BZ + dz)));
    {
      const bl = boxGeo(V(-1.0, 0, -0.7), V(1.0, 0.03, 0.7)); bl.rotateY(0.25); bl.translate(BX, by, BZ); things.add(bl, M.blanket);
      const y = by + 0.03;
      const bk = boxGeo(V(-0.25, 0, -0.17), V(0.25, 0.3, 0.17)); bk.rotateY(0.4); bk.translate(BX - 0.5, y, BZ + 0.2); things.add(bk, M.wicker);
      const hd = new THREE.TorusGeometry(0.2, 0.02, 5, 14, Math.PI); hd.rotateY(0.4); hd.translate(BX - 0.5, y + 0.3, BZ + 0.2); things.add(hd, M.wicker);
      const th = new THREE.CylinderGeometry(0.06, 0.06, 0.34, 12); th.translate(BX + 0.35, y + 0.17, BZ - 0.15); things.add(th, M.thermos);
      const tc = new THREE.CylinderGeometry(0.065, 0.065, 0.07, 12); tc.translate(BX + 0.35, y + 0.37, BZ - 0.15); things.add(tc, M.cap);
      for (const [dx, dz] of [[0.55, 0.05], [0.2, 0.25]]) { const c = new THREE.CylinderGeometry(0.045, 0.035, 0.09, 10); c.translate(BX + dx, y + 0.045, BZ + dz); things.add(c, M.cup); }
      // binoculars lying on the blanket
      for (const s of [-1, 1]) { const b = new THREE.CylinderGeometry(0.035, 0.04, 0.14, 10); b.rotateX(Math.PI / 2); b.translate(BX + 0.05 + s * 0.045, y + 0.04, BZ + 0.45); things.add(b, M.scope); }
      const cx = BX + 1.35, cz = BZ + 0.5, cy = groundY(cx, cz);
      const co = boxGeo(V(-0.3, 0, -0.2), V(0.3, 0.34, 0.2)); co.rotateY(-0.3); co.translate(cx, cy, cz); things.add(co, M.cooler);
      const cl = boxGeo(V(-0.31, 0.34, -0.21), V(0.31, 0.4, 0.21)); cl.rotateY(-0.3); cl.translate(cx, cy, cz); things.add(cl, M.cap);
      placeProp(things, glow, kit, "radio", BX - 0.1, y, BZ - 0.3, { h: 0.22 }, 0.5);
      placeProp(things, glow, kit, "pillowBlue", BX + 0.6, y, BZ + 0.4, { h: 0.12 }, 0.2);
      // striped beach umbrella
      const ux = BX - 1.3, uz = BZ + 0.9, uy = groundY(ux, uz);
      const pole = new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8); pole.rotateZ(0.12); pole.translate(ux, uy + 1.05, uz); things.add(pole, M.pole);
      const um = new THREE.ConeGeometry(1.15, 0.45, 12, 1, true); um.rotateZ(0.12); um.translate(ux - 0.25, uy + 2.15, uz); things.add(um, M.stripe);
      // spotting scope on a tripod at the crest edge, aimed at the whale
      const sx = 3.2, sz = -0.9, sy = groundY(sx, sz);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28; const l = new THREE.CylinderGeometry(0.015, 0.015, 1.25, 5); l.rotateX(0.22); l.rotateY(a); l.translate(sx + 0.14 * Math.sin(a), sy + 0.6, sz + 0.14 * Math.cos(a)); things.add(l, M.scope); }
      const tb = new THREE.CylinderGeometry(0.045, 0.06, 0.5, 10); tb.rotateZ(Math.PI / 2 - 0.1); tb.rotateY(0.3); tb.translate(sx, sy + 1.28, sz); things.add(tb, M.scope);
    }

    // ---- the "400 m" sign post (pops up on "vierhundert") ----
    {
      const sb = new Batch();
      sb.add(boxGeo(V(-0.05, -0.3, -0.05), V(0.05, 1.75, 0.05)), M.wood);
      const shape = new THREE.Shape([[0, 0.5], [0.18, 0], [1, 0], [1, 1], [0.18, 1]].map(([x, y]) => new THREE.Vector2(x, y)));
      const side = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }); side.scale(1.15, 0.44, 1); side.translate(-0.9, 1.15, 0.05); sb.add(side, M.wood);
      const face = new THREE.ShapeGeometry(shape); face.scale(1.15, 0.44, 1); face.translate(-0.9, 1.15, 0.104); sb.add(face, M.signFace);
      sb.build(this.sign, true);
      const sx = -2.0, sz = -4.0; this.sign.position.set(sx, groundY(sx, sz), sz);
      const c = CAMS[9].keys[1].pos; this.sign.rotation.y = Math.atan2(c[0] - sx, c[2] - sz) + 0.15;
      R.add(this.sign);
    }

    // ---- far below: the beach as a 1:4 miniature (local metres are real metres) ----
    {
      const G = new THREE.Group();
      // local -z points from the crest out along the beach; the whale (local 0, 0, -120) lands at world (-75, -5.9, -55)
      G.position.set(-49.2, -5.9, -39.7); G.rotation.y = 1.036; G.scale.setScalar(0.25);
      const shoreX = (z: number) => -70 - 0.3 * (z + 120);
      const sand = new THREE.PlaneGeometry(1300, 1400); sand.rotateX(-Math.PI / 2); sand.translate(0, 0, -340);
      { const uv = sand.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 52, uv.getY(i) * 56); }
      far.add(sand, M.beach);
      const band = (x0: number, x1: number, y: number, mat: THREE.Material, toEdge = false) => {
        const pts: [number, number][] = [];
        for (let z = 360; z >= -980; z -= 20) pts.push([toEdge ? -650 : shoreX(z) + x1, z]);
        for (let z = -980; z <= 360; z += 20) pts.push([shoreX(z) + x0, z]);
        const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
        const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI / 2); geo.translate(0, y, 0);
        const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 60, p.getZ(i) / 60);
        far.add(geo, mat);
      };
      band(-6, 10, 0.25, M.wet);
      band(0, 0, 0.6, M.sea, true);
      // foam lines
      const foamMat = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false });
      for (let k = 0; k < 3; k++) for (let z = 340; z > -900; z -= 40) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(42, 5), foamMat);
        m.rotation.set(-Math.PI / 2, 0, Math.atan2(1, -0.3) + Math.PI / 2); m.position.set(shoreX(z - 20) - 3 - k * 9, 0.9 + k * 0.05, z - 20); m.layers.set(NOINK); G.add(m);
      }
      // dunes along the right of the beach, the headland beyond the sea on the left, far hills
      for (const [x, z, rx, ry, rz] of [[95, -40, 45, 12, 40], [140, -170, 70, 22, 55], [120, -320, 60, 18, 60], [200, -470, 90, 30, 70]] as const) {
        const d = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2); d.scale(rx, ry, rz); d.translate(x, -0.5, z); far.add(d, M.dune);
      }
      for (let i = 0; i < 70; i++) { // pines on the far dunes
        const x = 150 + hash(i, 31) * 260, z = -60 - hash(i, 32) * 500, h = 14 + hash(i, 33) * 12, y = 10 + hash(i, 34) * 14;
        const c = new THREE.ConeGeometry(h * 0.3, h, 7); c.translate(x, y + h / 2, z); far.add(c, i % 3 ? M.tree : M.tree2);
      }
      // silhouette with its own front face (as beach.ts: the extrude caps alone rendered blank), UVs in 40 m tiles
      const ridge = (pts: [number, number][], z: number, depth: number, mat: THREE.Material) => {
        const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
        const sides = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).toNonIndexed(); sides.translate(0, 0, z - depth);
        const front = new THREE.ShapeGeometry(s).toNonIndexed(); front.translate(0, 0, z + 0.3);
        for (const g of [front, sides]) {
          g.deleteAttribute("uv"); const p = g.attributes.position, uv = new Float32Array(p.count * 2);
          for (let i = 0; i < p.count; i++) { uv[2 * i] = p.getX(i) / 40; uv[2 * i + 1] = p.getY(i) / 40; }
          g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); far.add(g, mat);
        }
      };
      // the forested headland closing the far end of the beach (cliff face toward us, conifers along its top)
      const HX0 = -300, HX1 = 320, hTop = (x: number) => 150 * Math.sin(clamp01((x - HX0) / (HX1 - HX0)) * Math.PI) ** 0.7;
      ridge(Array.from({ length: 21 }, (_, k): [number, number] => { const x = HX0 + (k / 20) * (HX1 - HX0); return [x, hTop(x)]; }), -680, 80, M.cliff);
      for (let i = 0; i < 90; i++) {
        const x = HX0 + 10 + (i / 90) * (HX1 - HX0 - 20) + hash(i, 41) * 5, h = 22 + hash(i, 42) * 18;
        const c = new THREE.ConeGeometry(7 + hash(i, 43) * 4, h, 7); c.translate(x, hTop(x) + h / 2 - 6, -690 - hash(i, 44) * 60); far.add(c, i % 3 ? M.tree : M.tree2);
      }
      { const st = new THREE.CylinderGeometry(9, 15, 48, 7); st.translate(-150, 24, -560); far.add(st, M.cliff);
        const cap = new THREE.SphereGeometry(10, 8, 6); cap.scale(1, 0.5, 1); cap.translate(-150, 48, -560); far.add(cap, M.tree2); }
      ridge([[-500, 0], [-300, 70], [-60, 110], [180, 95], [420, 140], [700, 90], [700, 0]], -900, 20, M.far2);
      ridge([[-60, 0], [40, 40], [160, 70], [320, 60], [520, 85], [700, 50], [700, 0]], -760, 20, M.far);
      // the whale lying on the sand (14 m), its crates, two trucks and a few officials
      const WB = new Batch();
      { const skin = (g: THREE.BufferGeometry) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 7) / 14, (p.getY(i) + 0.2) / 4.2); return g; };
        const h = new THREE.CapsuleGeometry(2.0, 3.0, 6, 14); h.rotateZ(Math.PI / 2); h.translate(-3.5, 2.0, 0); WB.add(skin(h), M.whale);
        const t = new THREE.CylinderGeometry(1.8, 0.35, 7.4, 14, 3); t.rotateZ(Math.PI / 2); t.translate(2.2, 1.5, 0); WB.add(skin(t), M.whale);
        const fl = new THREE.Shape([[0, 0], [1.2, 1.8], [2.1, 1.7], [1.5, 0.25], [1.75, 0], [1.5, -0.25], [2.1, -1.7], [1.2, -1.8]].map(([x, y]) => new THREE.Vector2(x, y)));
        const fg = new THREE.ExtrudeGeometry(fl, { depth: 0.2, bevelEnabled: false }); fg.rotateX(Math.PI / 2); fg.translate(5.6, 0.5, 0); WB.add(fg, M.fin);
        for (let i = 0; i < 7; i++) { const cx = -2.6 + (i % 4) * 0.95 + (i >= 4 ? 0.47 : 0), cy = i >= 4 ? 0.6 : 0; WB.add(boxGeo(V(cx - 0.45, cy, 2.25), V(cx + 0.45, cy + 0.6, 2.85)), M.crate);
          WB.add(boxGeo(V(cx - 0.4, cy + 0.6, 2.4), V(cx + 0.4, cy + 0.8, 2.7)), M.red); }
        const tmp = new THREE.Group(); WB.build(tmp, true); tmp.rotation.y = -0.55; tmp.position.set(0, 0, -120); tmp.scale.setScalar(1.7); G.add(tmp); }
      for (const [x, z, yaw, mat] of [[22, -104, 0.3, M.truck], [31, -126, -0.4, M.truck2]] as const) {
        const cab = boxGeo(V(-1.2, 0.5, -1.1), V(0.6, 2.6, 1.1)); cab.rotateY(yaw); cab.translate(x, 0, z); far.add(cab, mat);
        const bed = boxGeo(V(0.6, 0.5, -1.2), V(4.6, 1.6, 1.2)); bed.rotateY(yaw); bed.translate(x, 0, z); far.add(bed, M.truck2);
        for (const s of [-1, 1]) for (const wx of [-0.4, 3.6]) { const w = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10); w.rotateX(Math.PI / 2); w.translate(wx, 0.5, s * 1.15); w.rotateY(yaw); w.translate(x, 0, z); far.add(w, M.scope); }
      }
      for (let i = 0; i < 8; i++) {
        const x = 8 + hash(i, 51) * 22, z = -96 - hash(i, 52) * 34;
        const b = new THREE.CylinderGeometry(0.35, 0.4, 1.3, 7); b.translate(x, 0.65, z); far.add(b, i % 2 ? M.people : M.truck);
        const h = new THREE.SphereGeometry(0.32, 8, 6); h.translate(x, 1.6, z); far.add(h, M.head);
      }
      far.build(G, false);
      R.add(G);
    }

    // ---- 3D blubber chunks for shot 11 (skin cap + fat + flesh) ----
    for (let i = 0; i < 13; i++) {
      const g = new THREE.Group(), s = 0.7 + hash(i, 61) * 0.7;
      const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.flesh); fl.scale.set(s * (0.9 + hash(i, 62) * 0.5), s * 0.7, s * (0.8 + hash(i, 63) * 0.4));
      const fat = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.fat); fat.scale.set(fl.scale.x * 0.9, fl.scale.y * 0.5, fl.scale.z * 0.9); fat.position.y = s * 0.32;
      const hide = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.hide); hide.scale.set(fl.scale.x * 0.85, fl.scale.y * 0.35, fl.scale.z * 0.85); hide.position.y = s * 0.52;
      for (const m of [fl, fat, hide]) { m.castShadow = true; g.add(m); }
      g.visible = false; this.chunks.push(g); R.add(g);
    }

    ground.build(R, false);
    things.build(R, true);
    glow.build(R, false);
    // sky dome (warm afternoon for shot 9, golden for shot 11), follows the camera
    this.skyWarm = new THREE.MeshBasicMaterial({ map: skyTex("dnSkyWarm", "#3a78d4", "#6fa8e8", "#b9d4ee", "#f6dcb8", "#fff7ee", "#b9b4dc"), side: THREE.BackSide, depthWrite: false });
    this.skyGold = new THREE.MeshBasicMaterial({ map: skyTex("dnSkyGold", "#4a6cc4", "#8c9ade", "#f0b49a", "#ffd294", "#fff0d6", "#c9a0c0"), side: THREE.BackSide, depthWrite: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(420, 48, 24), this.skyWarm);
    this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);
  }

  protected tick(id: number, f: number) {
    this.sky.material = id === 11 ? this.skyGold : this.skyWarm;
    // the sign: hidden, then springs out of the sand with an overshoot and a wobble
    const up = id !== 9 || f >= VIER - 3, s = up ? ease.back(id === 9 ? clamp01((f - (VIER - 3)) / 9) : 1, 2.2) : 0;
    this.sign.visible = up && id === 9;
    this.sign.scale.set(Math.max(0.001, 0.6 + 0.4 * s), Math.max(0.001, s), 1);
    this.sign.rotation.z = id === 9 && up ? 0.08 * Math.sin((f - VIER) * 0.7) * Math.exp(-Math.max(0, f - VIER) / 8) : 0;
    this.chunks.forEach((g, i) => {
      const c = id === 11 ? chunkAt(i, f) : null;
      g.visible = !!c;
      if (c) { g.position.set(...c.p); g.rotation.set(c.spin * 1.3, c.spin, c.spin * 0.7); }
    });
  }
  protected stage(id: number, f: number, light: number) { return id === 9 ? stage9(f, light) : stage11(f, light); }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    this.sky.position.copy(cam.position);
    cam.near = 0.15; cam.far = 600; cam.updateProjectionMatrix();
    return r;
  }
}

// ---------------- chunks: out of the sky beyond the crowd, down toward them ----------------
const chunkAt = (i: number, f: number): { p: V3; spin: number } | null => {
  const f0 = DA + 1 + i * 1.5, T = 32 + 8 * hash(i, 71), u = (f - f0) / T;
  if (u < 0) return null;
  const s: V3 = [(hash(i, 72) - 0.5) * 12, 25 + 5 * hash(i, 73), 11 + 5 * hash(i, 74)];
  const e: V3 = [(hash(i, 75) - 0.5) * 5, 0.5, -1 + 3 * hash(i, 76)];
  const v = Math.min(1, u);
  return { p: [s[0] + (e[0] - s[0]) * v, s[1] + (e[1] - s[1]) * (0.7 * v + 0.3 * v * v), s[2] + (e[2] - s[2]) * v], spin: hash(i, 77) * 6 + (f - f0) * 0.12 };
};

// ---------------- who stands where ----------------
type Who = { o: Outfit; seed: number; lady?: boolean };
const CAST: Who[] = [
  { o: FOLK[1], seed: 31 }, { o: LADY, seed: 32, lady: true }, { o: FOLK[2], seed: 33 }, { o: FOLK[3], seed: 34 }, { o: FOLK[0], seed: 35 },
  { o: FOLK[4], seed: 36 }, { o: FOLK[5], seed: 37 }, { o: FOLK[6], seed: 38 }, { o: FOLK[7], seed: 39 },
];
const put = (out: Stage, name: string, w: Who, x: number, z: number, fo: FrontOpts, draw?: (p: Pen, fo: FrontOpts) => void, hop = 0) => {
  const y = groundY(x, z);
  out.places.push({ ...personAt(name, w.o, x, z, { mode: "stand", seed: w.seed, ...fo }, draw), y: y - 0.04 + hop });
  contact(out, x, y, z, 0.8);
};

/** shot 9: the crowd strung along the crest edge, looking out at the whale; one with binoculars, gulls over the beach */
const stage9 = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  const spots: [number, number][] = [[2.6, -0.55], [1.7, -0.3], [0.8, -0.7], [-0.1, -0.35], [-1.0, -0.75], [-1.9, -0.4], [-2.8, -0.8], [-3.7, -0.5], [-4.6, -0.85]];
  const EX: NonNullable<FrontOpts["expr"]>[] = ["neutral", "smile", "grin", "smile", "neutral", "grin", "smile", "neutral", "grin"];
  spots.forEach(([x, z], i) => {
    const w = CAST[i], blink = blinkAt(f, i + 3);
    if (i === 0) { put(out, "dn9binoc", w, x, z, { expr: "neutral", arms: ["temple", "temple"], headTilt: 0, facing: 1, light }, withBinoculars(w.o)); return; }
    const arms: NonNullable<FrontOpts["arms"]> = w.lady ? ["hip", "hang"] : i === 2 ? ["point", "hang"] : i === 5 ? ["hang", "cheek"] : i === 6 ? ["cross", "cross"] : i % 2 ? ["hang", "hip"] : ["hang", "hang"];
    put(out, "dn9c" + i, w, x, z, { expr: EX[i], arms, facing: 1, look: 0.6, blink, light });
  });
  // gulls wheeling over the beach below
  for (let i = 0; i < 4; i++) {
    const a = f * 0.03 + i * 1.6, fl = Math.round((0.5 + 0.5 * Math.sin(f * 0.4 + i * 2)) * 4) / 4;
    card(out, "dngull" + fl, 300, 240, drawGull({ flap: fl }), -14 - i * 6 + 3 * Math.cos(a), 0.5 + i * 0.7 + 0.4 * Math.sin(a * 1.3), -12 - i * 4 + 2 * Math.sin(a), 0.8);
  }
  return out;
};

/** shot 11: the crowd in two rows facing the camera; cheering from "jubeln", the woman calm in the middle, pointing up
 *  on "Da", everyone in shock on "Wal" */
const stage11 = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  const cheer = f >= JUB - LEAD, shock = f >= WAL - LEAD, point = f >= DA - LEAD;
  const back: [number, number][] = [[-1.2, 0.35], [-0.42, 0.45], [0.42, 0.4], [1.2, 0.3]];
  const front: [number, number][] = [[-1.55, -0.75], [-0.78, -0.6], [0.78, -0.62], [1.55, -0.78]];
  const order = [2, 3, 4, 5, 0, 6, 7, 8]; // CAST indices (the lady is 1)
  [...back, ...front].forEach(([x, z], j) => {
    const i = order[j], w = CAST[i], ph = f * 0.42 + i * 1.7;
    let fo: FrontOpts;
    if (shock) fo = { expr: "shock", arms: j % 3 === 0 ? ["up", "up"] : j % 3 === 1 ? ["temple", "temple"] : ["cheek", "cheek"], look: 0 };
    else if (cheer) fo = { expr: j % 2 ? "laugh" : "grin", arms: j % 3 === 0 ? ["up", "up"] : j % 3 === 1 ? ["wave", "up"] : ["up", "wave"], wave: Math.round(ph * 2) / 2, look: x > 0 ? -0.3 : 0.3 };
    else fo = { expr: j % 2 ? "smile" : "neutral", arms: ["hang", j % 2 ? "hip" : "hang"], look: 0 };
    const hop = cheer && !shock ? 0.07 * Math.abs(Math.sin(ph * 0.8)) : 0;
    put(out, "dn11c" + j, w, x, z, { ...fo, blink: blinkAt(f, j + 5), light }, undefined, hop);
  });
  // the woman in the middle: calm, flat face, points up on "Da"
  put(out, "dn11lady", CAST[1], 0, -0.68, { expr: shock ? "shock" : "neutral", arms: point ? ["hang", "up"] : ["hang", "hang"], look: 0, blink: !point && blinkAt(f, 1), light, headTilt: point ? -3 : 0 });
  return out;
};
