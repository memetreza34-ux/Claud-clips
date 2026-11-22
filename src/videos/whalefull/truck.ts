// The truck set of the whale short (shot 6): a sandy access road between grassy dunes behind the beach, the orange
// 1970s highway department dump truck (cab, hood, chrome grille and bumper, dump bed, tandem wheels) parked diagonally
// in depth, crates of dynamite at its tail, cones and red/white sawhorses, a sand fence, telegraph poles, and through a
// gap in the dunes the sea with the whale lying far away. The veteran stands in front of the truck and holds up ONE
// stick; Thornton strolls past behind him, whistling. World units are metres, the camera looks toward -z.
import * as THREE from "three";
import { Batch, Kit, boxGeo, V, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { Pen, FrontOpts, ArmPose, bodyFront, bodySide } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, personAt, contact, V3 } from "./room";
import { THORNTON, VET } from "../whale/draw";
import { A, beat } from "./shots";

const MILI = beat(6, "Militär"), WARN = beat(6, "warnt"), ZW = beat(6, "Zwanzig"), REICH = beat(6, "reichen");
const UP = ZW - 3; // the stick is up 3 frames before "Zwanzig"

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  6: {
    keys: [
      // the place: the veteran left of centre, the truck's nose behind him on the right, the dune gap and the sea left
      { f: A(6), pos: [0.35, 1.45, 5.6], look: [-0.15, 1.3, -1.5], fov: 46 },
      // "Militär": a quick push
      { f: MILI - 2, dur: 9, pos: [0.4, 1.45, 4.0], look: [0.08, 1.36, -1], fov: 42 },
      // "Zwanzig": fast push onto his face and the one stick
      { f: UP - 2, dur: 11, pos: [0.62, 1.5, 1.9], look: [0.4, 1.44, 0], fov: 39 },
    ],
    creep: 0.0012, punch: [REICH], cInf: [3.5, 4.5, 6], drift: [0.05, 0.015, 0.12],
  },
};
export const truckCam = camOf(CAMS);
export const truckDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const sandTex = () => ctex("tkSand", 1024, 1024, (g, r) => {
  g.fillStyle = "#ecc690"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2800; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,118,70,0.13)" : "rgba(255,242,208,0.2)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 7, 1 + r() * 3); }
  g.strokeStyle = "rgba(176,128,78,0.22)"; g.lineWidth = 4;
  for (let i = 0; i < 22; i++) { const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 10 * Math.sin(x / 90 + i)); g.stroke(); }
  for (let i = 0; i < 60; i++) {
    const x = r() * 1024, y = r() * 1024, s = 4 + r() * 8;
    g.fillStyle = ["#f6e7d4", "#e3b9a0", "#c9b8a8", "#8f8a88"][i % 4]; g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(60,40,40,0.45)"; g.lineWidth = 1.5; g.stroke();
  }
});
/** packed sand road: darker, two tyre ruts with tread marks along v, soft edges */
const roadTex = () => ctex("tkRoad", 512, 1024, (g, r) => {
  g.fillStyle = "#d9ad74"; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,94,56,0.16)" : "rgba(250,230,190,0.18)"; g.fillRect(r() * 512, r() * 1024, 2 + r() * 6, 1 + r() * 4); }
  for (const cx of [140, 372]) {
    g.fillStyle = "rgba(150,100,60,0.45)"; g.fillRect(cx - 40, 0, 80, 1024);
    g.strokeStyle = "rgba(110,70,44,0.5)"; g.lineWidth = 5;
    for (let y = 0; y < 1024; y += 22) { g.beginPath(); g.moveTo(cx - 34, y); g.lineTo(cx, y + 9); g.lineTo(cx + 34, y); g.stroke(); }
  }
  const e = g.createLinearGradient(0, 0, 512, 0);
  e.addColorStop(0, "rgba(236,198,144,1)"); e.addColorStop(0.1, "rgba(236,198,144,0)"); e.addColorStop(0.9, "rgba(236,198,144,0)"); e.addColorStop(1, "rgba(236,198,144,1)");
  g.fillStyle = e; g.fillRect(0, 0, 512, 1024);
});
const skyTex = () => ctex("tkSky", 1024, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#3d7fd6"); gr.addColorStop(0.45, "#7ab0e6"); gr.addColorStop(0.78, "#f2c99c"); gr.addColorStop(1, "#ffdcae");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  const cloud = (cx: number, cy: number, s: number) => {
    for (let i = 0; i < 9; i++) {
      const x = cx + (i - 4) * 34 * s + (r() - 0.5) * 20 * s, y = cy - Math.sin((i / 8) * Math.PI) * 42 * s, rr = (38 + r() * 24) * s;
      g.fillStyle = "#c9b8d8"; g.beginPath(); g.arc(x - 6 * s, y + 8 * s, rr, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff7ee"; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
    }
  };
  cloud(230, 520, 0.75); cloud(700, 480, 0.65); cloud(470, 600, 0.45); cloud(940, 590, 0.5);
});
const seaTex = () => ctex("tkSea", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#2f9fc4"); gr.addColorStop(0.6, "#43b7cc"); gr.addColorStop(1, "#7ad8d4");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 140; i++) {
    const x = r() * 1024, y = r() * 512, w = 20 + r() * 70;
    g.strokeStyle = r() < 0.6 ? "rgba(255,255,255,0.6)" : "rgba(14,60,110,0.35)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
/** cab door: orange with ink seams, a handle slot, a white stripe and a round state-seal emblem (no lettering) */
const doorTex = () => ctex("tkDoor", 512, 512, (g) => {
  g.fillStyle = "#f07a1e"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#fbf3e2"; g.fillRect(0, 330, 512, 34);
  g.strokeStyle = "#5a2a1a"; g.lineWidth = 7; g.strokeRect(30, 8, 452, 496);
  g.fillStyle = "#4a3030"; g.fillRect(380, 270, 70, 16);
  g.fillStyle = "#fbf3e2"; g.beginPath(); g.arc(220, 170, 82, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#2f5f3a"; g.lineWidth = 10; g.stroke();
  g.fillStyle = "#2f7a46"; g.beginPath(); g.moveTo(220, 104); g.lineTo(270, 212); g.lineTo(170, 212); g.closePath(); g.fill();
  g.fillStyle = "#2f6fb5"; g.fillRect(160, 214, 120, 14);
});
/** windscreen: deep blue glass with a sky reflection and two white glints */
const glassTex = () => ctex("tkGlass", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#9cc6ec"); gr.addColorStop(0.5, "#3f6fa8"); gr.addColorStop(1, "#2a3f6e");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.beginPath(); g.moveTo(40, 0); g.lineTo(90, 0); g.lineTo(30, 256); g.lineTo(-20, 256); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(120, 0); g.lineTo(138, 0); g.lineTo(78, 256); g.lineTo(60, 256); g.closePath(); g.fill();
});
/** chrome grille: vertical bars in a bright frame */
const grilleTex = () => ctex("tkGrille", 256, 256, (g) => {
  g.fillStyle = "#3a3440"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12; i++) { const x = 8 + i * 20.5; g.fillStyle = "#e8edf2"; g.fillRect(x, 6, 10, 244); g.fillStyle = "#9aa2ad"; g.fillRect(x + 7, 6, 3, 244); }
  g.strokeStyle = "#e8edf2"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 246);
});
/** dump bed side: orange plate with vertical ribs and rusty scuffs */
const bedTex = () => ctex("tkBed", 512, 256, (g, r) => {
  g.fillStyle = "#e86f1a"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 7; i++) { const x = 30 + i * 75; g.fillStyle = "#b8521a"; g.fillRect(x, 0, 6, 256); g.fillStyle = "#ffa04a"; g.fillRect(x + 6, 0, 3, 256); }
  g.fillStyle = "#b8521a"; g.fillRect(0, 0, 512, 16); g.fillRect(0, 240, 512, 16);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,60,30,0.25)"; g.fillRect(r() * 512, 160 + r() * 90, 6 + r() * 30, 2 + r() * 4); }
});
const crateTex = () => ctex("tkCrate", 256, 256, (g) => {
  g.fillStyle = "#c48f55"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#7d5530"; g.lineWidth = 8; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  g.lineWidth = 10; g.strokeRect(5, 5, 246, 246);
  g.fillStyle = "#f3e2b0"; g.beginPath(); g.arc(128, 128, 44, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#d9342b"; g.lineWidth = 12; g.beginPath(); g.moveTo(104, 104); g.lineTo(152, 152); g.moveTo(152, 104); g.lineTo(104, 152); g.stroke();
});
const whaleTex = () => ctex("tkWhale", 512, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#74819a"); gr.addColorStop(0.6, "#8390a8"); gr.addColorStop(0.75, "#c4ccd8"); gr.addColorStop(1, "#dfe4ec");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
});

