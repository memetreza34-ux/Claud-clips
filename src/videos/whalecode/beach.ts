// The Oregon beach of the whale test, built entirely in code: painted sand with ripples and shells, the sea with foam
// lines, a forested headland and a sea stack, grassy dunes, driftwood, kelp, the 14 m sperm whale (3D, lying on its
// side), the detonator with its wire, crates of dynamite. Thornton is a Pen card; the blast, sand cloud, blubber and
// gulls are cards. World units are metres; the camera looks roughly toward -z, the sea is on the left (-x).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { Pen, FrontOpts } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, personAt, contact, card, flatCard, V3, clamp01, ease } from "./room";
import { THORNTON, crowd, drawChunk, drawBoom, drawPuff, drawGull } from "../whale/draw";
import { PRESS, BANG } from "./shots";

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  // low glide over the sand toward the whale, landing on Thornton at his plunger; push on the thumbs up
  1: { keys: [{ f: 0, pos: [3.4, 0.6, 8.2], look: [-1.8, 1.5, -12], fov: 50 },
    { f: 18, dur: 70, pos: [2.0, 1.6, 4.9], look: [-0.1, 1.2, -2.0], fov: 42 },
    { f: 96, dur: 14, pos: [1.7, 1.75, 3.3], look: [0.6, 1.45, -0.4], fov: 40 }], creep: 0.0012, punch: [100], cInf: [4, 5, 6], drift: [0.15, 0.03, 0.2] },
  // wider to see the blast; then push in on his face while the blubber comes down
  2: { keys: [{ f: 150, pos: [3.0, 2.0, 7.5], look: [-1.4, 2.2, -9], fov: 50 },
    { f: 222, dur: 26, pos: [1.6, 1.75, 3.4], look: [0.95, 1.4, 0.2], fov: 40 }], creep: 0.0008, kicks: [BANG, BANG + 4, 252], punch: [BANG], cInf: [4, 6], drift: [0.1, 0.02, 0.15] },
};
export const beachCam = camOf(CAMS);
export const beachDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const sandTex = () => ctex("wcSand", 1024, 1024, (g, r) => {
  g.fillStyle = "#ecc98f"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,120,70,0.12)" : "rgba(255,240,205,0.18)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 7, 1 + r() * 3); }
  // wind ripples
  g.strokeStyle = "rgba(176,128,78,0.22)"; g.lineWidth = 4;
  for (let i = 0; i < 26; i++) { const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 10 * Math.sin(x / 90 + i)); g.stroke(); }
  // shells and pebbles
  for (let i = 0; i < 70; i++) {
    const x = r() * 1024, y = r() * 1024, s = 5 + r() * 9;
    g.fillStyle = ["#f6e7d4", "#e3b9a0", "#c9b8a8", "#8f8a88"][i % 4]; g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(60,40,40,0.5)"; g.lineWidth = 1.5; g.stroke();
  }
});
const wetTex = () => ctex("wcWet", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#9fb7b0"); gr.addColorStop(1, "#c9a87c");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,255,255,0.25)"; for (let i = 0; i < 60; i++) g.fillRect(r() * 512, r() * 512, 30 + r() * 80, 2);
});
const seaTex = () => ctex("wcSea", 1024, 1024, (g, r) => {
  const gr = g.createLinearGradient(1024, 0, 0, 0); gr.addColorStop(0, "#57c7c9"); gr.addColorStop(0.35, "#2a9fb8"); gr.addColorStop(1, "#1d6ea8");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 160; i++) {
    const x = r() * 1024, y = r() * 1024, w = 20 + r() * 70;
    g.strokeStyle = r() < 0.6 ? "rgba(255,255,255,0.55)" : "rgba(14,60,110,0.35)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
const foamTex = () => ctex("wcFoam", 1024, 128, (g, r) => {
  g.clearRect(0, 0, 1024, 128);
  for (let k = 0; k < 3; k++) {
    g.fillStyle = `rgba(255,255,255,${0.95 - k * 0.25})`; g.beginPath(); g.moveTo(0, 128);
    for (let x = 0; x <= 1024; x += 16) g.lineTo(x, 40 + k * 26 + 10 * Math.sin(x / 40 + k * 2) + 6 * r());
    g.lineTo(1024, 128); g.closePath(); g.fill();
  }
});
const skyTex = () => ctex("wcSky", 1024, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#3d7fd6"); gr.addColorStop(0.45, "#79aee6"); gr.addColorStop(0.75, "#f2c79a"); gr.addColorStop(1, "#ffdcae");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  // big puffy painted clouds, lit from the right
  const cloud = (cx: number, cy: number, s: number) => {
    for (let i = 0; i < 9; i++) {
      const x = cx + (i - 4) * 34 * s + (r() - 0.5) * 20 * s, y = cy - Math.sin((i / 8) * Math.PI) * 42 * s, rr = (38 + r() * 24) * s;
      g.fillStyle = "#c9b8d8"; g.beginPath(); g.arc(x - 6 * s, y + 8 * s, rr, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff7ee"; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
    }
  };
  cloud(220, 300, 1.1); cloud(760, 220, 0.9); cloud(560, 470, 0.7); cloud(120, 560, 0.5); cloud(900, 520, 0.6);
});
const cliffTex = () => ctex("wcCliff", 512, 512, (g, r) => {
  const cols = ["#9a6a4c", "#a8775a", "#8a5d44", "#b48466", "#7f5640"];
  for (let y = 0, i = 0; y < 512; i++) { const h = 14 + r() * 30; g.fillStyle = cols[i % 5]; g.fillRect(0, y, 512, h); y += h; }
  g.strokeStyle = "rgba(50,25,25,0.35)"; g.lineWidth = 3;
  for (let i = 0; i < 50; i++) { g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 24, y + 16 + r() * 40); g.stroke(); }
  g.fillStyle = "rgba(90,140,60,0.55)"; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * 512, r() * 140, 6 + r() * 14, 0, Math.PI * 2); g.fill(); }
});
const whaleTex = () => ctex("wcWhale", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#3f4a5e"); gr.addColorStop(0.6, "#4a5468"); gr.addColorStop(0.78, "#aeb7c6"); gr.addColorStop(1, "#cdd4de");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  // wrinkles and scars, painted
  g.strokeStyle = "rgba(40,48,64,0.45)"; g.lineWidth = 3;
  for (let i = 0; i < 120; i++) { const x = r() * 1024, y = r() * 300; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y + 5, x + 30 + r() * 20, y); g.stroke(); }
  g.strokeStyle = "rgba(230,236,240,0.5)"; g.lineWidth = 2;
  for (let i = 0; i < 30; i++) { const x = r() * 1024, y = r() * 260; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 40, y + (r() - 0.5) * 10); g.stroke(); }
});
const crateTex = () => ctex("wcCrate", 256, 256, (g) => {
  g.fillStyle = "#c48f55"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#7d5530"; g.lineWidth = 8; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  g.lineWidth = 10; g.strokeRect(5, 5, 246, 246);
  g.fillStyle = "#f3e2b0"; g.beginPath(); g.arc(128, 128, 44, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#d9342b"; g.lineWidth = 12; g.beginPath(); g.moveTo(104, 104); g.lineTo(152, 152); g.moveTo(152, 104); g.lineTo(104, 152); g.stroke();
});
const xEye = (p: Pen) => {
  p.ell(64, 64, 52, 52, "#f4f4f4", 6);
  p.stroke([[38, 38], [90, 90]], 12); p.stroke([[90, 38], [38, 90]], 12);
};
const scorch = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(256, 256, 20, 256, 256, 250);
  gr.addColorStop(0, "rgba(40,28,30,0.9)"); gr.addColorStop(0.6, "rgba(70,50,46,0.6)"); gr.addColorStop(1, "rgba(70,50,46,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
};

// ---------------- geometry helpers ----------------
/** silhouette in x/y extruded toward -z, front face at z */
const ridge = (pts: [number, number][], z: number, depth: number, uvScale = 8) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const sides = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).toNonIndexed(); sides.translate(0, 0, z - depth);
  const front = new THREE.ShapeGeometry(s).toNonIndexed(); front.translate(0, 0, z);
  const g = mergeGeometries([front, sides].map((x) => { x.deleteAttribute("uv"); x.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; }))!;
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / uvScale, p.getY(i) / uvScale);
  return g;
};
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// whale placement: built along local x (belly toward local +z) around the origin, then turned so the head comes toward
// the camera on the left and the tail runs away to the back right
const WX = 0, WZ = 0, WLEN = 14;
const WPOS: V3 = [-2.6, 0, -16], WYAW = 0.75;
/** world position of a point given in the whale's local frame */
const W = (lx: number, ly: number, lz: number): V3 => {
  const c = Math.cos(WYAW), s = Math.sin(WYAW);
  return [WPOS[0] + lx * c + lz * s, WPOS[1] + ly, WPOS[2] - lx * s + lz * c];
};

