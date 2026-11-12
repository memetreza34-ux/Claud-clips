// Fred's lab: one room for shots 3, 5, 7, 10, 11, 12 and 15 of the pigeon short. Same look pipeline as the bridge
// world (two-tone materials, camera-relative frozen sun, lit character cards, effect cards), much smaller scene.
// Room: x -4..4, z -3..3 (camera side open), floor y = 0. Desk + window on the back wall left, training table with the
// target screen on the right, workbench on the left wall, blackboard + clock on the right wall.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit } from "./build";
import { placeProp } from "./props";
import { ctex, planksHD } from "./paint";
import { wallpaperTex, panelTex, grainTex, nightTex, plasterTex } from "./ptex";
import { Pen, fxPuff, FrontOpts } from "./toon";
import { NOINK } from "./ink";
import { drawFred, fxSeeds, fxSpeed, fxRain, fxIdea, fxWindow, PigeonOpts, FRED } from "./pcast";
import { RoomWorld, ShotCam, Stage, V3, camOf, dofOf, roomShell, pigeonAt, personAt, contact, card, clamp01, rad, LEAD, q, blinkAt, peckAt, glide, isNight, ease } from "./room";

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  6: { keys: [{ f: 611, pos: [1.85, 1.12, -1.2], look: [2.44, 1.12, -1.55], fov: 42 }], creep: 0.001, punch: [718], cInf: [12] },
  8: { keys: [{ f: 833, pos: [1.1, 1.2, -0.45], look: [2.05, 1.05, -1.55], fov: 42 },
    { f: 849, dur: 8, pos: [1.1, 1.2, -0.45], look: [2.05, 1.05, -1.55], fov: 41, roll: rad(4.5) }], creep: 0.001, cInf: [13, 13] },
  3: { keys: [{ f: 268, pos: [0.9, 1.55, 1.6], look: [-0.9, 1.15, -2.05], fov: 42 },
    { f: 318, dur: 28, pos: [0.85, 1.5, 1.05], look: [-0.7, 1.2, -2.1], fov: 38 }], creep: 0.0008, punch: [381], cInf: [8, 11] },
  5: { keys: [{ f: 572, pos: [-1.15, 1.45, 1.9], look: [-3.05, 1.05, 0.15], fov: 38 }], creep: 0.0012, kicks: [584, 598], cInf: [11] },
  7: { keys: [{ f: 745, pos: [0.95, 1.22, -0.15], look: [2.0, 1.0, -1.55], fov: 36 },
    { f: 790, dur: 30, pos: [1.1, 1.17, -0.4], look: [2.02, 0.98, -1.56], fov: 34 }], creep: 0.0008, cInf: [13, 13] },
  10: { keys: [{ f: 994, pos: [1.15, 1.1, -0.85], look: [2.02, 1.0, -1.58], fov: 34 }], creep: 0.001, punch: [1026], cInf: [15] },
  11: { keys: [{ f: 1101, pos: [0.8, 1.22, -0.15], look: [1.98, 1.0, -1.56], fov: 44 },
    { f: 1101, dur: 10, pos: [0.8, 1.22, -0.15], look: [1.98, 1.0, -1.56], fov: 43, roll: rad(4.5) }], creep: 0.001, cInf: [13, 13] },
  12: { keys: [{ f: 1158, pos: [0.2, 1.45, 0.9], look: [1.6, 1.05, -1.4], fov: 40 },
    { f: 1290, dur: 30, pos: [1.35, 1.08, -0.85], look: [1.74, 1.0, -1.76], fov: 34, path: [[1.05, 1.3, 0.1]] }], creep: 0.0006, punch: [1294], cInf: [9, 14], drift: [0.08, 0.02, 0.04] },
  15: { keys: [{ f: 1536, pos: [1.5, 1.32, 0.2], look: [1.95, 1.0, -1.55], fov: 40 }], creep: 0.001, punch: [1635], cInf: [12] },
};

