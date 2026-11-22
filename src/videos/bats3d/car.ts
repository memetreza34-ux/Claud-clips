// Shot 3: inside Lytle's 1940s car on the drive home at dusk. POV over the dashboard through the windshield (road
// rushing toward us, telegraph poles, mesas), the radio dial sweeps and lights up; on "Pearl Harbor" a cut to the side:
// Lytle at the wheel, eyes narrowing, green radio glow from below, the landscape sliding past the window behind him.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../pigeon/build";
import { ctex } from "../pigeon/paint";
import { NOINK } from "../pigeon/ink";
import { FrontOpts } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, personAt } from "./broom";
import { LYTLE, drawLytle } from "./bcast";
import { sandTex, mesa } from "./desert";
import { BEAT } from "../bats/timing";
import { fxThought } from "./bcast2";
import { card, q, ease, LEAD } from "./broom";

const CUT = BEAT.pearl - 8;
const CAMS: Record<number, ShotCam> = {
  3: { keys: [{ f: 374, pos: [-0.38, 1.3, 0.25], look: [-0.05, 1.05, -3], fov: 58 },
    { f: CUT, pos: [0.75, 1.25, -0.85], look: [-0.42, 1.0, 0.2], fov: 52 }], creep: 0.001, punch: [BEAT.pearl], cInf: [3, 12], drift: [0.02, 0.01, 0.06] },
  // shot 4: closer on Lytle, the thought bubble above him; push on his scheming grin
  4: { keys: [{ f: 535, pos: [0.8, 1.3, -0.9], look: [-0.35, 1.2, 0.15], fov: 58 }], creep: 0.0012, punch: [BEAT.daechern], cInf: [9], drift: [0.02, 0.01, 0.05] },
};
export const carCam = camOf(CAMS);
export const carDof = dofOf(CAMS);

const radioTex = () => ctex("carRadio", 512, 192, (g) => {
  g.fillStyle = "#2e2420"; g.fillRect(0, 0, 512, 192);
  g.fillStyle = "#b8ffd2"; g.fillRect(24, 24, 320, 100);
  g.strokeStyle = "#2a6a4a"; g.lineWidth = 4;
  for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(40 + i * 18, 34); g.lineTo(40 + i * 18, i % 4 ? 52 : 64); g.stroke(); }
  g.fillStyle = "#2a6a4a"; g.font = "bold 22px Arial"; ["55", "70", "100", "130", "160"].forEach((t, i) => g.fillText(t, 34 + i * 72, 112));
  g.fillStyle = "#d9c9a8"; for (let i = 0; i < 4; i++) { g.fillRect(28 + i * 78, 144, 58, 34); }
});
const roadTex = () => ctex("carRoad", 256, 1024, (g) => {
  g.fillStyle = "#4e4448"; g.fillRect(0, 0, 256, 1024);
  g.fillStyle = "#ffe08a"; for (let y = 0; y < 1024; y += 128) g.fillRect(120, y, 16, 64);
});
const skyTex = () => ctex("carSky", 1024, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#3b347a"); gr.addColorStop(0.5, "#c86a7a"); gr.addColorStop(0.8, "#ffb07a"); gr.addColorStop(1, "#ffd8a0");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
});

