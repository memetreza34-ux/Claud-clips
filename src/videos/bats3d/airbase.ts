// Shot 1: the brand-new desert air base on fire at dusk. Close on the hero bat (helmet, firebomb, smug), then on
// "amerikanischer" the camera pulls back to the burning hangar with the US flag catching fire.
// Set: sand apron and tarmac, arched hangar (half cylinder) with a dark door, control tower, fuel tanks, runway lights,
// far mesas, fire-lit dusk sky; flames, smoke and embers are animated cards.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { Pen } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, card, rad, V3, personAt, contact, ease, clamp01, q, LEAD, blinkAt } from "./broom";
import { GENERAL, fxThermo, fxCrateLabel } from "./bcast2";
import { drawBat } from "./bcast";
import { sandTex, mesa } from "./desert";
import { BEAT } from "../bats/timing";

const REV = BEAT.american; // pull back on "amerikanischer"
const CRATE: V3 = [-1.2, 0, 2.5], GEN: V3 = [3.0, 0, 4.9], CAR: V3 = [4.4, 0, 3.4];
const C9 = { cut: 1186, lid: BEAT.genau - 6, burst: BEAT.genau - 2 };
const C10 = { roof: 1290, gen: 1306, burn: BEAT.generals - LEAD, zoom: BEAT.generals + 6 };
const BAT: V3 = [0.4, 2.2, 3.2];

const CAMS: Record<number, ShotCam> = {
  1: { keys: [{ f: 0, pos: [0.55, 2.28, 4.35], look: [0.4, 2.2, 3.2], fov: 34 },
    { f: REV - 4, dur: 22, pos: [1.6, 2.6, 13.5], look: [0.0, 3.0, -2], fov: 46 }], creep: 0.0012, punch: [BEAT.bats], cInf: [16, 4], drift: [0.05, 0.02, 0.1] },
  // 9: the shiny new base once, wide; cut to the crate whose lid pops, the bats burst out at the camera
  9: { keys: [{ f: 1079, pos: [-7.5, 3.4, 15], look: [0, 2.4, -3], fov: 48 },
    { f: C9.cut, pos: [-0.9, 1.35, 6.6], look: [CRATE[0], 0.8, CRATE[2]], fov: 42 }], creep: 0.0008, punch: [BEAT.genau], kicks: [C9.lid], cInf: [3, 10], drift: [0.2, 0.03, 0.2] },
  // 10: the bats dive under the hangar roof; then the general, proud beside his car, which catches fire
  10: { keys: [{ f: 1241, pos: [-2.5, 2.4, 9.5], look: [0, 3.0, -3], fov: 46 },
    { f: C10.gen, dur: 12, pos: [1.2, 1.5, 9.4], look: [3.5, 1.1, 4.2], fov: 36 },
    { f: C10.zoom, dur: 8, pos: [2.4, 1.35, 7.6], look: [GEN[0], 1.15, GEN[2]], fov: 34 }], creep: 0.001, punch: [BEAT.generals, BEAT.flammen], kicks: [BEAT.generals], cInf: [4, 9, 12] },
};
export const airbaseCam = camOf(CAMS);
export const airbaseDof = dofOf(CAMS);

const skyTex = () => ctex("baseSky", 1024, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#1c1438"); gr.addColorStop(0.4, "#4e2350"); gr.addColorStop(0.7, "#b2443e"); gr.addColorStop(0.88, "#f08848"); gr.addColorStop(1, "#ffc070");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 90; i++) { g.beginPath(); g.arc((i * 397) % 1024, (i * 211) % 420, 1.2 + (i % 3), 0, Math.PI * 2); g.fill(); }
});
const tarmacTex = () => ctex("baseTarmac", 512, 512, (g, r) => {
  g.fillStyle = "#4a4448"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 600; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)"; g.fillRect(r() * 512, r() * 512, 3, 3); }
  g.strokeStyle = "rgba(30,26,30,0.6)"; g.lineWidth = 4; g.strokeRect(0, 0, 512, 512);
});
const hangarTex = () => ctex("baseHangar", 512, 512, (g) => {
  g.fillStyle = "#a9b1bc"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = x % 64 ? "#9aa2ad" : "#b3bbc6"; g.fillRect(x, 0, 30, 512); }
  g.strokeStyle = "rgba(40,40,50,0.35)"; g.lineWidth = 2; for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
});
const flagTex = () => ctex("baseFlag", 380, 200, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f4f4" : "#c8323a"; g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1); }
  g.fillStyle = "#2a4f9a"; g.fillRect(0, 0, 152, 108);
  g.fillStyle = "#ffffff"; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.beginPath(); g.arc(14 + c * 25, 12 + r * 21, 3.5, 0, Math.PI * 2); g.fill(); }
});