// ---------------- helpers ----------------
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** silhouette in x/y extruded toward -z, front face at z */
const ridge = (pts: [number, number][], z: number, depth: number) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, z - depth);
  return g;
};
/** dunes: [x, z, rx, ry, rz]; a gap on the left lets the sea and the whale through */
const DUNES: [number, number, number, number, number][] = [
  [-9, -9, 6, 2.4, 5], [-14, -18, 8, 3.6, 6], [10, -10, 5, 2.4, 4], [17, -24, 9, 4.4, 7], [-4, -24, 5, 2.4, 4],
  [-9, -36, 9, 3.2, 5], [-20, -30, 10, 3.2, 6], [10.5, 3, 4, 1.4, 3.5], [-8, 4, 3.2, 1.0, 2.5], [1.5, -38, 2.6, 0.9, 2],
];
const duneY = (x: number, z: number) => {
  let y = 0;
  for (const [dx, dz, rx, ry, rz] of DUNES) { const u = ((x - dx) / rx) ** 2 + ((z - dz) / rz) ** 2; if (u < 1) y = Math.max(y, ry * Math.sqrt(1 - u)); }
  return y;
};
/** road centre line x at depth z: from the near right, past the truck, curving away into the dunes */
const ROAD = (z: number) => 1.6 + 0.07 * z + 0.004 * z * z;