export class BeachWorld extends RoomWorld {
  private whale = new THREE.Group();
  private broken = new THREE.Group();
  private chunks: THREE.Group[] = [];
  private puffs: THREE.Mesh[] = [];
  private plunger = new THREE.Group();
  constructor() {
    super(beachCam);
    this.dust = false;
    const R = this.root;
    const ground = new Batch(), things = new Batch(), whale = new Batch();
    const M = {
      sand: lam("wcSand", () => ({ map: sandTex() })),
      wet: lam("wcWet", () => ({ map: wetTex() })),
      cliff: lam("wcCliff", () => ({ map: cliffTex(), side: THREE.DoubleSide })),
      far: lam("wcFar", () => ({ color: "#5b7f6a", side: THREE.DoubleSide })),
      far2: lam("wcFar2", () => ({ color: "#7d9a9a", side: THREE.DoubleSide })),
      tree: lam("wcTree", () => ({ color: "#2f6b45" })),
      tree2: lam("wcTree2", () => ({ color: "#3f8550" })),
      trunk: lam("wcTrunk", () => ({ color: "#6a4630" })),
      dune: lam("wcDune", () => ({ color: "#e6c189" })),
      grass: lam("wcGrass", () => ({ color: "#86a948", side: THREE.DoubleSide })),
      grass2: lam("wcGrass2", () => ({ color: "#a7c25a", side: THREE.DoubleSide })),
      wood: lam("wcWood", () => ({ color: "#a98463" })),
      woodEnd: lam("wcWoodEnd", () => ({ color: "#e2c9a0" })),
      rock: lam("wcRock", () => ({ color: "#7d7a86" })),
      kelp: lam("wcKelp", () => ({ color: "#5d6b2e" })),
      whale: lam("wcWhaleSkin", () => ({ map: whaleTex() })),
      fin: lam("wcFin", () => ({ color: "#66758a" })),
      box: lam("wcBox", () => ({ color: "#c2402e" })),
      boxTop: lam("wcBoxTop", () => ({ color: "#f3e2b0" })),
      metal: lam("wcMetal", () => ({ color: "#9aa2ad" })),
      handle: lam("wcHandle", () => ({ color: "#4a3022" })),
      wire: lam("wcWire", () => ({ color: "#2b2430" })),
      crate: lam("wcCrate", () => ({ map: crateTex() })),
      stick: lam("wcStick", () => ({ color: "#d9342b" })),
      jaw: lam("wcJaw", () => ({ color: "#cfd6e0" })),
      mouth: lam("wcMouth", () => ({ color: "#2b2f3a" })),
      tooth: lam("wcTooth", () => ({ color: "#fbfaf4" })),
      wound: lam("wcWound", () => ({ color: "#b3423a" })),
      fat: lam("wcFat", () => ({ color: "#f6dcb4" })),
      crater: lam("wcCrater", () => ({ color: "#c9a26a" })),
      craterIn: lam("wcCraterIn", () => ({ color: "#8a6a48" })),
      burnt: lam("wcBurnt", () => ({ color: "#3a2a22" })),
      flesh: lam("wcFlesh", () => ({ color: "#e79a8c" })),
      hide: lam("wcHide", () => ({ color: "#4f5c73" })),
      cloud: lam("wcCloud", () => ({ color: "#f0d49c" })),
      bar: lam("wcBar", () => ({ color: "#d9342b" })),
      barW: lam("wcBarW", () => ({ color: "#f5efe4" })),
      post: lam("wcPost", () => ({ color: "#8a6440" })),
      rope: lam("wcRope", () => ({ color: "#e8d6a8" })),
    };
    // sand floor
    const floor = new THREE.PlaneGeometry(140, 110); floor.rotateX(-Math.PI / 2); floor.translate(10, 0, -30);
    const fuv = floor.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 14, fuv.getY(i) * 11);
    ground.add(floor, M.sand);
    // shoreline: wet sand band and the sea, the shore running diagonally from near-left to far-right
    const shore = (z: number) => -10 - 0.35 * z; // x of the waterline at depth z
    const band = (x0: number, x1: number, y: number, mat: THREE.Material) => {
      const pts: [number, number][] = [];
      for (let z = 12; z >= -70; z -= 4) pts.push([shore(z) + x1, z]);
      for (let z = -70; z <= 12; z += 4) pts.push([shore(z) + x0, z]);
      const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI / 2); geo.translate(0, y, 0);
      const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 18, p.getZ(i) / 18);
      ground.add(geo, mat);
    };
    band(-2.5, 2.5, 0.01, M.wet);
    const sea = new THREE.MeshBasicMaterial({ map: seaTex() });
    { const pts: [number, number][] = []; for (let z = 12; z >= -90; z -= 4) pts.push([shore(z), z]); pts.push([-120, -90], [-120, 12]);
      const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI / 2); geo.translate(0, 0.03, 0);
      const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 30, p.getZ(i) / 30);
      const m = new THREE.Mesh(geo, lam("wcSea", () => ({ map: seaTex() }))); m.receiveShadow = true; R.add(m); void sea; }
    // foam lines along the waterline (cards lying flat, NOINK)
    const foamMat = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false });
    for (let k = 0; k < 3; k++) for (let z = 10; z > -80; z -= 10) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 1.2), foamMat);
      m.rotation.set(-Math.PI / 2, 0, Math.atan2(1, 0.35) + Math.PI / 2); m.position.set(shore(z - 5) - 0.6 - k * 2.4, 0.05 + k * 0.002, z - 5); m.layers.set(NOINK); R.add(m);
    }
    // headland across the back left (cliff face + forest), a sea stack, far hills on the right
    things.add(ridge([[-70, 0], [-66, 6], [-58, 11], [-46, 14], [-34, 15], [-24, 13], [-18, 9], [-15, 4], [-13, 0]], -46, 14), M.cliff);
    things.add(ridge([[-14, 0], [-6, 3], [8, 4.5], [22, 7], [40, 9], [60, 8], [70, 0]], -64, 6), M.far);
    things.add(ridge([[-60, 0], [-40, 14], [-10, 18], [20, 16], [50, 20], [80, 12], [80, 0]], -90, 4), M.far2);
    { const st = new THREE.CylinderGeometry(1.8, 3.2, 11, 7); st.translate(-24, 5.5, -36); things.add(st, M.cliff);
      const cap = new THREE.SphereGeometry(2.1, 8, 6); cap.scale(1, 0.5, 1); cap.translate(-24, 11.2, -36); things.add(cap, M.tree2); }
    for (let i = 0; i < 46; i++) { // conifers on the headland
      const x = -64 + i * 1.15 + hash(i, 1) * 1.2, top = Math.min(15, 6 + 9 * Math.sin(((x + 64) / 51) * Math.PI)), h = 3.5 + hash(i, 2) * 3;
      const z = -46 - 1 - hash(i, 3) * 10;
      if (x > -15) continue;
      const c = new THREE.ConeGeometry(0.9 + hash(i, 4) * 0.5, h, 7); c.translate(x, top + h / 2 - 0.5, z); things.add(c, i % 3 ? M.tree : M.tree2);
    }
    // dunes on the right with beach grass
    for (const [x, z, rx, ry, rz] of [[16, -8, 9, 2.6, 7], [12, -20, 11, 3.4, 8], [24, -28, 12, 4.4, 9]] as const) {
      const d = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); d.scale(rx, ry, rz); d.translate(x, 0, z); things.add(d, M.dune);
    }
    for (let i = 0; i < 260; i++) {
      const x = 7 + hash(i, 5) * 22, z = 0 - hash(i, 6) * 34, h = 0.5 + hash(i, 7) * 0.9;
      const blade = new THREE.ConeGeometry(0.06, h, 3); blade.rotateZ((hash(i, 8) - 0.5) * 0.7); blade.translate(x, h / 2 + duneY(x, z), z); things.add(blade, i % 2 ? M.grass : M.grass2);
    }
    // driftwood, rocks, kelp in the foreground and mid ground
    const log = (x: number, z: number, len: number, r: number, yaw: number) => {
      const c = new THREE.CylinderGeometry(r, r * 0.85, len, 10); c.rotateZ(Math.PI / 2); c.rotateY(yaw); c.translate(x, r * 0.8, z); things.add(c, M.wood);
      for (const s of [-1, 1]) { const e = new THREE.CircleGeometry(r * 0.9, 10); e.rotateY(Math.PI / 2 + yaw); e.translate(x + s * Math.cos(yaw) * len / 2, r * 0.8, z - s * Math.sin(yaw) * len / 2); things.add(e, M.woodEnd); }
      const br = new THREE.CylinderGeometry(r * 0.3, r * 0.2, len * 0.35, 6); br.rotateZ(Math.PI / 2 - 0.7); br.rotateY(yaw); br.translate(x + 0.3, r * 1.4, z); things.add(br, M.wood);
    };
    log(-3.2, 3.2, 3.4, 0.22, 0.35); log(3.9, 1.0, 2.6, 0.18, -0.6); log(-6, -3, 4.2, 0.28, 0.9); log(6.5, -12, 5, 0.3, 0.2); log(-1.5, 7.5, 2.2, 0.15, -0.2);
    for (let i = 0; i < 18; i++) { const s = new THREE.DodecahedronGeometry(0.12 + hash(i, 9) * 0.35, 0); s.scale(1.3, 0.6, 1); s.translate(-8 + hash(i, 10) * 16, 0.08, 9 - hash(i, 11) * 26); things.add(s, M.rock); }
    for (let i = 0; i < 10; i++) { const k = new THREE.TorusGeometry(0.25 + hash(i, 12) * 0.2, 0.04, 4, 10, Math.PI * 1.3); k.rotateX(Math.PI / 2); k.translate(shore(-i * 6) + 2.5 + hash(i, 13), 0.03, 4 - i * 6); things.add(k, M.kelp); }
    // the detonator next to where Thornton stands (x 0.95, z 0.2), its wire snaking to the whale
    const DX = 0.42, DZ = 0.35; // detonator (chunk 0 lands on it)
    things.add(boxGeo(V(DX - 0.3, 0, DZ - 0.22), V(DX + 0.3, 0.45, DZ + 0.22)), M.box);
    things.add(boxGeo(V(DX - 0.22, 0.45, DZ - 0.15), V(DX + 0.22, 0.46, DZ + 0.15)), M.boxTop);
    { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), M.metal); rod.position.set(0, 0.225, 0);
      const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 10), M.handle); hdl.rotation.z = Math.PI / 2; hdl.position.set(0, 0.46, 0);
      for (const m of [rod, hdl]) { m.castShadow = true; this.plunger.add(m); }
      this.plunger.position.set(DX, 0.45, DZ); R.add(this.plunger); }
    const WE = W(-1.2, 0.4, 2.6);
    const wirePts = [V(DX - 0.22, 0.1, DZ), V(-0.4, 0.03, -0.6), V(0.6, 0.03, -2.4), V(-0.8, 0.03, -4.6), V(WE[0] + 0.6, 0.03, WE[2] + 1.2), V(...WE)];
    things.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePts), 60, 0.018, 5), M.wire);
    // crates of dynamite stacked against the whale's belly
    for (let i = 0; i < 7; i++) {
      const cx = WX - 2.6 + (i % 4) * 0.95 + (i >= 4 ? 0.47 : 0), cy = i >= 4 ? 0.6 : 0, cz = WZ + 2.55;
      whale.add(boxGeo(V(cx - 0.45, cy, cz - 0.3), V(cx + 0.45, cy + 0.6, cz + 0.3)), M.crate);
      for (let k = 0; k < 6; k++) { const s = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8); s.translate(cx - 0.32 + k * 0.13, cy + 0.7, cz); whale.add(s, M.stick); }
    }
    // the whale: a boxy sperm whale head, a tapering body to the flukes, lying on its side (belly toward +z)
    const skinUV = (g: THREE.BufferGeometry) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 7) / 14, (p.getY(i) + 0.2) / 4.2); return g; };
    const headGeo = (len: number, cx: number) => { const h = new THREE.CapsuleGeometry(2.0, len, 8, 20); h.rotateZ(Math.PI / 2); h.scale(1, 1.0, 0.95); h.translate(cx, 2.0, 0); return skinUV(h); };
    const tailGeo = (x0: number, x1: number, r0: number) => { const c = new THREE.CylinderGeometry(r0, 0.35, x1 - x0, 18, 4); c.rotateZ(Math.PI / 2); c.translate((x0 + x1) / 2, 1.5, 0); return skinUV(c); };
    const flukes = (b: Batch) => {
      const fl = new THREE.Shape([[0, 0], [1.2, 1.8], [2.1, 1.7], [1.5, 0.25], [1.75, 0], [1.5, -0.25], [2.1, -1.7], [1.2, -1.8]].map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ExtrudeGeometry(fl, { depth: 0.2, bevelEnabled: false }); g.rotateX(Math.PI / 2); g.translate(5.6, 0.5, 0); b.add(g, M.fin);
      for (let k = 0; k < 4; k++) { const s = new THREE.SphereGeometry(0.28 - k * 0.04, 8, 6); s.translate(2.0 + k * 0.9, 1.5 + (1.2 - k * 0.22), 0); b.add(s, M.whale); } // knuckles on the back
    };
    const jaw = (b: Batch) => { // underslung lower jaw with teeth, a dark mouth gap above it
      const j = new THREE.CylinderGeometry(0.35, 0.3, 4.5, 12); j.rotateZ(Math.PI / 2); j.translate(-4.6, 0.45, 1.3); b.add(j, M.jaw);
      b.add(boxGeo(V(-6.8, 0.75, 0.9), V(-2.4, 0.95, 1.75)), M.mouth);
      for (let k = 0; k < 9; k++) { const c = new THREE.ConeGeometry(0.07, 0.22, 6); c.translate(-6.4 + k * 0.45, 0.88, 1.55); b.add(c, M.tooth); }
    };
    // intact whale (with the crates)
    whale.add(headGeo(3.0, -3.5), M.whale); whale.add(tailGeo(-1.5, 5.85, 1.8), M.whale); flukes(whale); jaw(whale);
    { const pec = new THREE.SphereGeometry(1, 10, 6); pec.scale(1.0, 0.15, 0.5); pec.rotateZ(-0.4); pec.translate(-1.2, 0.6, 1.6); whale.add(pec, M.fin); }
    // after the blast: head and tail with raw wounds, the middle third gone, a crater and burnt planks between them
    const broken = new Batch();
    broken.add(headGeo(1.2, -4.4), M.whale); jaw(broken); broken.add(tailGeo(2.3, 5.85, 1.25), M.whale); flukes(broken);
    for (const [x, r] of [[-2.4, 1.85], [2.3, 1.2]] as const) {
      const d = new THREE.CircleGeometry(r, 20); d.rotateY(x < 0 ? Math.PI / 2 : -Math.PI / 2); d.translate(x + (x < 0 ? 0.02 : -0.02), x < 0 ? 2.0 : 1.5, 0); broken.add(d, M.wound);
      const ring = new THREE.TorusGeometry(r * 0.92, r * 0.1, 6, 20); ring.rotateY(Math.PI / 2); ring.translate(x, x < 0 ? 2.0 : 1.5, 0); broken.add(ring, M.fat);
    }
    { const ring = new THREE.TorusGeometry(2.2, 0.5, 8, 24); ring.rotateX(Math.PI / 2); ring.scale(1, 1, 0.8); ring.translate(0, 0.1, 0.4); broken.add(ring, M.crater);
      const pit = new THREE.CircleGeometry(2.0, 24); pit.rotateX(-Math.PI / 2); pit.translate(0, 0.02, 0.4); broken.add(pit, M.craterIn);
      for (let k = 0; k < 7; k++) { const pl = boxGeo(V(-0.45, 0, -0.07), V(0.45, 0.05, 0.07)); pl.rotateY(hash(k, 31) * 3); pl.translate(-2.5 + hash(k, 32) * 5, 0.05, -1 + hash(k, 33) * 4); broken.add(pl, M.burnt); } }
    ground.build(R, false);
    things.build(R, true);
    whale.build(this.whale, true);
    broken.build(this.broken, true);
    for (const g of [this.whale, this.broken]) { g.position.set(...WPOS); g.rotation.y = WYAW; R.add(g); }
    // foreground richness: a near log and grass by the camera path, a red/white barricade, rope posts to the dunes
    log(-0.6, 6.4, 2.6, 0.25, 0.4); log(4.6, 5.6, 1.8, 0.16, -0.9);
    for (let i = 0; i < 70; i++) { const x = -1.5 + hash(i, 41) * 7, z = 4 + hash(i, 42) * 5, h = 0.3 + hash(i, 43) * 0.45;
      const b = new THREE.ConeGeometry(0.035, h, 3); b.rotateZ((hash(i, 44) - 0.5) * 0.8); b.translate(x, h / 2, z); things.add(b, i % 2 ? M.grass : M.grass2); }
    for (const [x, z, yaw] of [[-2.4, -1.6, 0.3]] as const) {
      const sb = new Batch();
      for (const s of [-1, 1]) for (const l of [-1, 1]) { const leg = boxGeo(V(-0.04, 0, -0.04), V(0.04, 1.0, 0.04)); leg.rotateZ(s * 0.18); leg.translate(s * 0.6, 0, l * 0.2); sb.add(leg, M.post); }
      for (let k = 0; k < 6; k++) sb.add(boxGeo(V(-0.7 + k * (1.4 / 6), 0.82, -0.03), V(-0.7 + (k + 1) * (1.4 / 6), 1.04, 0.03)), k % 2 ? M.barW : M.bar);
      const m4 = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
      const merged = new THREE.Group(); sb.build(merged, true); merged.applyMatrix4(m4); R.add(merged);
    }
    for (let k = 0; k < 6; k++) { const px = 3.5 + k * 1.6, pz = -3 - k * 1.4; things.add(boxGeo(V(px - 0.05, 0, pz - 0.05), V(px + 0.05, 1.0, pz + 0.05)), M.post);
      if (k) things.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(px - 1.6, 0.9, pz + 1.4), V(px - 0.8, 0.72, pz + 0.7), V(px, 0.9, pz)]), 10, 0.02, 4), M.rope); }
    // 3D blubber chunks (skin cap + flesh + fat rim), flying in tick()
    for (let i = 0; i < 34; i++) {
      const g = new THREE.Group(), s = 0.2 + hash(i, 51) * 0.4;
      const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.flesh); fl.scale.set(s * (0.9 + hash(i, 52) * 0.5), s * 0.7, s * (0.8 + hash(i, 53) * 0.4));
      const fat = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.fat); fat.scale.set(fl.scale.x * 0.9, fl.scale.y * 0.5, fl.scale.z * 0.9); fat.position.y = s * 0.32;
      const hide = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M.hide); hide.scale.set(fl.scale.x * 0.85, fl.scale.y * 0.35, fl.scale.z * 0.85); hide.position.y = s * 0.52;
      for (const m of [fl, fat, hide]) { m.castShadow = true; g.add(m); }
      g.visible = false; this.chunks.push(g); R.add(g);
    }
    // the sand cloud: opaque low-poly puffs rising in a column (lit cream, violet in shade, inked)
    for (let i = 0; i < 34; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), M.cloud); m.visible = false; this.puffs.push(m); R.add(m); }
    // sky backdrop with a warm low sun on the right
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(320, 150), new THREE.MeshBasicMaterial({ map: skyTex(), depthWrite: false }));
    sky.position.set(-10, 40, -110); sky.layers.set(NOINK); R.add(sky);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(4, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.8, 1.2) }));
    sun.position.set(40, 14, -105); sun.layers.set(NOINK); R.add(sun);
  }
  protected tick(_id: number, f: number) {
    this.whale.visible = f < BANG + 3; this.broken.visible = !this.whale.visible;
    this.plunger.position.y = 0.45 - 0.26 * clamp01((f - PRESS) / 3) + (f >= PRESS - 8 && f < PRESS ? 0.06 * Math.sin(((f - PRESS + 8) / 8) * Math.PI) : 0);
    const t = (f - BANG) / 30;
    this.chunks.forEach((g, i) => {
      const c = chunkAt(i, t);
      g.visible = !!c;
      if (c) { g.position.set(c.x, c.y, c.z); g.rotation.set(c.spin * 1.3, c.spin, c.spin * 0.7); }
    });
    this.puffs.forEach((m, i) => {
      if (t <= 0) { m.visible = false; return; }
      const grow = ease.out(clamp01(t / 0.7)), rise = ease.out(clamp01(t / 1.6)), fade = clamp01(1 - (t - 2.4) / 1.8);
      const R0 = (1.5 + 2.5 * hash(i, 61)) * grow * fade, a = hash(i, 62) * Math.PI * 2, d = (0.6 + 3.2 * hash(i, 63)) * grow;
      const lift = Math.max(0, t - 2.0) ** 2 * 9; // the column drifts up out of frame as it thins
      m.visible = R0 > 0.45;
      m.scale.setScalar(R0);
      m.position.set(CEN[0] + Math.cos(a) * d, 0.8 + hash(i, 64) * 18 * rise * (0.3 + 0.7 * hash(i, 65)) + lift, CEN[2] + Math.sin(a) * d * 0.7);
    });
  }
  protected stage(id: number, f: number, light: number) { return beachStage(id, f, light); }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    cam.far = 260; cam.updateProjectionMatrix();
    return r;
  }
}
/** height of the dunes at (x, z), so grass sits on them */
function duneY(x: number, z: number) {
  let y = 0;
  for (const [dx, dz, rx, ry, rz] of [[16, -8, 9, 2.6, 7], [12, -20, 11, 3.4, 8], [24, -28, 12, 4.4, 9]]) {
    const u = ((x - dx) / rx) ** 2 + ((z - dz) / rz) ** 2;
    if (u < 1) y = Math.max(y, ry * Math.sqrt(1 - u));
  }
  return y;
}