/** cartoon flame on a 256 x 384 canvas, 4 flicker phases */
const fxFlame = (ph: number) => (p: Pen) => {
  const sway = [0, 14, -10, 6][ph], h = [300, 340, 280, 320][ph];
  const outer: [number, number][] = [[40, 370], [20, 260], [70, 200 - ph * 6], [90, 300], [128 + sway, 380 - h], [170, 280], [196, 180 + ph * 8], [236, 270], [216, 370]];
  p.poly(outer, "#ff7a1a", 8);
  p.poly([[80, 370], [70, 300], [128 + sway * 0.6, 380 - h * 0.62], [190, 300], [180, 370]], "#ffd23a", 0);
  p.poly([[110, 370], [104, 330], [128 + sway * 0.3, 380 - h * 0.35], [152, 330], [148, 370]], "#fff3b0", 0);
};
const fxSmoke = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 10, 128, 128, 124);
  gr.addColorStop(0, "rgba(40,28,44,0.65)"); gr.addColorStop(1, "rgba(40,28,44,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
const fxEmber = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  gr.addColorStop(0, "rgba(255,240,170,1)"); gr.addColorStop(0.4, "rgba(255,170,60,0.8)"); gr.addColorStop(1, "rgba(255,120,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
};

const HANGAR_Z = -4, HANGAR_R = 4.2, HANGAR_L = 7;

const daySkyTex = () => ctex("baseSkyDay", 1024, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#2f6fc0"); gr.addColorStop(0.6, "#8cc4ec"); gr.addColorStop(1, "#f4e6c8");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = "rgba(255,255,255,0.85)";
  for (const [x, y, w] of [[160, 300, 220], [620, 220, 300], [860, 380, 160]]) { g.beginPath(); g.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2); g.fill(); }
});

