// Shot 2: the cave in the New Mexico desert at dusk. Lytle stands by his car, millions of bats pour out of the cave
// mouth in a ribbon into the evening sky. Open-air set: sand floor, layered red mesa (extruded silhouettes) with the
// cave mouth, far mesas, painted dusk sky + sun on a backdrop, cacti and rocks, Lytle's 1940s car.
// World units are metres; the mesa face is at z = -12, the camera looks roughly toward -z.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { Pen, FrontOpts } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, personAt, contact, card, V3 } from "./broom";
import { LYTLE, drawLytle } from "./bcast";
import { BEAT } from "../bats/timing";

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  2: { keys: [{ f: 164, pos: [2.0, 1.25, 4.6], look: [-1.4, 2.6, -10], fov: 46 },
    { f: BEAT.millionen - 12, pos: [1.1, 1.4, 3.3], look: [0.0, 1.45, -1.5], fov: 40 }], creep: 0.0009, punch: [BEAT.millionen], cInf: [5, 15], drift: [0.1, 0.03, 0.25] },
};
export const desertCam = camOf(CAMS);
export const desertDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const skyTex = () => ctex("desertSky", 1024, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#36306e"); gr.addColorStop(0.38, "#8a4f86"); gr.addColorStop(0.62, "#e8826a"); gr.addColorStop(0.82, "#ffc488"); gr.addColorStop(1, "#ffe2b0");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = "rgba(255,214,190,0.55)";
  for (const [x, y, w] of [[160, 420, 260], [620, 360, 320], [820, 520, 200], [300, 560, 180]]) { g.beginPath(); g.ellipse(x, y, w, 26, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 60; i++) { g.beginPath(); g.arc((i * 397) % 1024, (i * 211) % 300, 1.5 + (i % 3), 0, Math.PI * 2); g.fill(); }
});
export const sandTex = () => ctex("desertSand", 512, 512, (g, r) => {
  g.fillStyle = "#d9a467"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,70,30,0.10)" : "rgba(255,230,180,0.14)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 6, 1 + r() * 2); }
  g.strokeStyle = "rgba(150,90,40,0.18)"; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { g.beginPath(); const y = r() * 512; g.moveTo(0, y); g.bezierCurveTo(170, y - 20, 340, y + 20, 512, y); g.stroke(); }
});
const rockTex = () => ctex("desertRock", 512, 512, (g, r) => {
  const cols = ["#c46a48", "#b85d40", "#d27c55", "#a9513a", "#c97350"];
  for (let y = 0, i = 0; y < 512; i++) { const h = 18 + r() * 40; g.fillStyle = cols[i % cols.length]; g.fillRect(0, y, 512, h); y += h; }
  g.strokeStyle = "rgba(60,20,20,0.35)"; g.lineWidth = 3;
  for (let i = 0; i < 40; i++) { g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 30, y + 20 + r() * 50); g.stroke(); }
});
const caveTex = () => ctex("desertCave", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 140, 10, 128, 128, 128);
  gr.addColorStop(0, "#000000"); gr.addColorStop(0.7, "#120a18"); gr.addColorStop(1, "rgba(18,10,24,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});

/** a mesa: a silhouette in x/y extruded toward -z by `depth`, front face at z */
export const mesa = (pts: [number, number][], z: number, depth: number) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  // ExtrudeGeometry (three r175) leaves its caps empty for these outlines, so the front face is a ShapeGeometry and the
  // extrusion only supplies the sides (the top seen from above)
  const sides = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).toNonIndexed();
  sides.translate(0, 0, z - depth);
  const front = new THREE.ShapeGeometry(s).toNonIndexed();
  front.translate(0, 0, z);
  const g = mergeGeometries([front, sides].map((x) => { x.deleteAttribute("uv"); x.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; }))!;
  // planar UVs in metres on the front (x, y)
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 6, p.getY(i) / 6);
  return g;
};

// ---------------- the set ----------------
export const CAVE: V3 = [-0.6, 2.3, -11.9];