// truck placement: built along local +x (nose), turned so the nose points to the camera's left-front
const TPOS: V3 = [-1.7, 0, -7.0], TYAW = -1.93;

// ---------------- the world ----------------
export class TruckWorld extends RoomWorld {
  private beacon = new THREE.Mesh();
  constructor(_kit: Kit) {
    super(truckCam);
    this.dust = false;
    const R = this.root;
    const ground = new Batch(), things = new Batch(), truck = new Batch();
    const M = {
      sand: lam("tkSand", () => ({ map: sandTex() })),
      road: lam("tkRoad", () => ({ map: roadTex(), side: THREE.DoubleSide })),
      dune: lam("tkDune", () => ({ color: "#e8c48c" })),
      grass: lam("tkGrass", () => ({ color: "#86a948", side: THREE.DoubleSide })),
      grass2: lam("tkGrass2", () => ({ color: "#a7c25a", side: THREE.DoubleSide })),
      grass3: lam("tkGrass3", () => ({ color: "#6f9440", side: THREE.DoubleSide })),
      far: lam("tkFar", () => ({ color: "#5b7f6a", side: THREE.DoubleSide })),
      tree: lam("tkTree", () => ({ color: "#2f6b45" })),
      orange: lam("tkOrange", () => ({ color: "#f07a1e" })),
      orange2: lam("tkOrange2", () => ({ color: "#d9631a" })),
      door: lam("tkDoorM", () => ({ map: doorTex() })),
      bed: lam("tkBedM", () => ({ map: bedTex() })),
      glass: lam("tkGlassM", () => ({ map: glassTex() })),
      grille: lam("tkGrilleM", () => ({ map: grilleTex() })),
      chrome: lam("tkChrome", () => ({ color: "#dfe5ec" })),
      trim: lam("tkTrim", () => ({ color: "#3d3746" })),
      tyre: lam("tkTyre", () => ({ color: "#35313c" })),
      hub: lam("tkHub", () => ({ color: "#f3eee2" })),
      lamp: lam("tkLamp", () => ({ color: "#fff4c8" })),
      amber: lam("tkAmber", () => ({ color: "#ffb02a" })),
      red: lam("tkRedL", () => ({ color: "#d9342b" })),
      cone: lam("tkCone", () => ({ color: "#ff6a1a" })),
      coneW: lam("tkConeW", () => ({ color: "#f7f2e8" })),
      bar: lam("tkBar", () => ({ color: "#d9342b" })),
      barW: lam("tkBarW", () => ({ color: "#f5efe4" })),
      post: lam("tkPost", () => ({ color: "#8a6440" })),
      slat: lam("tkSlat", () => ({ color: "#b08860" })),
      wire: lam("tkWire", () => ({ color: "#3a3440" })),
      crate: lam("tkCrateM", () => ({ map: crateTex() })),
      stick: lam("tkStick", () => ({ color: "#d9342b" })),
      whale: lam("tkWhaleM", () => ({ map: whaleTex() })),
      rock: lam("tkRock", () => ({ color: "#7d7a86" })),
      wood: lam("tkWood", () => ({ color: "#a98463" })),
      sea: lam("tkSeaM", () => ({ map: seaTex() })),
    };

    // ground: sand everywhere, the road ribbon on top
    const floor = new THREE.PlaneGeometry(160, 120); floor.rotateX(-Math.PI / 2); floor.translate(0, 0, -40);
    { const uv = floor.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 16, uv.getY(i) * 12); }
    ground.add(floor, M.sand);
    {
      const pos: number[] = [], uvs: number[] = [], W = 2.6, N = 40, z0 = 10, z1 = -46;
      for (let i = 0; i <= N; i++) {
        const z = z0 + ((z1 - z0) * i) / N, x = ROAD(z), dx = ROAD(z - 0.5) - ROAD(z + 0.5), l = Math.hypot(dx, 1);
        const nx = 1 / l, nz = dx / l; // right of the travel direction (toward -z)
        pos.push(x - nx * W, 0.012, z - nz * W, x + nx * W, 0.012, z + nz * W);
        uvs.push(0, (z0 - z) / 5, 1, (z0 - z) / 5);
      }
      const idx: number[] = []; for (let i = 0; i < N; i++) { const a = 2 * i; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(idx); g.computeVertexNormals();
      ground.add(g, M.road);
    }

    // the sea through the dune gap, foam lines along the shore
    const sea = new THREE.PlaneGeometry(400, 170); sea.rotateX(-Math.PI / 2); sea.translate(-20, 0.03, -133);
    { const uv = sea.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 12, uv.getY(i) * 2); }
    ground.add(sea, M.sea);
    { const foam = new THREE.PlaneGeometry(200, 0.6); foam.rotateX(-Math.PI / 2); foam.translate(-20, 0.05, -48.2); ground.add(foam, M.coneW);
      const foam2 = new THREE.PlaneGeometry(200, 0.35); foam2.rotateX(-Math.PI / 2); foam2.translate(-20, 0.05, -51); ground.add(foam2, M.coneW); }