export class AirbaseWorld extends RoomWorld {
  private flag: THREE.Mesh;
  private skyM!: THREE.MeshBasicMaterial;
  private lid = new THREE.Group();
  constructor() {
    super(airbaseCam);
    this.dust = false;
    const R = this.root, ground = new Batch(), things = new Batch();
    const M = {
      sand: lam("baseSand", () => ({ map: sandTex() })),
      tarmac: lam("baseTarmacM", () => ({ map: tarmacTex() })),
      hangar: lam("baseHangarM", () => ({ map: hangarTex(), side: THREE.DoubleSide })),
      door: lam("baseDoor", () => ({ color: "#24262e" })),
      tower: lam("baseTower", () => ({ color: "#7a828e" })),
      glass: lam("baseGlass", () => ({ color: "#9ad0e8" })),
      tank: lam("baseTank", () => ({ color: "#cdd0d6" })),
      red: lam("baseRed", () => ({ color: "#c8323a" })),
      pole: lam("basePole", () => ({ color: "#d9d9d9" })),
      far: lam("baseFar", () => ({ color: "#5a2a4e", side: THREE.DoubleSide })),
    };
    const floor = new THREE.PlaneGeometry(120, 80); floor.rotateX(-Math.PI / 2); floor.translate(0, 0, -15);
    const fuv = floor.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 30, fuv.getY(i) * 20);
    ground.add(floor, M.sand);
    const apron = new THREE.PlaneGeometry(26, 22); apron.rotateX(-Math.PI / 2); apron.translate(0, 0.01, 2);
    const auv = apron.attributes.uv; for (let i = 0; i < auv.count; i++) auv.setXY(i, auv.getX(i) * 6, auv.getY(i) * 5);
    ground.add(apron, M.tarmac);
    // arched hangar: half cylinder along z, open end walls filled with front/back panels, dark door
    const shell = new THREE.CylinderGeometry(HANGAR_R, HANGAR_R, HANGAR_L, 32, 1, true, -Math.PI / 2, Math.PI);
    shell.rotateX(Math.PI / 2); shell.rotateZ(Math.PI / 2); shell.rotateY(Math.PI / 2);
    shell.translate(0, 0, HANGAR_Z - HANGAR_L / 2);
    things.add(shell, M.hangar);
    const end = new THREE.CircleGeometry(HANGAR_R, 32, 0, Math.PI); end.translate(0, 0, HANGAR_Z); things.add(end, M.hangar);
    things.add(boxGeo(V(-1.9, 0, HANGAR_Z), V(1.9, 2.9, HANGAR_Z + 0.06)), M.door);
    // control tower (left), fuel tanks (right), flag pole
    things.add(boxGeo(V(-8.6, 0, -2.6), V(-7.4, 6.2, -1.4)), M.tower);
    things.add(boxGeo(V(-9.1, 6.2, -3.1), V(-6.9, 7.4, -0.9)), M.glass);
    things.add(boxGeo(V(-9.3, 7.4, -3.3), V(-6.7, 7.7, -0.7)), M.tower);
    for (const [x, z] of [[7.2, -1.5], [8.8, -2.2]]) {
      const c = new THREE.CylinderGeometry(0.75, 0.75, 2.4, 20); c.translate(x, 1.2, z); things.add(c, M.tank);
      const b = new THREE.CylinderGeometry(0.77, 0.77, 0.3, 20); b.translate(x, 1.6, z); things.add(b, M.red);
    }
    const pole = new THREE.CylinderGeometry(0.05, 0.06, 6.5, 10); pole.translate(4.9, 3.25, HANGAR_Z + 1.2); things.add(pole, M.pole);
    // far mesas
    things.add(mesa([[-60, 0], [-44, 6], [-30, 6.5], [-24, 3], [-6, 3.2], [2, 7], [14, 7.4], [22, 4], [40, 4.4], [60, 8], [60, 0]], -40, 2), M.far);
    // sky backdrop
    // the crate (shot 9) with a separate lid, the general's staff car (shot 10)
    const wood = lam("baseCrate", () => ({ color: "#b98a52" })), olive = lam("baseCar", () => ({ color: "#5d6a3a" })), tyre = lam("baseTyre", () => ({ color: "#222226" }));
    things.add(boxGeo(V(CRATE[0] - 0.45, 0, CRATE[2] - 0.3), V(CRATE[0] + 0.45, 0.58, CRATE[2] + 0.3)), wood);
    const lidM = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.06, 0.66), new THREE.MeshLambertMaterial({ color: "#a87a46" }));
    lidM.position.set(0.48, 0.03, 0); this.lid.add(lidM); this.lid.position.set(CRATE[0] - 0.48, 0.58, CRATE[2]); R.add(this.lid);
    const [cx, , cz] = CAR;
    things.add(boxGeo(V(cx - 1.0, 0.3, cz - 0.55), V(cx + 1.0, 0.85, cz + 0.55)), olive);
    things.add(boxGeo(V(cx - 0.55, 0.85, cz - 0.5), V(cx + 0.45, 1.3, cz + 0.5)), olive);
    things.add(boxGeo(V(cx - 0.5, 0.9, cz - 0.52), V(cx + 0.4, 1.22, cz + 0.52)), lam("baseCarGlass", () => ({ color: "#9ad0e8" })));
    for (const [dx, dz] of [[-0.62, -0.56], [0.62, -0.56], [-0.62, 0.56], [0.62, 0.56]]) {
      const w = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16); w.rotateX(Math.PI / 2); w.translate(cx + dx, 0.28, cz + dz); things.add(w, tyre);
    }
    for (const dz of [-0.35, 0.35]) { const l = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12); l.rotateZ(Math.PI / 2); l.translate(cx + 1.02, 0.7, cz + dz); things.add(l, lam("baseLamp", () => ({ color: "#fff4c8" }))); }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(190, 110), this.skyM = new THREE.MeshBasicMaterial({ map: skyTex(), depthWrite: false }));
    sky.position.set(0, 30, -60); sky.layers.set(NOINK); R.add(sky);
    // waving flag
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0, 12, 1), new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide }));
    fl.position.set(4.9 + 0.95, 6.0, HANGAR_Z + 1.2); fl.layers.set(NOINK); R.add(fl); this.flag = fl;
    ground.build(R, false); things.build(R, true);
  }
  protected tick(id: number, f: number) {
    const day = id === 9;
    if (this.skyM.userData.day !== day) { this.skyM.map = day ? daySkyTex() : skyTex(); this.skyM.userData.day = day; this.skyM.needsUpdate = true; }
    // the lid flips open and flies off on "genau"
    const u = id === 9 ? clamp01((f - C9.lid) / 8) : id === 10 ? 1 : 0;
    this.lid.rotation.z = rad(115) * ease.out(u); this.lid.position.y = 0.58 + 0.6 * Math.sin(Math.PI * Math.min(1, u)) * (u < 1 ? 1 : 0);
    const p = this.flag.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.95; p.setZ(i, 0.12 * x * Math.sin(f * 0.25 - x * 3)); }
    p.needsUpdate = true;
  }
  protected stage(id: number, f: number, light: number) { return airbaseStage(id, f, light); }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    cam.far = 220; cam.updateProjectionMatrix();
    return r;
  }
}