export const labCam = camOf(CAMS);
export const labDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const outsideTex = () => ctex("labOutside", 512, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#4f8cdb"); gr.addColorStop(0.7, "#b8d0ec"); gr.addColorStop(1, "#cfe0f2");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#c9a07a"; g.fillRect(300, 250, 180, 262); g.fillStyle = "#8f4e3c"; g.beginPath(); g.moveTo(290, 250); g.lineTo(390, 190); g.lineTo(490, 250); g.fill();
  for (const [x, y, r, c] of [[90, 330, 110, "#5f9e4c"], [210, 380, 90, "#6aab4f"], [40, 420, 80, "#4f8d42"], [420, 430, 90, "#5f9e4c"]] as const) {
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#f6f3ea"; for (const [x, y] of [[140, 90], [190, 75], [240, 95]]) { g.beginPath(); g.arc(x, y, 34, 0, Math.PI * 2); g.fill(); }
});
const shipTex = () => ctex("labShip", 256, 256, (g) => {
  g.fillStyle = "#cfe6dc"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#7fb0c8"; g.fillRect(0, 150, 256, 106);
  g.fillStyle = "#4b5260"; g.strokeStyle = "#241726"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(60, 150); g.lineTo(196, 150); g.lineTo(180, 172); g.lineTo(76, 172); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.rect(110, 118, 40, 32); g.fill(); g.stroke();
  g.beginPath(); g.rect(124, 92, 10, 26); g.fill(); g.stroke();
  g.strokeStyle = "rgba(36,23,38,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 20); g.lineTo(128, 236); g.moveTo(20, 128); g.lineTo(236, 128); g.stroke();
});
const boardTex = () => ctex("labBoard", 512, 384, (g) => {
  g.fillStyle = "#2f4a3d"; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = "rgba(240,240,230,0.85)"; g.lineWidth = 6; g.lineCap = "round";
  g.beginPath(); g.moveTo(60, 60); g.lineTo(60, 320); g.lineTo(460, 320); g.stroke();
  g.beginPath(); g.moveTo(70, 300); g.bezierCurveTo(200, 290, 300, 220, 450, 80); g.stroke();
  g.beginPath(); g.arc(330, 120, 34, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(360, 112); g.lineTo(386, 122); g.lineTo(360, 130); g.stroke();
  g.beginPath(); g.ellipse(300, 160, 50, 32, -0.2, 0, Math.PI * 2); g.stroke();
});
const clockTex = () => ctex("labClock", 256, 256, (g) => {
  g.fillStyle = "#f4efe2"; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#241726"; g.lineCap = "round";
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.lineWidth = i % 3 ? 5 : 10; g.beginPath(); g.moveTo(128 + 92 * Math.cos(a), 128 + 92 * Math.sin(a)); g.lineTo(128 + 110 * Math.cos(a), 128 + 110 * Math.sin(a)); g.stroke(); }
});

// ---------------- the room ----------------
const TABLE_Y = 0.86, DESK_Y = 0.77;
const CLOCK: V3 = [3.96, 1.62, -1.55];

export class LabWorld extends RoomWorld {
  private hands: THREE.Object3D[] = [];
  private view!: THREE.MeshBasicMaterial;