    // the whale, far away on the beach: a dark grey body with a fluke, diagonal
    {
      const wb = new Batch();
      const body = new THREE.CapsuleGeometry(1.9, 8, 6, 14); body.rotateZ(Math.PI / 2); body.scale(1, 1, 0.9); body.translate(0, 1.8, 0); wb.add(body, M.whale);
      const tail = new THREE.CylinderGeometry(1.4, 0.3, 5, 12); tail.rotateZ(Math.PI / 2); tail.translate(7.5, 1.3, 0); wb.add(tail, M.whale);
      const fl = new THREE.Shape([[0, 0], [1.2, 1.8], [2.1, 1.7], [1.5, 0], [2.1, -1.7], [1.2, -1.8]].map(([x, y]) => new THREE.Vector2(x, y)));
      const fg = new THREE.ExtrudeGeometry(fl, { depth: 0.2, bevelEnabled: false }); fg.rotateX(Math.PI / 2); fg.translate(9.8, 0.4, 0); wb.add(fg, M.whale);
      const grp = new THREE.Group(); wb.build(grp, false); grp.position.set(7, 0, -46); grp.rotation.y = 0.64; grp.scale.setScalar(0.6); R.add(grp);
    }
    // far headland on the left, hills on the right, conifers on both
    things.add(ridge([[-80, 0], [-70, 7], [-56, 12], [-40, 15], [-28, 12], [-20, 6], [-16, 0]], -70, 10), M.far);
    for (let i = 0; i < 40; i++) {
      const x = -78 + i * 1.5 + hash(i, 1), top = Math.max(0, 15 - Math.abs(x + 40) * 0.36), h = 3 + hash(i, 2) * 3;
      if (x > -18 || top < 1) continue;
      const c = new THREE.ConeGeometry(0.9 + hash(i, 4) * 0.5, h, 7); c.translate(x, top + h / 2 - 0.6, -71 - hash(i, 3) * 6); things.add(c, M.tree);
    }