const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

const smallBat = (key: string, at: V3, f: number, light: number, s = 0.11) => {
  const fq = Math.round((0.5 + 0.5 * Math.sin(f * 1.3 + key.length)) * 4) / 4;
  return { key: `BAT|small|${fq}`, x: at[0], y: at[1], z: at[2], scale: s, draw: (p: Pen) => drawBat(p, { look: "smug", flap: fq, bomb: true, light: q(light) }) };
};
const flames = (out: Stage, f: number, at: V3[], size: number, seed: number) => at.forEach(([x, y, z], i) => {
  const ph = Math.floor((f / 3 + i * 1.3 + seed) % 4); card(out, "flame" + ph, 256, 384, fxFlame(ph), x, y + size * 0.6, z, size * (0.8 + 0.4 * hash(i, seed)));
});

export const airbaseStage = (id: number, f: number, light: number): Stage => {
  if (id === 9) return stage9(f, light);
  if (id === 10) return stage10(f, light);
  const out: Stage = { places: [], fx: [] };
  // the hero bat hovering in front of the fire, wings beating
  const flap = 0.5 + 0.5 * Math.sin(f * 0.9), fq = Math.round(flap * 4) / 4;
  out.places.push({ key: `BAT|hero|${fq}|${f % 90 < 3}`, x: BAT[0], y: BAT[1] - 0.19 + 0.03 * Math.sin(f / 9), z: BAT[2], scale: 0.32,
    draw: (p: Pen) => drawBat(p, { look: "smug", hero: true, bomb: true, flap: fq, blink: f % 90 < 3, light }) });
  // flames along the hangar roof and in the door, smoke above
  const ridge = (u: number): V3 => { const a = rad(180 * u); return [-Math.cos(a) * HANGAR_R * 0.98, Math.sin(a) * HANGAR_R * 0.98, HANGAR_Z + 0.4]; };
  [0.2, 0.35, 0.5, 0.62, 0.78].forEach((u, i) => {
    const [x, y, z] = ridge(u), ph = Math.floor((f / 3 + i * 1.3) % 4);
    card(out, "flame" + ph, 256, 384, fxFlame(ph), x, y + 0.9, z, 1.4 + 0.4 * hash(i, 1));
  });
  [-1.2, 0, 1.2].forEach((x, i) => { const ph = Math.floor((f / 3 + i * 2.1) % 4); card(out, "flame" + ph, 256, 384, fxFlame(ph), x, 1.0, HANGAR_Z + 0.2, 1.2); });
  for (let i = 0; i < 8; i++) {
    const u = (hash(i, 2) + f * 0.004) % 1;
    card(out, "smoke", 256, 256, fxSmoke, -3 + 6 * hash(i, 3) + u * 2, 4.5 + u * 9, HANGAR_Z - 1, 3 + u * 5, true);
  }
  // the flag catches fire after the pull back
  if (f > REV + 6) { const ph = Math.floor((f / 3) % 4); card(out, "flame" + ph, 256, 384, fxFlame(ph), 5.6, 6.0, HANGAR_Z + 1.3, 0.8 * Math.min(1, (f - REV - 6) / 12)); }
  // embers drifting up past the camera
  for (let i = 0; i < 30; i++) {
    const u = (hash(i, 4) + f * 0.006 * (1 + hash(i, 5))) % 1;
    card(out, "ember", 64, 64, fxEmber, -4 + 8 * hash(i, 6) + Math.sin(f / 20 + i) * 0.3, u * 8, -1 + 6 * hash(i, 7), 0.12, true);
  }
  return out;
};