  constructor(kit: Kit) {
    super(labCam);
    const R = this.root;
    const walls = new Batch(), things = new Batch();
    const M = {
      floor: lam("labFloor", () => ({ map: planksHD(), color: "#e2c8a8" })),
      wains: lam("labWainsP", () => ({ map: panelTex("#4f7f68") })),
      wall: lam("labWallP", () => ({ map: wallpaperTex("#eadfc6", "#d8c9a8") })),
      rail: lam("labRail", () => ({ color: "#8a5a3c" })),
      ceil: lam("labCeilP", () => ({ map: plasterTex("#f2ead8") })),
      wood: lam("labWood", () => ({ color: "#9a6a43" })),
      top: lam("labTopG", () => ({ map: grainTex("#8a5a3a") })),
      metal: lam("labMetal", () => ({ color: "#6f7a86" })),
      dark: lam("labDark", () => ({ color: "#3a3f4a" })),
      paper: lam("labPaper", () => ({ color: "#f3efe4" })),
      cone: lam("labCone", () => ({ color: "#9aa3ad" })),
      jarA: lam("labJarA", () => ({ color: "#c96b4a" })), jarB: lam("labJarB", () => ({ color: "#d9b94a" })), jarC: lam("labJarC", () => ({ color: "#5a8fc2" })),
      book1: lam("labBook1", () => ({ color: "#b5453f" })), book2: lam("labBook2", () => ({ color: "#3f6fb5" })), book3: lam("labBook3", () => ({ color: "#5d7a3a" })),
    };
    roomShell(walls, things, { floor: M.floor, low: M.wains, wall: M.wall, rail: M.rail, ceil: M.ceil }, [[-2.2, -1.0, 1.15, 2.45]]);
    // window frame, sill and cross bars, painted view behind it
    for (const [a, b] of [[V(-2.28, 1.07, -3.05), V(-0.92, 1.15, -2.86)], [V(-2.28, 2.45, -3.05), V(-0.92, 2.53, -2.94)],
      [V(-2.28, 1.15, -3.05), V(-2.2, 2.45, -2.94)], [V(-1.0, 1.15, -3.05), V(-0.92, 2.45, -2.94)],
      [V(-1.63, 1.15, -3.02), V(-1.57, 2.45, -2.98)], [V(-2.2, 1.77, -3.02), V(-1.0, 1.83, -2.98)]] as const) things.add(boxGeo(a, b), M.paper);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: outsideTex() }));
    view.position.set(-1.6, 1.8, -3.4); view.layers.set(NOINK); R.add(view); this.view = view.material;
    // desk under the window: top, legs, drawer block, lamp, books, papers
    things.add(boxGeo(V(-2.35, DESK_Y - 0.05, -2.75), V(-0.85, DESK_Y, -1.95)), M.top);
    for (const [x, z] of [[-2.3, -2.7], [-0.9, -2.7], [-2.3, -2.0], [-0.9, -2.0]]) things.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, DESK_Y - 0.05, z + 0.04)), M.wood);
    things.add(boxGeo(V(-2.3, 0.35, -2.7), V(-1.85, DESK_Y - 0.05, -2.0)), M.wood);
    things.add(boxGeo(V(-2.25, DESK_Y, -2.6), V(-2.0, DESK_Y + 0.05, -2.35)), M.book1);
    things.add(boxGeo(V(-2.23, DESK_Y + 0.05, -2.58), V(-2.02, DESK_Y + 0.1, -2.37)), M.book2);
    things.add(boxGeo(V(-1.7, DESK_Y, -2.45), V(-1.45, DESK_Y + 0.006, -2.2)), M.paper);
    const lamp = new THREE.ConeGeometry(0.13, 0.16, 16, 1, true); lamp.translate(-1.05, DESK_Y + 0.45, -2.6);
    things.add(lamp, M.dark);
    things.add(boxGeo(V(-1.07, DESK_Y, -2.62), V(-1.03, DESK_Y + 0.4, -2.58)), M.metal);
    // training table on the right with the target screen at its right end (screen faces -x, toward the pigeons)
    things.add(boxGeo(V(1.3, TABLE_Y - 0.05, -2.0), V(2.75, TABLE_Y, -1.1)), M.top);
    for (const [x, z] of [[1.35, -1.95], [2.7, -1.95], [1.35, -1.15], [2.7, -1.15]]) things.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, TABLE_Y - 0.05, z + 0.04)), M.wood);
    things.add(boxGeo(V(2.45, TABLE_Y, -1.85), V(2.6, TABLE_Y + 0.5, -1.25)), M.dark);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.38), new THREE.MeshBasicMaterial({ map: shipTex() }));
    screen.rotateY(-Math.PI / 2); screen.position.set(2.44, TABLE_Y + 0.26, -1.55); R.add(screen);
    things.add(boxGeo(V(2.3, TABLE_Y, -1.62), V(2.42, TABLE_Y + 0.03, -1.48)), M.metal); // seed tray
    // workbench along the left wall with the bomb nose cone and a toolbox
    things.add(boxGeo(V(-3.95, 0.86, -0.7), V(-3.05, 0.92, 1.1)), M.top);
    for (const [x, z] of [[-3.9, -0.65], [-3.1, -0.65], [-3.9, 1.05], [-3.1, 1.05]]) things.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.86, z + 0.04)), M.wood);
    const cone = new THREE.ConeGeometry(0.22, 0.55, 24); cone.translate(-3.4, 0.92 + 0.275, 0.15); things.add(cone, M.cone);
    things.add(boxGeo(V(-3.85, 0.92, 0.6), V(-3.45, 1.08, 0.85)), M.jarA);
    // shelves with jars and books on the left wall
    for (const y of [1.55, 2.05]) things.add(boxGeo(V(-3.98, y - 0.03, -2.4), V(-3.7, y, -0.9)), M.wood);
    [[-2.25, M.jarA], [-2.0, M.jarB], [-1.75, M.jarC], [-1.45, M.jarB]].forEach(([z, m], i) => {
      const c = new THREE.CylinderGeometry(0.07, 0.07, 0.18 + (i % 2) * 0.06, 14); c.translate(-3.84, 1.55 + 0.09 + (i % 2) * 0.03, z as number); things.add(c, m as THREE.Material);
    });
    [M.book1, M.book2, M.book3, M.book1, M.book3].forEach((m, i) => things.add(boxGeo(V(-3.95, 2.05, -2.3 + i * 0.09), V(-3.75, 2.31 - (i % 2) * 0.04, -2.23 + i * 0.09)), m));
    // blackboard and clock on the right wall
    things.add(boxGeo(V(3.93, 1.12, 0.1), V(4, 2.28, 2.1)), M.wood);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.06), new THREE.MeshBasicMaterial({ map: boardTex(), color: new THREE.Color(0.85, 0.85, 0.85) }));
    board.rotateY(-Math.PI / 2); board.position.set(3.92, 1.7, 1.1); R.add(board);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), new THREE.MeshBasicMaterial({ map: clockTex() }));
    face.rotateY(-Math.PI / 2); face.position.set(...CLOCK); R.add(face);
    const rim = new THREE.TorusGeometry(0.21, 0.025, 8, 40); rim.rotateY(Math.PI / 2); rim.translate(CLOCK[0] - 0.01, CLOCK[1], CLOCK[2]); things.add(rim, M.dark);
    for (const [len, w] of [[0.16, 0.014], [0.11, 0.022]]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.01, len, w), new THREE.MeshBasicMaterial({ color: "#241726" }));
      h.geometry.translate(0, len / 2 - 0.02, 0);
      const g = new THREE.Group(); g.position.set(CLOCK[0] - 0.02, CLOCK[1], CLOCK[2]); g.add(h); R.add(g);
      this.hands.push(g);
    }
    // CC0 furniture (Kenney Furniture Kit): bookcases, desk chair, floor lamp, plants, rug, boxes, radio, coat rack, fan
    const glow = new Batch(), P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("bookcaseOpen", -0.3, 0, -2.82, 1.95); P("bookcaseOpen", 0.55, 0, -2.82, 1.95);
    for (const [x, y] of [[-0.45, 0.5], [-0.15, 0.95], [0.4, 0.5], [0.7, 1.4], [-0.3, 1.4]]) P("books", x, y, -2.8, 0.2);
    P("chairDesk", -2.0, 0, -1.7, 0.95, Math.PI);
    P("lampSquareFloor", 0.95, 0, -2.75, 1.7);
    P("lampRoundTable", -2.2, DESK_Y, -2.5, 0.45, 0.3);
    P("pottedPlant", -3.55, 0, -2.6, 1.15); P("plantSmall1", -1.9, 1.15, -2.94, 0.32); P("plantSmall3", 3.55, 0, -0.4, 0.55);
    placeProp(walls, glow, kit, "rugRectangle", 0.2, 0.004, -0.3, { w: 2.8 });
    P("cardboardBoxClosed", -3.55, 0, 1.6, 0.5); P("cardboardBoxClosed", -3.55, 0.5, 1.6, 0.45, 0.4); P("cardboardBoxOpen", -3.05, 0, 2.05, 0.5, 0.3);
    P("radio", -3.55, 0.92, -0.35, 0.3, Math.PI / 2);
    P("coatRackStanding", 3.55, 0, 2.5, 1.75);
    P("trashcan", -3.55, 0, -1.55, 0.5);
    P("sideTableDrawers", 3.4, 0, -2.65, 0.75); P("books", 3.4, 0.75, -2.65, 0.18, 0.5);
    P("ceilingFan", 0.2, 2.85, -0.5, 0.35);
    walls.build(R, false);
    things.build(R, true);
    glow.build(R, false);
  }

  protected tick(id: number, f: number) {
    this.view.map = isNight(id) ? nightTex("lab", false) : outsideTex();
    // clock: hands creep, then spin on "forty-five" (shot 10)
    const spin = id === 10 ? Math.max(0, f - 1069) * 0.55 : 0;
    this.hands[0].rotation.x = -(rad(60) + f * 0.004 + spin * 12);
    this.hands[1].rotation.x = -(rad(250) + f * 0.0004 + spin);
  }
  protected stage(id: number, f: number, light: number) { return labStage(id, f, light); }
}