export class DesertWorld extends RoomWorld {
  constructor() {
    super(desertCam);
    this.dust = false;
    const R = this.root;
    const ground = new Batch(), things = new Batch();
    const M = {
      sand: lam("desSand", () => ({ map: sandTex() })),
      rock: lam("desRock2", () => ({ map: rockTex(), side: THREE.DoubleSide })),
      far: lam("desFar2b", () => ({ color: "#9a5a70", side: THREE.DoubleSide })),
      far2: lam("desFar3", () => ({ color: "#b8667a", side: THREE.DoubleSide })),
      cactus: lam("desCactus", () => ({ color: "#5f8a3a" })),
      stone: lam("desStone", () => ({ color: "#b07a4a" })),
      car: lam("desCar", () => ({ color: "#3c6a8a" })),
      glass: lam("desGlass", () => ({ color: "#bfe2f5" })),
      tyre: lam("desTyre", () => ({ color: "#26262e" })),
      chrome: lam("desChrome", () => ({ color: "#d8dce4" })),
    };
    // sand floor
    const floor = new THREE.PlaneGeometry(80, 60); floor.rotateX(-Math.PI / 2); floor.translate(0, 0, -10);
    const fuv = floor.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 20, fuv.getY(i) * 15);
    ground.add(floor, M.sand);
    // the cave mesa (front face z = -12) and two side shoulders
    things.add(mesa([[-9, 0], [-8, 3.2], [-6.2, 4.4], [-3.5, 5.1], [-1.2, 5.4], [1.4, 5.0], [3.8, 4.2], [6, 3.0], [7.5, 0]], -12, 6), M.rock);
    things.add(mesa([[-16, 0], [-15, 2.2], [-12, 2.8], [-9.5, 2.0], [-9, 0]], -13, 5), M.rock);
    things.add(mesa([[7, 0], [8.5, 2.5], [11, 3.4], [14, 2.6], [16, 0]], -14, 5), M.rock);
    // far mesas (flat colour, stacked layers for depth)
    things.add(mesa([[-40, 0], [-30, 4], [-24, 4.2], [-22, 2.5], [-10, 2.6], [-6, 6], [4, 6.2], [8, 3], [24, 3.4], [30, 5.5], [40, 5], [40, 0]], -32, 2), M.far);
    things.add(mesa([[-50, 0], [-40, 8], [-28, 8.5], [-20, 5], [20, 5.5], [34, 9], [50, 8], [50, 0]], -46, 2), M.far2);
    // cacti and rocks
    const cactus = (x: number, z: number, h: number) => {
      const c = new THREE.CylinderGeometry(0.16 * h, 0.18 * h, h, 12); c.translate(x, h / 2, z); things.add(c, M.cactus);
      for (const [s, y0, len] of [[-1, 0.45, 0.35], [1, 0.62, 0.3]] as const) {
        const a = new THREE.CylinderGeometry(0.1 * h, 0.1 * h, 0.22 * h, 10); a.rotateZ(Math.PI / 2); a.translate(x + s * 0.24 * h, y0 * h, z); things.add(a, M.cactus);
        const b = new THREE.CylinderGeometry(0.1 * h, 0.1 * h, len * h, 10); b.translate(x + s * 0.34 * h, (y0 + len / 2) * h, z); things.add(b, M.cactus);
      }
    };
    cactus(-3.4, -3.5, 1.6); cactus(4.8, -6, 2.2); cactus(-6.5, -8, 1.9); cactus(3.6, 0.6, 1.1);
    for (const [x, z, r] of [[-1.8, -1.5, 0.35], [3.2, -2.4, 0.5], [-4.6, 0.8, 0.6], [1.0, -7, 0.8], [-2.5, -9.5, 0.7]] as const) {
      const s = new THREE.DodecahedronGeometry(r, 0); s.scale(1.3, 0.7, 1); s.translate(x, r * 0.45, z); things.add(s, M.stone);
    }
    // Lytle's car (1940s coupe from simple boxes), parked to the left behind him
    const CX = -2.6, CZ = -1.2;
    things.add(boxGeo(V(CX - 1.0, 0.35, CZ - 2.1), V(CX + 1.0, 0.95, CZ + 2.1)), M.car);
    things.add(boxGeo(V(CX - 0.85, 0.95, CZ - 0.9), V(CX + 0.85, 1.5, CZ + 0.8)), M.car);
    things.add(boxGeo(V(CX - 0.86, 1.02, CZ - 0.8), V(CX + 0.86, 1.42, CZ + 0.7)), M.glass);
    things.add(boxGeo(V(CX - 1.02, 0.4, CZ + 2.05), V(CX + 1.02, 0.55, CZ + 2.15)), M.chrome);
    for (const [dx, dz] of [[-0.95, -1.4], [0.95, -1.4], [-0.95, 1.4], [0.95, 1.4]]) {
      const w = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 18); w.rotateZ(Math.PI / 2); w.translate(CX + dx, 0.38, CZ + dz); things.add(w, M.tyre);
    }
    // sky backdrop with the low sun (HDR disc for bloom) and the cave mouth darkness on the mesa face
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), new THREE.MeshBasicMaterial({ map: skyTex(), depthWrite: false }));
    sky.position.set(0, 26, -52); sky.layers.set(NOINK); R.add(sky);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.1) }));
    sun.position.set(12, 7, -50); sun.layers.set(NOINK); R.add(sun);
    const cave = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: caveTex(), transparent: true }));
    cave.scale.set(2.3, 1.75, 1); cave.position.set(CAVE[0], CAVE[1], CAVE[2]); R.add(cave);
    const hole = new THREE.CircleGeometry(1, 40); hole.scale(1.75, 1.3, 1); hole.translate(CAVE[0], CAVE[1] - 0.15, CAVE[2] + 0.02);
    things.add(hole, lam("desHole", () => ({ color: "#140a18" })));
    ground.build(R, false);
    things.build(R, true);
  }
  protected stage(id: number, f: number, light: number) { return desertStage(id, f, light); }
  /** open air: see past the rooms' 60 m far plane, to the far mesas and the sky backdrop */
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    cam.far = 220; cam.updateProjectionMatrix();
    return r;
  }
}