const stage9 = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  card(out, "crateLabel", 420, 300, fxCrateLabel, CRATE[0], 0.3, CRATE[2] + 0.31, 0.6);
  if (f >= C9.cut) card(out, `thermo|${q(clamp01((f - C9.cut) / 26))}`, 140, 440, fxThermo(Math.min(1, (f - C9.cut) / 26)), CRATE[0] - 0.85, 0.75, CRATE[2] + 0.2, 0.22);
  // heat shimmer on the wide shot: a few soft light bands over the apron
  if (f >= C9.burst) for (let i = 0; i < 14; i++) {
    const t = (f - C9.burst) / 16, a = hash(i, 11) * Math.PI * 2, sp = 0.6 + hash(i, 12);
    out.places.push(smallBat("b9" + i, [CRATE[0] + Math.cos(a) * 0.9 * t * sp + 0.3 * t, 0.7 + 1.0 * t * sp * (0.5 + hash(i, 13)), CRATE[2] + 0.9 * t * sp], f + i * 3, light, 0.2));
  }
  return out;
};

const stage10 = (f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  // the bats dive under the front edge of the hangar roof
  if (f < C10.gen) for (let i = 0; i < 12; i++) {
    const t = clamp01((f - 1241 - i * 2) / 40), a = rad(20 + 140 * hash(i, 21)), end: V3 = [-Math.cos(a) * HANGAR_R * 0.9, Math.sin(a) * HANGAR_R * 0.9 - 0.2, HANGAR_Z + 0.3];
    const st: V3 = [-1 + 3 * hash(i, 22), 3 + 2 * hash(i, 23), 7];
    if (t < 1) out.places.push(smallBat("b10" + i, [st[0] + (end[0] - st[0]) * t, st[1] + (end[1] - st[1]) * t, st[2] + (end[2] - st[2]) * t], f + i * 5, light, 0.3));
  }
  // the hangar catches fire, then the car
  const roof = clamp01((f - C10.roof) / 30);
  if (roof > 0) flames(out, f, [0.2, 0.4, 0.6, 0.8].map((u) => { const a = rad(180 * u); return [-Math.cos(a) * HANGAR_R * 0.98, Math.sin(a) * HANGAR_R * 0.98, HANGAR_Z + 0.4] as V3; }), 1.6 * roof, 3);
  const car = clamp01((f - C10.burn) / 10), more = clamp01((f - (BEAT.flammen - LEAD)) / 10);
  if (car > 0) flames(out, f, [[CAR[0] - 0.4, 0.9, CAR[2] + 0.3], [CAR[0] + 0.4, 0.9, CAR[2] + 0.3]], 0.9 * car + 0.5 * more, 7);
  if (more > 0) flames(out, f, [[CAR[0] - 0.9, 0.5, CAR[2] + 0.5], [CAR[0] + 0.9, 0.5, CAR[2] + 0.5]], 0.8 * more, 9);
  for (let i = 0; i < 6; i++) { const u = (hash(i, 2) + f * 0.004) % 1; card(out, "smoke", 256, 256, fxSmoke, -2 + 4 * hash(i, 3) + u * 2, 4.5 + u * 7, HANGAR_Z - 1, (2 + u * 4) * roof + 0.01, true); }
  // the general: proud, then frozen in shock
  const shock = f >= C10.burn;
  out.places.push(personAt("GENERAL", GENERAL, GEN[0], GEN[2], { expr: shock ? "shock" : "grin", arms: shock ? ["up", "up"] : ["hip", "hip"], look: shock ? 0.6 : 0, blink: !shock && blinkAt(f, 6), light: q(light) }));
  contact(out, GEN[0], 0, GEN[2], 0.7);
  return out;
};