// ---------------- who stands where, per shot ----------------
const fred = (x: number, z: number, o: FrontOpts) => personAt("FRED", FRED, x, z, o, drawFred);

/** the three pigeons at the training table: lead (cap), scarf, tuft (the stubborn third) */
const P_LEAD: V3 = [2.0, TABLE_Y, -1.55], P_SCARF: V3 = [2.2, TABLE_Y, -1.33], P_TUFT: V3 = [1.78, TABLE_Y, -1.77];

export const labStage = (id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  const P = (key: string, at: V3, o: PigeonOpts, mirror = false, scale = 1) => {
    out.places.push(pigeonAt(key, at, { light, ...o }, mirror, scale));
    contact(out, at[0], at[1], at[2], 0.22 * scale);
  };
  const lt = q(light);
  if (id === 3) {
    const expr = f >= 381 - LEAD ? "grin" : f >= 328 - LEAD ? "smile" : "neutral";
    // thinks (hand at the cheek) while he looks at the pigeon, then points at it: "That's a computer"
    const arms: FrontOpts["arms"] = f >= 381 - LEAD ? ["point", "hang"] : f >= 328 - LEAD ? ["hang", "cheek"] : ["hang", "hang"];
    out.places.push(fred(-0.45, -2.0, { expr, facing: -1, look: f >= 328 - LEAD ? -1 : 0, blink: blinkAt(f, 1), light: lt, arms }));
    contact(out, -0.45, 0, -2.0, 0.6);
    const nod = f >= 343 && f < 351 ? Math.sin(((f - 343) / 8) * Math.PI) : 0;
    P("desk", [-1.2, DESK_Y, -2.2], { look: "neutral", nod, scarf: false }, false, 1.1);
    if (f >= 381 - LEAD) card(out, `idea|${q(clamp01((f - 379) / 12))}`, 300, 300, (p) => fxIdea(p, clamp01((f - 379) / 12)), -0.42, 2.12, -2.0, 0.32);
  } else if (id === 5) {
    const hits = [584, 598], k = hits.reduce((m, h) => Math.max(m, clamp01(1 - Math.abs(f - (h - 1)) / 5)), 0);
    out.places.push(fred(-2.75, 0.2, { expr: "stern", facing: -1, prop: ["hammer", q(k)], blink: blinkAt(f, 1), light: lt }));
    contact(out, -2.75, 0, 0.2, 0.6);
    for (const h of hits) if (f >= h - 1 && f < h + 14) { const t = q((f - h + 1) / 14); card(out, `puff|${t}`, 300, 260, (p) => fxPuff(p, t), -3.3, 1.05, 0.25, 0.5, true); }
  } else if (id === 7) {
    ([[P_LEAD, 750, { cap: true }], [P_SCARF, 754, { scarf: true }], [P_TUFT, 758, { tuft: true }]] as const).forEach(([at, t0, acc], i) => {
      if (f < t0 - LEAD) return;
      const pop = 0.4 + 0.6 * ease.back((f - (t0 - LEAD)) / 6); // pops in with an overshoot (kit motion.js)
      P(`p${i}`, at, { ...acc, look: "focus", peck: i === 0 ? peckAt(f, 798) : 0 }, false, Math.max(0.6, pop));
    });
    if (f >= 798 && f < 816) { const t = q((f - 798) / 18); card(out, `seeds|${t}`, 300, 200, (p) => fxSeeds(p, t), 2.3, TABLE_Y + 0.08, -1.55, 0.25, true); }
  } else if (id === 10) {
    const peck = 0.5 + 0.5 * Math.sin((f * 2 * Math.PI) / 5);
    P("lead", P_LEAD, { cap: true, look: "focus", peck });
    card(out, `speed|${q(0.7 + 0.3 * Math.sin(f))}`, 400, 300, (p) => fxSpeed(p, 0.7 + 0.3 * Math.sin(f)), P_LEAD[0] + 0.05, TABLE_Y + 0.2, P_LEAD[2] + 0.05, 0.45);
  } else if (id === 11) {
    const turned = f >= 1137 - LEAD;
    P("lead", P_LEAD, { cap: true, look: turned ? "shock" : "focus", peck: turned ? 0 : peckAt(f, 1110 + 8 * Math.floor((f - 1102) / 8)) });
    P("scarf", P_SCARF, { scarf: true, look: turned ? "shock" : "focus", peck: turned ? 0 : peckAt(f, 1114 + 8 * Math.floor((f - 1102) / 8)) });
    P("tuft", P_TUFT, { tuft: true, look: "focus", peck: turned ? 0 : peckAt(f, 1112 + 8 * Math.floor((f - 1102) / 8)) }, true);
  } else if (id === 12) {
    const nod = f >= 1196 - LEAD && f < 1214 ? Math.sin(((f - 1194) / 18) * Math.PI * 2) : 0;
    const fed = f >= 1266 - LEAD;
    // Fred walks in from the left ("Fred thought of that") and stops by the table
    const w = glide((f - 1158) / 34), fxp = 0.2 + 0.85 * w, walking = w < 1;
    // arrives, hand on the hip; reaches out with the seed cup when the two good birds get fed
    const arms: FrontOpts["arms"] = f >= 1262 - LEAD && f < 1300 ? ["hang", "reach"] : ["hip", "hang"];
    out.places.push(fred(fxp, -1.25, { expr: fed ? "stern" : "smile", facing: 1, blink: blinkAt(f, 1), light: lt,
      ...(walking ? { mode: "stroll" as const, phase: q(((f - 1158) / 16) % 1) } : { arms }) }));
    contact(out, fxp, 0, -1.25, 0.6);
    P("lead", P_LEAD, { cap: true, look: fed ? "happy" : "neutral", nod });
    P("scarf", P_SCARF, { scarf: true, look: fed ? "happy" : "neutral", nod });
    P("tuft", P_TUFT, { tuft: true, look: fed ? "sulk" : "neutral" }, true);
    if (fed && f < 1290) { const t = q((f - 1264) / 26); card(out, `seeds|${t}`, 300, 200, (p) => fxSeeds(p, t), 1.95, TABLE_Y + 0.1, -1.48, 0.3, true); }
    if (f >= 1268 - LEAD) card(out, `rain|${q(((f - 1266) / 30) % 1)}`, 400, 300, (p) => fxRain(p, ((f - 1266) / 30) % 1), P_TUFT[0], TABLE_Y + 0.55, P_TUFT[2], 0.32);
  } else if (id === 15) {
    const u = (f - 1536) / (1655 - 1536), period = 10 - 6 * u, peck = 0.5 + 0.5 * Math.sin((2 * Math.PI * (f - 1536)) / period);
    out.places.push(fred(0.8, -1.0, { expr: f >= 1586 - LEAD ? "grin" : "smile", facing: 1, blink: blinkAt(f, 1), light: lt }));
    contact(out, 0.8, 0, -1.0, 0.6);
    P("lead", P_LEAD, { cap: true, look: "focus", peck });
    P("scarf", P_SCARF, { scarf: true, look: "focus", peck: 0.5 + 0.5 * Math.sin((2 * Math.PI * (f - 1538)) / period) });
    P("tuft", P_TUFT, { tuft: true, look: "focus", peck: 0.5 + 0.5 * Math.sin((2 * Math.PI * (f - 1540)) / period) });
    if (f >= 1586 - LEAD && f < 1606) { const t = q((f - 1584) / 20); card(out, `seeds|${t}`, 300, 200, (p) => fxSeeds(p, t), 2.0, TABLE_Y + 0.12, -1.5, 0.3, true); }
    const sp = clamp01((f - 1560) / 80);
    if (sp > 0) card(out, `speed|${q(sp)}`, 400, 300, (p) => fxSpeed(p, sp), P_LEAD[0] + 0.05, TABLE_Y + 0.2, P_LEAD[2] + 0.05, 0.45);
  }
  if (id === 8) {
    // the three pilots at the screen chasing the drifting target; pecks alternate
    const pk = (o: number) => (0.5 + 0.5 * Math.sin((2 * Math.PI * (f + o)) / 10));
    const nod = 0;
    P("lead", P_LEAD, { cap: true, look: "focus", peck: pk(0), nod });
    P("scarf", P_SCARF, { scarf: true, look: "focus", peck: pk(3), nod });
    P("tuft", P_TUFT, { tuft: true, look: "focus", peck: pk(6), nod });
  } else if (id === 6) {
    P("lead", P_LEAD, { cap: true, look: "focus", peck: peckAt(f, 716) });
  }
  return out;
};