export class CarWorld extends RoomWorld {
  private road: THREE.Texture;
  private outside = new THREE.Group();
  private needle: THREE.Mesh;
  private knob: THREE.Mesh;
  constructor() {
    super(carCam);
    this.dust = true;
    const R = this.root, inside = new Batch(), out = new Batch();
    const M = {
      body: lam("carBody", () => ({ color: "#3c6a8a" })),
      dash: lam("carDash", () => ({ color: "#7a4a32" })),
      trim: lam("carTrim", () => ({ color: "#c9c9d2" })),
      seat: lam("carSeat", () => ({ color: "#8a3a32" })),
      dark: lam("carDark", () => ({ color: "#2a1d1a" })),
      roof: lam("carRoof", () => ({ color: "#d8c8a8" })),
      sand: lam("carSand", () => ({ map: sandTex() })),
      far: lam("carFar", () => ({ color: "#9a5070", side: THREE.DoubleSide })),
      pole: lam("carPole", () => ({ color: "#5a3a30" })),
    };
    // cabin: floor, roof, dashboard, windshield pillars, doors with window openings, seats, steering wheel
    inside.add(boxGeo(V(-0.85, 0.15, -1.3), V(0.85, 0.2, 0.9)), M.dark);
    inside.add(boxGeo(V(-0.85, 1.72, -1.0), V(0.85, 1.78, 0.9)), M.roof);
    inside.add(boxGeo(V(-0.85, 0.6, -1.3), V(0.85, 1.02, -0.85)), M.dash);
    inside.add(boxGeo(V(-0.86, 1.0, -1.0), V(0.86, 1.04, -0.84)), M.trim);
    for (const x of [-0.84, 0.78]) inside.add(boxGeo(V(x, 1.02, -1.0), V(x + 0.06, 1.74, -0.9)), M.body);
    inside.add(boxGeo(V(-0.85, 1.02, -1.04), V(0.85, 1.08, -0.98)), M.body);
    for (const s of [-1, 1]) {
      const x = s * 0.88;
      inside.add(boxGeo(V(x - 0.04, 0.2, -0.85), V(x + 0.04, 1.0, 0.9)), M.body); // door below the window
      inside.add(boxGeo(V(x - 0.04, 1.0, 0.55), V(x + 0.04, 1.74, 0.9)), M.body); // b-pillar
    }
    inside.add(boxGeo(V(-0.8, 0.2, 0.05), V(0.8, 0.62, 0.65)), M.seat);
    inside.add(boxGeo(V(-0.8, 0.62, 0.5), V(0.8, 1.25, 0.66)), M.seat);
    const wheel = new THREE.TorusGeometry(0.2, 0.025, 10, 32); wheel.rotateX(-0.45); wheel.translate(-0.4, 1.0, -0.62); inside.add(wheel, M.dark);
    const col = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8); col.rotateX(1.1); col.translate(-0.4, 0.9, -0.8); inside.add(col, M.dark);
    // radio face, needle and knob
    const radio = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: radioTex(), color: new THREE.Color(1.15, 1.15, 1.15) }));
    radio.rotateX(-0.5); radio.position.set(0.12, 0.93, -0.84); R.add(radio);
    this.needle = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.06, 0.004), new THREE.MeshBasicMaterial({ color: "#c0392b" }));
    radio.add(this.needle); this.needle.position.set(-0.05, 0.02, 0.003);
    this.knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), new THREE.MeshLambertMaterial({ color: "#c9b08a" }));
    this.knob.rotation.x = Math.PI / 2 - 0.5; this.knob.position.set(0.3, 0.9, -0.82); R.add(this.knob);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.09), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 2.0, 1.2), transparent: true, opacity: 0.55 }));
    glow.rotateX(-0.5); glow.position.set(0.08, 0.955, -0.835); glow.layers.set(NOINK); R.add(glow);
    // the hood ahead
    inside.add(boxGeo(V(-0.85, 0.7, -3.0), V(0.85, 0.9, -1.3)), M.body);
    inside.build(R, true);
    // outside world (moves past the car): sand, road, poles, mesas, sky
    const sand = new THREE.PlaneGeometry(200, 200); sand.rotateX(-Math.PI / 2);
    const suv = sand.attributes.uv; for (let i = 0; i < suv.count; i++) suv.setXY(i, suv.getX(i) * 50, suv.getY(i) * 50);
    out.add(sand, M.sand);
    for (let i = 0; i < 14; i++) {
      const p = new THREE.CylinderGeometry(0.08, 0.1, 6, 8); p.translate(3.2, 3, -i * 12); out.add(p, M.pole);
      out.add(boxGeo(V(2.4, 5.6, -i * 12 - 0.06), V(4.0, 5.72, -i * 12 + 0.06)), M.pole);
    }
    out.add(mesa([[-90, 0], [-60, 7], [-44, 7.5], [-38, 3], [-10, 3.2], [-4, 9], [14, 9.4], [20, 4], [60, 4.4], [90, 8], [90, 0]], -90, 2), M.far);
    out.build(this.outside, true);
    this.road = roadTex(); this.road.wrapT = THREE.RepeatWrapping; this.road.repeat.set(1, 20);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 200), new THREE.MeshLambertMaterial({ map: this.road }));
    road.rotateX(-Math.PI / 2); road.position.set(0, 0.02, -60); this.outside.add(road);
    R.add(this.outside);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(260, 130), new THREE.MeshBasicMaterial({ map: skyTex(), depthWrite: false }));
    sky.position.set(0, 40, -120); sky.layers.set(NOINK); R.add(sky);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(5, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.1) }));
    sun.position.set(18, 9, -118); sun.layers.set(NOINK); R.add(sun);
  }
  protected tick(_id: number, f: number) {
    // driving: road texture scrolls, poles and sand slide back in a 12 m loop
    this.road.offset.y = -f * 0.02;
    this.outside.position.z = (f * 0.28) % 12;
    // the dial sweeps until the news comes on, then settles
    const sweep = Math.min(1, Math.max(0, (f - 380) / 36));
    this.needle.position.x = -0.12 + 0.17 * sweep + 0.004 * Math.sin(f * 0.7);
    this.knob.rotation.y = sweep * 4;
  }
  protected stage(id: number, f: number, light: number) { return carStage(id, f, light); }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const r = super.update(id, f, cam, scene);
    cam.near = 0.03; cam.far = 260; cam.updateProjectionMatrix();
    return r;
  }
}

const lytle = (x: number, z: number, o: FrontOpts) => personAt("LYTLE", LYTLE, x, z, o, drawLytle);

/** three little bats hanging asleep under the eave of the thought-bubble roof */
const sleepBat = (p: import("../pigeon/toon").Pen, x: number, y: number) => {
  p.stroke([[x, y], [x, y + 14]], 4);
  p.ell(x, y + 40, 20, 24, "#5b4470", 4);
  for (const s of [-1, 1]) p.poly([[x + s * 6, y + 58], [x + s * 22, y + 80], [x + s * 18, y + 54]], "#5b4470", 3);
  for (const s of [-1, 1]) p.arc(x + s * 8, y + 38, 6, 3, 200, 340, 3);
};

export const carStage = (id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (id === 4) {
    // the idea: bats sleep under roofs; the bubble grows in, pops at the end of the shot
    const grow = ease.back((f - 540) / 10), pop = f >= 596 ? 1 - (f - 596) / 6 : 1;
    if (grow > 0 && pop > 0) card(out, "thought", 520, 420, fxThought(sleepBat), -0.2, 1.5, 0.02, 0.36 * grow * pop);
  }
  if (f >= CUT) {
    const grin = id === 4 && f >= BEAT.daechern - LEAD;
    const p = lytle(-0.42, 0.2, { mode: "sit", expr: grin ? "grin" : f >= BEAT.pearl ? "stern" : "neutral", look: 1, light: q(light), facing: 1, mirror: false } as FrontOpts);
    p.y = 0.2; p.scale = 0.72;
    out.places.push(p);
  }
  return out;
};