// ---------------- who stands where, effects ----------------
const TX = 0.95, TZ = 0.2; // Thornton
const thornton = (o: FrontOpts) => personAt("THORNTON", THORNTON, TX, TZ, { mode: "stand", seed: 21, ...o });
const CEN: V3 = W(-1, 1.6, 0);
/** landing spots: half of the chunks come down around Thornton, one on the detonator, the rest across the beach */
const LAND = Array.from({ length: 34 }, (_, i): [number, number] => {
  if (i === 0) return [0.42, 0.35];
  if (i < 17) { const a = hash(i, 71) * Math.PI * 2, r = 0.7 + hash(i, 72) * 3.2; return [TX + Math.cos(a) * r, TZ + Math.sin(a) * r * 0.8]; }
  return [CEN[0] + (hash(i, 73) - 0.5) * 16, CEN[2] + 2 + hash(i, 74) * 12];
});
/** ballistic flight from the blast to its landing spot; delayed starts keep the rain going to the end */
const chunkAt = (i: number, t: number) => {
  const delay = i < 17 ? 0.15 + hash(i, 75) * 1.9 : hash(i, 76) * 0.5, T = 1.1 + hash(i, 77) * 0.7, u = t - delay;
  if (u <= 0) return null;
  const [lx, lz] = LAND[i], ly = i === 0 ? 0.62 : 0.15, g = 9.8;
  if (u >= T) return { x: lx, y: ly, z: lz, spin: hash(i, 78) * 6, landed: true };
  const vx = (lx - CEN[0]) / T, vz = (lz - CEN[2]) / T, vy = (ly - CEN[1] + 0.5 * g * T * T) / T;
  return { x: CEN[0] + vx * u, y: CEN[1] + vy * u - 0.5 * g * u * u, z: CEN[2] + vz * u, spin: hash(i, 78) * 6 + u * 9, landed: false };
};
const splat = (p: Pen) => {
  p.poly(Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2, r = 90 + 30 * Math.sin(k * 2.3); return [128 + r * Math.cos(a), 128 + r * Math.sin(a)] as [number, number]; }), "#b9655a", 0);
};