// ---------------- the swarm ----------------
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** small flying bat silhouette on a 128 x 64 canvas, wing phase 0..3 */
const fxMiniBat = (ph: number) => (p: Pen) => {
  const up = [-18, -6, 6, -10][ph];
  p.poly([[64, 30], [40, 22 + up * 0.5], [6, 20 + up], [26, 34], [44, 36], [56, 46], [64, 40], [72, 46], [84, 36], [102, 34], [122, 20 + up], [88, 22 + up * 0.5]], "#24172e", 0);
  p.ell(64, 34, 9, 10, "#24172e", 0);
  p.poly([[58, 26], [56, 14], [63, 24], [65, 24], [72, 14], [70, 26]], "#24172e", 0);
};
const swarm = (out: Stage, f: number, n: number) => {
  const t = f - 164;
  for (let i = 0; i < n; i++) {
    const speed = 0.0035 + 0.003 * hash(i, 1), u = (hash(i, 2) + t * speed) % 1;
    // out of the mouth, a rising ribbon curving up and to the right, widening as it climbs
    const wob = Math.sin(u * 9 + i) * (0.3 + u * 2.2), spread = (hash(i, 3) - 0.5) * (0.6 + u * 7);
    const x = CAVE[0] + u * 14 + spread + wob * 0.4, y = CAVE[1] + u * u * 26 + (hash(i, 4) - 0.5) * (0.4 + u * 3), z = CAVE[2] + 0.5 + u * 6 + (hash(i, 5) - 0.5) * 3;
    const ph = Math.floor((f * 0.9 + i * 1.7) % 4);
    card(out, "minibat" + ph, 128, 64, fxMiniBat(ph), x, y, z, 0.42 + 0.25 * hash(i, 6));
  }
};

// ---------------- who stands where ----------------
const lytle = (x: number, z: number, o: FrontOpts) => personAt("LYTLE", LYTLE, x, z, o, drawLytle);

export const desertStage = (id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (id === 2) {
    const close = f >= BEAT.millionen - 12;
    out.places.push(lytle(0.15, 0, { mode: "stand", expr: close ? "shock" : "neutral", look: -0.6, headTilt: close ? -4 : -2, light, facing: close ? 0 : -1 }));
    contact(out, 0.15, 0, 0, 0.9);
    swarm(out, f, close ? 60 : 260);
  }
  return out;
};