    // dunes with beach grass tufts
    for (const [x, z, rx, ry, rz] of DUNES) {
      const d = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2); d.scale(rx, ry, rz); d.translate(x, 0, z); things.add(d, M.dune);
    }
    const tuft = (x: number, z: number, s: number, seed: number) => {
      const y0 = duneY(x, z);
      for (let k = 0; k < 7; k++) {
        const h = (0.35 + hash(seed, k) * 0.55) * s, b = new THREE.ConeGeometry(0.035 * s, h, 3);
        b.rotateZ((hash(seed, k + 9) - 0.5) * 0.9); b.rotateY(hash(seed, k + 20) * 6);
        b.translate(x + (hash(seed, k + 30) - 0.5) * 0.3 * s, y0 + h / 2 - 0.03, z + (hash(seed, k + 40) - 0.5) * 0.3 * s);
        things.add(b, [M.grass, M.grass2, M.grass3][k % 3]);
      }
    };
    for (let i = 0; i < 420; i++) {
      const x = -24 + hash(i, 11) * 46, z = 8 - hash(i, 12) * 44;
      if (Math.abs(x - ROAD(z)) < 3.2) continue; // keep the road clear
      if (duneY(x, z) < 0.05 && hash(i, 13) < 0.55) continue; // fewer tufts on the flat
      tuft(x, z, 0.8 + hash(i, 14) * 0.7, i);
    }
    // foreground tufts at the camera's feet, both road edges
    for (let i = 0; i < 18; i++) tuft(-1.9 + hash(i, 15) * 1.2 - (i % 2) * 0.6, 1.2 + hash(i, 16) * 2.6, 0.55 + hash(i, 17) * 0.3, 500 + i);
    for (let i = 0; i < 10; i++) tuft(2.4 + hash(i, 18) * 1.5, 0.5 + hash(i, 19) * 3, 0.6, 600 + i);
    // rocks and a bit of driftwood along the road
    for (let i = 0; i < 16; i++) { const z = 4 - hash(i, 21) * 30, s = new THREE.DodecahedronGeometry(0.08 + hash(i, 22) * 0.2, 0); s.scale(1.3, 0.6, 1);
      s.translate(ROAD(z) + (hash(i, 23) < 0.5 ? -1 : 1) * (2.8 + hash(i, 24) * 1.2), 0.05, z); things.add(s, M.rock); }
    { const lg = new THREE.CylinderGeometry(0.12, 0.1, 2.0, 8); lg.rotateZ(Math.PI / 2); lg.rotateY(0.5); lg.translate(-2.2, 0.1, -1.6); things.add(lg, M.wood); }

    // sand fence along the left dune: slats wired together
    for (let k = 0; k < 46; k++) {
      const t = k / 45, x = -2.6 - t * 7.5, z = -2.5 - t * 9, y0 = duneY(x, z);
      const sl = boxGeo(V(-0.025, 0, -0.008), V(0.025, 1.0 + 0.1 * hash(k, 31), 0.008)); sl.rotateY(-0.7); sl.rotateZ(0.06 * (hash(k, 32) - 0.5)); sl.translate(x, y0 - 0.05, z);
      things.add(sl, k % 9 === 0 ? M.post : M.slat);
    }
    for (const y of [0.25, 0.8]) {
      const pts: THREE.Vector3[] = []; for (let k = 0; k <= 12; k++) { const t = k / 12, x = -2.6 - t * 7.5, z = -2.5 - t * 9; pts.push(V(x, duneY(x, z) + y, z)); }
      things.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.01, 4), M.wire);
    }
    // telegraph poles along the far side of the road, receding, with sagging wires
    const poles: THREE.Vector3[] = [];
    for (let k = 0; k < 6; k++) {
      const z = -8 - k * 8, x = ROAD(z) + 4.2, h = 6.5;
      const p = new THREE.CylinderGeometry(0.11, 0.14, h, 7); p.translate(x, h / 2, z); things.add(p, M.post);
      things.add(boxGeo(V(x - 0.8, h - 0.7, z - 0.06), V(x + 0.8, h - 0.55, z + 0.06)), M.post);
      poles.push(V(x, h - 0.5, z));
    }
    for (const dx of [-0.65, 0.65]) for (let k = 0; k + 1 < poles.length; k++) {
      const a = poles[k].clone().add(V(dx, 0, 0)), b = poles[k + 1].clone().add(V(dx, 0, 0)), m = a.clone().lerp(b, 0.5).add(V(0, -0.5, 0));
      things.add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 12, 0.015, 4), M.wire);
    }

    // traffic cones: orange cone, white band, square base
    const cone = (x: number, z: number, s = 1) => {
      things.add(boxGeo(V(x - 0.2 * s, 0, z - 0.2 * s), V(x + 0.2 * s, 0.05 * s, z + 0.2 * s)), M.cone);
      const c = new THREE.ConeGeometry(0.14 * s, 0.62 * s, 14); c.translate(x, 0.05 * s + 0.31 * s, z); things.add(c, M.cone);
      const band = new THREE.CylinderGeometry(0.088 * s, 0.106 * s, 0.11 * s, 14, 1, true); band.translate(x, 0.05 * s + 0.31 * s, z); things.add(band, M.coneW);
    };
    cone(-0.95, 1.2, 1.1); cone(1.25, -1.4); cone(-0.3, -3.2); cone(-0.1, -5.6); cone(1.9, -9.5); cone(4.1, 0.9); cone(-1.5, 3.4, 1.15);
    // sawhorse barriers (red/white boards on splayed legs)
    const sawhorse = (x: number, z: number, yaw: number) => {
      const sb = new Batch();
      for (const s of [-1, 1]) for (const l of [-1, 1]) { const leg = boxGeo(V(-0.035, 0, -0.035), V(0.035, 1.0, 0.035)); leg.rotateX(l * 0.2); leg.translate(s * 0.62, 0, l * 0.06); sb.add(leg, M.post); }
      for (const y of [0.55, 0.86]) for (let k = 0; k < 6; k++) sb.add(boxGeo(V(-0.74 + k * (1.48 / 6), y, -0.03), V(-0.74 + (k + 1) * (1.48 / 6), y + 0.2, 0.03)), k % 2 ? M.barW : M.bar);
      const grp = new THREE.Group(); sb.build(grp, true); grp.position.set(x, 0, z); grp.rotation.y = yaw; R.add(grp);
    };
    sawhorse(-1.25, -0.9, 0.35); sawhorse(1.9, -3.2, -0.35);

    // ---- the truck (local: x forward to the nose, z across, origin on the ground at the cab's back) ----
    const Tm = new THREE.Matrix4().makeRotationY(TYAW).setPosition(...TPOS);
    const add = (g: THREE.BufferGeometry, m: THREE.Material) => truck.add(g, m, Tm);
    const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: THREE.Material) => add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);
    // chassis rails and fuel tank
    box(-4.4, 0.55, -0.55, 3.0, 0.8, -0.35, M.trim); box(-4.4, 0.55, 0.35, 3.0, 0.8, 0.55, M.trim);
    { const t = new THREE.CylinderGeometry(0.28, 0.28, 1.1, 14); t.rotateZ(Math.PI / 2); t.translate(-0.3, 0.75, 0.85); add(t, M.chrome); }
    // cab body, roof, door panels, windows, mirrors, steps
    box(0, 0.85, -1.1, 1.45, 1.75, 1.1, M.orange);
    box(0, 1.75, -1.05, 1.35, 2.5, 1.05, M.orange);
    box(-0.05, 2.5, -1.1, 1.45, 2.58, 1.1, M.orange2);
    for (const s of [-1, 1]) {
      const door = new THREE.PlaneGeometry(1.1, 0.88); if (s < 0) door.rotateY(Math.PI); door.translate(0.75, 1.3, s * 1.105); add(door, M.door);
      const win = new THREE.PlaneGeometry(0.95, 0.6); if (s < 0) win.rotateY(Math.PI); win.translate(0.7, 2.12, s * 1.055); add(win, M.glass);
      box(0.18, 1.76, s * 1.06 - 0.02, 1.25, 1.8, s * 1.06 + 0.02, M.trim);
      box(1.35, 2.0, s > 0 ? 1.1 : -1.42, 1.42, 2.04, s > 0 ? 1.42 : -1.1, M.chrome);
      box(1.3, 1.75, s * 1.38 - 0.06, 1.42, 2.35, s * 1.38 + 0.06, M.chrome);
      box(1.42, 1.8, s * 1.38 - 0.045, 1.44, 2.3, s * 1.38 + 0.045, M.trim);
      box(0.3, 0.6, s > 0 ? 1.1 : -1.28, 1.1, 0.66, s > 0 ? 1.28 : -1.1, M.chrome);
    }
    // windscreen with the centre post and a chrome sill
    { const ws = new THREE.PlaneGeometry(2.0, 0.66); ws.rotateY(Math.PI / 2); ws.translate(1.36, 2.12, 0); add(ws, M.glass); }
    box(1.35, 1.78, -0.03, 1.4, 2.46, 0.03, M.trim);
    box(1.35, 1.74, -1.06, 1.46, 1.8, 1.06, M.chrome);
    // roof marker lights
    for (let k = 0; k < 5; k++) box(1.38, 2.58, -0.5 + k * 0.25 - 0.06, 1.48, 2.66, -0.5 + k * 0.25 + 0.06, M.amber);
    // hood, fenders, grille, bumper, headlights
    box(1.45, 0.9, -0.82, 3.05, 1.78, 0.82, M.orange);
    box(1.45, 1.78, -0.7, 2.95, 1.84, 0.7, M.orange2);
    for (const s of [-1, 1]) {
      box(1.6, 0.95, s > 0 ? 0.82 : -1.18, 3.1, 1.35, s > 0 ? 1.18 : -0.82, M.orange);
      box(1.6, 0.86, s > 0 ? 0.82 : -1.18, 3.1, 0.95, s > 0 ? 1.18 : -0.82, M.orange2);
      const pod = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 14); pod.rotateZ(Math.PI / 2); pod.translate(2.98, 1.5, s * 1.0); add(pod, M.orange2);
      const hl = new THREE.CylinderGeometry(0.17, 0.17, 0.06, 16); hl.rotateZ(Math.PI / 2); hl.translate(3.14, 1.5, s * 1.0); add(hl, M.lamp);
      const rim = new THREE.TorusGeometry(0.17, 0.035, 6, 16); rim.rotateY(Math.PI / 2); rim.translate(3.17, 1.5, s * 1.0); add(rim, M.chrome);
      box(3.1, 1.08, s * 1.0 - 0.09, 3.16, 1.2, s * 1.0 + 0.09, M.amber);
    }
    { const gr = new THREE.PlaneGeometry(1.3, 0.78); gr.rotateY(Math.PI / 2); gr.translate(3.06, 1.33, 0); add(gr, M.grille); }
    box(3.05, 0.92, -0.68, 3.09, 0.96, 0.68, M.chrome); box(3.05, 1.72, -0.68, 3.09, 1.76, 0.68, M.chrome);
    box(3.1, 0.55, -1.25, 3.32, 0.85, 1.25, M.chrome);
    box(3.32, 0.6, -0.25, 3.34, 0.8, 0.25, M.trim);
    // exhaust stack behind the cab
    { const ex = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 10); ex.translate(-0.12, 1.75, 1.0); add(ex, M.chrome);
      const cap = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10); cap.translate(-0.12, 2.98, 1.0); add(cap, M.trim); }
    // dump bed: floor, sides with ribs and top rails, headboard with the cab shield, tailgate, a load of sand
    const BX0 = -4.5, BX1 = -0.2, BY0 = 1.0, BY1 = 2.15, BZ = 1.2;
    box(BX0, BY0 - 0.12, -BZ, BX1, BY0, BZ, M.orange2);
    for (const s of [-1, 1]) {
      const side = new THREE.PlaneGeometry(BX1 - BX0, BY1 - BY0); if (s < 0) side.rotateY(Math.PI); side.translate((BX0 + BX1) / 2, (BY0 + BY1) / 2, s * (BZ + 0.005)); add(side, M.bed);
      const inner = new THREE.PlaneGeometry(BX1 - BX0, BY1 - BY0); if (s > 0) inner.rotateY(Math.PI); inner.translate((BX0 + BX1) / 2, (BY0 + BY1) / 2, s * (BZ - 0.06)); add(inner, M.orange2);
      box(BX0, BY1, s > 0 ? BZ - 0.08 : -BZ - 0.02, BX1, BY1 + 0.08, s > 0 ? BZ + 0.02 : -BZ + 0.08, M.orange2);
      for (let k = 0; k < 4; k++) { const x = BX0 + 0.3 + k * 1.25; box(x, BY0 - 0.1, s * BZ - 0.04, x + 0.1, BY1, s * BZ + 0.04, M.orange2); }
      box(BX0 + 0.15, 0.2, s > 0 ? 0.75 : -1.15, BX0 + 0.19, 0.95, s > 0 ? 1.15 : -0.75, M.trim); // mud flaps
      box(BX0 - 0.04, 0.85, s * 0.95 - 0.1, BX0, 0.98, s * 0.95 + 0.1, M.red); // tail lights
    }
    box(BX1, BY0, -BZ, BX1 + 0.1, BY1 + 0.45, BZ, M.orange2);
    box(BX1, BY1 + 0.45, -BZ, BX1 + 1.0, BY1 + 0.53, BZ, M.orange2);
    box(BX0 - 0.08, BY0, -BZ, BX0, BY1 + 0.05, BZ, M.orange);
    for (let k = 0; k < 3; k++) box(BX0 - 0.1, BY0 + 0.25 + k * 0.32, -BZ, BX0 - 0.08, BY0 + 0.33 + k * 0.32, BZ, M.orange2);
    { const heap = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2); heap.scale(1.9, 0.9, 1.05); heap.translate((BX0 + BX1) / 2, BY1 - 0.35, 0); add(heap, M.dune); }
    { const ram = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 10); ram.rotateZ(0.5); ram.translate(-0.55, 0.85, 0); add(ram, M.chrome); }
    // wheels: front singles, rear tandem duals
    const wheel = (x: number, z: number, w: number) => {
      const t = new THREE.CylinderGeometry(0.54, 0.54, w, 22); t.rotateX(Math.PI / 2); t.translate(x, 0.54, z); add(t, M.tyre);
      for (const s of [-1, 1]) {
        const hub = new THREE.CylinderGeometry(0.27, 0.27, 0.02, 16); hub.rotateX(Math.PI / 2); hub.translate(x, 0.54, z + s * (w / 2 + 0.005)); add(hub, M.hub);
        const cap = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 10); cap.rotateX(Math.PI / 2); cap.translate(x, 0.54, z + s * (w / 2 + 0.02)); add(cap, M.chrome);
      }
    };
    for (const s of [-1, 1]) { wheel(2.35, s * 0.93, 0.34); wheel(-2.35, s * 0.85, 0.6); wheel(-3.55, s * 0.85, 0.6); }

    // crates of dynamite stacked by the truck's tail, two open with the sticks showing
    const tail = new THREE.Vector3(-5.2, 0, 0.3).applyMatrix4(Tm);
    const crate = (x: number, y: number, z: number, yaw: number, open: boolean) => {
      const g = boxGeo(V(-0.4, 0, -0.27), V(0.4, 0.5, 0.27)); g.rotateY(yaw); g.translate(x, y, z); things.add(g, M.crate);
      if (open) for (let k = 0; k < 6; k++) for (let j = 0; j < 2; j++) {
        const s = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8); s.translate(-0.28 + k * 0.11, 0.56, -0.08 + j * 0.16); s.rotateY(yaw); s.translate(x, y, z); things.add(s, M.stick);
      }
    };
    crate(tail.x, 0, tail.z, 0.4, false); crate(tail.x + 0.85, 0, tail.z + 0.35, 0.2, false); crate(tail.x + 0.4, 0.5, tail.z + 0.15, 0.3, true);
    crate(tail.x - 0.7, 0, tail.z + 0.9, -0.3, true);

    ground.build(R, false);
    things.build(R, true);
    truck.build(R, true);
    // the amber beacon on the cab roof (turns)
    {
      const p = new THREE.Vector3(0.7, 2.58, 0).applyMatrix4(Tm);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 12), M.trim); base.position.set(p.x, p.y + 0.04, p.z); R.add(base);
      this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.18, 6), M.amber); this.beacon.position.set(p.x, p.y + 0.17, p.z); this.beacon.castShadow = true; R.add(this.beacon);
    }
    // sky backdrop and a warm low sun
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(680, 320), new THREE.MeshBasicMaterial({ map: skyTex(), depthWrite: false }));
    sky.position.set(-10, 84, -240); sky.layers.set(NOINK); R.add(sky);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.8, 1.2) }));
    sun.position.set(90, 32, -235); sun.layers.set(NOINK); R.add(sun);
  }
  protected tick(_id: number, f: number) { this.beacon.rotation.y = f * 0.3; }
  protected stage(id: number, f: number, light: number) { return truckStage(id, f, light); }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    cam.far = 400; cam.updateProjectionMatrix();
    return r;
  }
}