export const beachStage = (id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  // Thornton: proud -> thumbs up -> presses (wind-up, strike) -> shock -> staring up
  let o: FrontOpts;
  if (f < 92) o = { expr: "smile", arms: ["hip", "hang"], look: -0.4 };
  else if (f < PRESS - 6) o = { expr: "grin", arms: ["hip", "thumb"], look: 0 };
  else if (f < BANG) o = { expr: "grin", arms: ["reach", "reach"], reachLift: f < PRESS ? 0.6 : 0, look: -0.3, tilt: f < PRESS ? -2 : 3 };
  else if (f < 215) o = { expr: "shock", arms: ["up", "up"], look: -0.5 };
  else o = { expr: "nervous", arms: ["hang", "hang"], look: 0.2, headTilt: -6 };
  out.places.push(thornton({ ...o, light, blink: ((f + 7) % 70) < 3 }));
  contact(out, TX, 0, TZ, 0.9);
  // the plunger handle (up, then pushed down on PRESS)

  // spectators far away on the dune crest, cheering, then ducking
  for (let i = 0; i < 9; i++) {
    const x = 10.5 + i * 0.9, z = -15 - (i % 3) * 0.6, panic = f >= BANG + 20;
    out.places.push({ ...personAt("crowd" + i, crowd(i + 1), x, z, { mode: "stand", seed: 70 + i, light, expr: panic ? "shock" : f >= BANG ? "laugh" : "neutral",
      arms: panic ? ["up", "up"] : f >= BANG ? ["up", "wave"] : ["hang", "hang"], look: -0.6 }), y: duneY(x, z) - 0.05 });
  }
  for (let i = 0; i < 3; i++) {
    const x = 5.2 + i * 1.1, z = -6.5 - i * 0.9, duck = f >= BANG + 26;
    out.places.push(personAt("near" + i, crowd(i + 11), x, z, { mode: "stand", seed: 90 + i, light, expr: duck ? "shock" : f >= BANG ? "grin" : "neutral",
      arms: duck ? ["up", "up"] : f >= BANG ? ["wave", "up"] : ["hang", "hip"], look: -0.7 }));
    contact(out, x, 0, z, 0.8);
  }
  // gulls circling high over the whale until the blast scares them off
  for (let i = 0; i < 5; i++) {
    const a = f * 0.02 + i * 1.3, gone = f > BANG ? (f - BANG) * 0.15 : 0, fl = Math.round((0.5 + 0.5 * Math.sin(f * 0.35 + i)) * 4) / 4;
    card(out, "gull" + fl, 300, 240, drawGull({ flap: fl }), CEN[0] + 4 * Math.cos(a) + gone * (i % 2 ? 1 : -1), 7 + i * 0.8 + gone * 0.6, CEN[2] - 2 + 3 * Math.sin(a), 0.9);
  }
  if (f >= BANG) {
    const t = (f - BANG) / 30;
    // the boom star
    if (f < BANG + 18) { const k = clamp01((f - BANG) / 18); card(out, "boom" + Math.round(k * 10), 600, 600, drawBoom(k), CEN[0], CEN[1] + 1.5, CEN[2] + 1.5, 7 + 7 * ease.out(k)); }
    // a splat on the sand where each chunk lands
    for (let i = 0; i < 34; i++) { const c = chunkAt(i, t); if (c?.landed && i !== 0) flatCard(out, "splat", 256, 256, splat, c.x, 0.015, c.z, 0.8 + hash(i, 79) * 0.5, hash(i, 80) * 6); }
    // the scorched patch left behind
    flatCard(out, "scorch", 512, 512, scorch, CEN[0], 0.02, CEN[2], 9 * clamp01(t * 3));
  } else {
    // the whale's X eye
    const e = W(-WLEN / 2 + 2.2, 2.35, 1.95);
    card(out, "xeye", 128, 128, xEye, e[0], e[1], e[2], 0.7);
  }
  return out;
};