// ---------------- who stands where ----------------
const VETW = { ...VET, skin: "#fbf8f2" }; // heads are white
const VX = 0.2, VZ = 0, VSEED = 31;
/** where the raised ("up") right hand lands on the stout veteran's canvas (same maths as bodyFront: stand, no tilt) */
const handUp = (seed: number): [number, number] => {
  const rnd = (k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const a = 118, b = a * (0.94 + 0.08 * (rnd(1) - 0.5)), W = 2 * a, HH = 2 * b, u = W / 100;
  const torsoBot = 975 - 1.32 * HH, chin = torsoBot - 1.15 * HH, Ta = ((0.92 / 2) * W) / 1.06;
  return [300 + (Ta * 1.1 + 22 * u), chin + 0.12 * HH - 0.75 * HH];
};
const HAND = handUp(VSEED);
/** the veteran holding ONE stick of dynamite upright in his raised right hand (the whale/draw.ts stick, redrawn at
 *  hand scale with body-weight ink), the fist over it */
const vetWithStick = (p: Pen, fo: FrontOpts) => {
  bodyFront(p, VETW, fo);
  const [hx, hy] = HAND, w = 17, top = hy - 125, bot = hy + 40;
  p.stroke([[hx, top], [hx + 6, top - 22], [hx - 4, top - 42]], 6, "#3a2a22"); // fuse
  p.poly([[hx - w, top], [hx + w, top], [hx + w, bot], [hx - w, bot]], "#d9342b", 0);
  p.poly([[hx - w, top], [hx + w, top], [hx + w, top + 16], [hx - w, top + 16]], "#a8221c", 0);
  p.poly([[hx + w - 9, top + 20], [hx + w - 3, top + 20], [hx + w - 3, bot - 8], [hx + w - 9, bot - 8]], "#f2735f", 0);
  p.poly([[hx - w, top], [hx + w, top], [hx + w, bot], [hx - w, bot]], null, 9);
  p.dot(hx, hy, 15);
};

export const truckStage = (_id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  // the veteran: arms crossed, stern -> salute on "Militär" -> warning finger on "warnt" -> ONE stick up on "Zwanzig"
  let arms: [ArmPose, ArmPose] = ["cross", "cross"], stick = false, headTilt: number | undefined;
  if (f >= MILI - 2 && f < MILI + 30) arms = ["cross", "temple"];
  if (f >= WARN - 2 && f < UP - 2) arms = ["hang", "point"];
  if (f >= UP - 2 && f < UP) arms = ["hang", "belly"]; // wind-up: the hand dips to the belt
  if (f >= UP) { arms = ["hip", "up"]; stick = true; }
  if (f >= REICH - 1 && f < REICH + 8) headTilt = -4; // one curt nod on "reichen"
  const fo: FrontOpts = { mode: "stand", seed: VSEED, light, expr: "stern", arms, look: 0, headTilt, blink: ((f + 11) % 64) < 3 };
  out.places.push(stick ? personAt("VETS", VETW, VX, VZ, fo, vetWithStick) : personAt("VET", VETW, VX, VZ, fo));
  contact(out, VX, 0, VZ, 0.95);
  // Thornton strolls past behind him, whistling, not looking
  const t0 = A(6) + 16, x = 2.6 - (f - t0) * (1.5 / 30);
  if (f >= t0 && x > -3.5) {
    const z = -4.2, ph = Math.floor((((f - t0) / 30) % 1) * 8) / 8;
    out.places.push({ ...personAt("THW" + ph, THORNTON, x, z, { mode: "stand", headTilt: 0 }, (p) => bodySide(p, THORNTON, { mode: "march", phase: ph, expr: "whistle", stride: 0.95, light, seed: 21 })), mirror: true });
    contact(out, x, 0, z, 0.8);
  }
  return out;
};
