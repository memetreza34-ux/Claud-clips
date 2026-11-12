// The Washington office: shots 4 (committee), 13 (pigeon on the war map, golden), 16 (project stamped shut) and 17
// (calendar pages, revived, replaced by electronics). Room x -4..4, z -3..3 like the lab: long committee table in the
// middle, map table on the right, filing cabinet on the left, two tall windows and a wall calendar on the back wall.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit } from "./build";
import { placeProp } from "./props";
import { ctex, planksHD } from "./paint";
import { wallpaperTex, panelTex, grainTex, nightTex, plasterTex } from "./ptex";
import { fxPuff, FrontOpts } from "./toon";
import { NOINK } from "./ink";
import { drawFred, FRED, COMMITTEE, OFFICERS, fxSeeds, fxBag, fxStamp, fxFolder, fxPage, fxIdea } from "./pcast";
import { Pen } from "./toon";
/** small gold trophy cup on a 300 x 400 canvas */
const fxTrophy = (p: Pen) => {
  p.poly([[70, 60], [230, 60], [210, 190], [150, 230], [90, 190]], "#f2c94c", 9);
  p.arc(70, 110, 40, 45, 90, 270, 12); p.arc(230, 110, 40, 45, -90, 90, 12);
  p.poly([[135, 225], [165, 225], [170, 300], [130, 300]], "#e0b440", 8);
  p.poly([[90, 300], [210, 300], [220, 350], [80, 350]], "#5a3b2a", 9);
};
import { RoomWorld, ShotCam, Stage, V3, camOf, dofOf, roomShell, pigeonAt, personAt, contact, card, flatCard, clamp01, rad, LEAD, q, blinkAt, glide, isNight, ease } from "./room";

// ---------------- cameras ----------------
const CAMS: Record<number, ShotCam> = {
  2: { keys: [{ f: 152, pos: [1.0, 1.7, 2.1], look: [2.7, 1.1, -0.3], fov: 42 }], creep: 0.001, kicks: [220], cInf: [9] },
  18: { keys: [{ f: 1882, pos: [0.0, 1.5, 1.8], look: [0.0, 1.6, -2.4], fov: 46 }], creep: 0.001, punch: [1951], cInf: [8] },
  19: { keys: [{ f: 1998, pos: [0.0, 1.9, 0.6], look: [0.0, 2.1, -2.95], fov: 42 }], creep: 0.002, punch: [2012], cInf: [6] },
  20: { keys: [{ f: 2056, pos: [0.1, 1.35, 0.6], look: [0.0, 0.95, -1.2], fov: 42 }], creep: 0.001, punch: [2105], cInf: [10] },
  4: { keys: [{ f: 409, pos: [-1.5, 1.5, 1.6], look: [-0.9, 1.4, -2.0], fov: 36 },
    { f: 452, dur: 30, pos: [0.1, 1.5, 1.6], look: [0.3, 1.4, -2.0], fov: 36 },
    { f: 515, dur: 22, pos: [-0.5, 1.55, 1.9], look: [-0.7, 1.05, -1.3], fov: 50 }], creep: 0.0008, cInf: [9, 9, 7] },
  13: { keys: [{ f: 1335, pos: [1.0, 1.7, 2.1], look: [2.7, 0.95, 0.0], fov: 40 }], creep: 0.001, punch: [1410], cInf: [10] },
  16: { keys: [{ f: 1655, pos: [0.25, 1.5, 0.9], look: [0.0, 1.0, -1.5], fov: 40 }], creep: 0.001, kicks: [1686], cInf: [10] },
  17: { keys: [{ f: 1751, pos: [0.3, 1.55, 1.6], look: [0.4, 1.3, -1.8], fov: 50 },
    { f: 1835, dur: 20, pos: [0.45, 1.4, 1.1], look: [0.8, 1.05, -1.3], fov: 46 }], creep: 0.0006, kicks: [1826], cInf: [6, 9] },
};
export const officeCam = camOf(CAMS);
export const officeDof = dofOf(CAMS);

// ---------------- painted textures ----------------
const cityTex = () => ctex("officeCity", 512, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#4f8cdb"); gr.addColorStop(0.6, "#b8d0ec"); gr.addColorStop(1, "#d6e4f2");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  for (const [x, w, h, c] of [[0, 160, 420, "#d9cdb6"], [150, 120, 520, "#e6dcc8"], [260, 140, 380, "#cbbda4"], [390, 140, 470, "#ddd2bd"]] as const) {
    g.fillStyle = c; g.fillRect(x, 1024 - h, w, h);
    g.fillStyle = "rgba(60,70,100,0.35)"; for (let y = 1024 - h + 30; y < 1000; y += 50) for (let xx = x + 16; xx < x + w - 20; xx += 34) g.fillRect(xx, y, 16, 26);
  }
  g.fillStyle = "#f6f3ea"; for (const [x, y] of [[120, 160], [180, 140], [240, 165]]) { g.beginPath(); g.arc(x, y, 40, 0, Math.PI * 2); g.fill(); }
});
const mapTex = () => ctex("officeMap", 512, 384, (g) => {
  g.fillStyle = "#9cc3d9"; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#d8c58e"; g.strokeStyle = "#5a4a3a"; g.lineWidth = 4;
  for (const pts of [[[0, 60], [140, 40], [200, 120], [160, 230], [60, 260], [0, 240]], [[300, 0], [512, 0], [512, 200], [420, 240], [330, 160], [290, 70]], [[220, 300], [330, 270], [380, 330], [300, 384], [200, 384]]]) {
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
  }
  g.strokeStyle = "#c0353a"; g.lineWidth = 9; g.lineCap = "round";
  for (const [a, b] of [[[170, 160], [320, 120]], [[230, 250], [330, 300]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.fillStyle = "#3f6fb5"; for (const [x, y] of [[120, 140], [400, 90], [290, 320]]) { g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); }
});
const calTex = () => ctex("officeCal", 256, 320, (g) => {
  g.fillStyle = "#fbf8ef"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#c0353a"; g.fillRect(0, 0, 256, 70);
  g.fillStyle = "#e6e0d2"; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) g.fillRect(16 + c * 39, 86 + r * 44, 30, 34);
  g.strokeStyle = "#241726"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 314);
});
const portraitTex = () => ctex("officePortrait", 256, 320, (g) => {
  g.fillStyle = "#3d4a3a"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#2e3340"; g.beginPath(); g.ellipse(128, 300, 100, 90, 0, Math.PI, 0); g.fill();
  g.fillStyle = "#f0d2b0"; g.beginPath(); g.ellipse(128, 150, 62, 70, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#241726"; g.lineWidth = 5; g.beginPath(); g.ellipse(128, 150, 62, 70, 0, 0, Math.PI * 2); g.stroke();
  // Fred: brown hair, round glasses, small smile
  g.fillStyle = "#5b4a3c"; g.beginPath(); g.ellipse(128, 112, 64, 36, 0, Math.PI, 0); g.fill();
  g.lineWidth = 4; for (const x of [104, 152]) { g.beginPath(); g.arc(x, 152, 15, 0, Math.PI * 2); g.stroke(); g.fillStyle = "#241726"; g.beginPath(); g.arc(x, 152, 4, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.moveTo(119, 150); g.lineTo(137, 150); g.stroke();
  g.beginPath(); g.arc(128, 182, 14, 0.2, Math.PI - 0.2); g.stroke();
});

// ---------------- the room ----------------
const TABLE_Y = 0.78, MAP_Y = 0.84;

export class OfficeWorld extends RoomWorld {
  private box = new THREE.Group();
  private views: THREE.MeshBasicMaterial[] = [];
  private lights: THREE.MeshBasicMaterial[] = [];

  constructor(kit: Kit) {
    super(officeCam);
    const R = this.root, walls = new Batch(), things = new Batch();
    const M = {
      floor: lam("offFloor", () => ({ map: planksHD(), color: "#d4a77c" })),
      low: lam("offLowP", () => ({ map: panelTex("#94704f") })),
      wall: lam("offWallP", () => ({ map: wallpaperTex("#e2e8d4", "#c9d4b8") })),
      rail: lam("offRail", () => ({ color: "#4e3423" })),
      ceil: lam("offCeilP", () => ({ map: plasterTex("#efe8d8") })),
      table: lam("offTableG", () => ({ map: grainTex("#86593b") })),
      leg: lam("offLeg", () => ({ color: "#4a3020" })),
      blotter: lam("offBlotter", () => ({ color: "#3f6b4f" })),
      frame: lam("offFrame", () => ({ color: "#f3efe4" })),
      gold: lam("offGold", () => ({ color: "#c9a24a" })),
      cab: lam("offCab", () => ({ color: "#7d8a78" })),
      chair: lam("offChair", () => ({ color: "#7a3b2e" })),
      box: lam("offBox", () => ({ color: "#59606e" })),
      glass: lam("offGlass", () => ({ color: "#cfe6f2" })),
    };
    roomShell(walls, things, { floor: M.floor, low: M.low, wall: M.wall, rail: M.rail, ceil: M.ceil }, [[-3.3, -2.3, 1.2, 2.75], [2.3, 3.3, 1.2, 2.75]], [2.4, 1.8]);
    // two tall windows with frames and the city behind them
    for (const xc of [-2.8, 2.8]) {
      for (const [a, b] of [[V(xc - 0.56, 1.12, -3.05), V(xc + 0.56, 1.2, -2.86)], [V(xc - 0.56, 2.75, -3.05), V(xc + 0.56, 2.83, -2.94)],
        [V(xc - 0.56, 1.2, -3.05), V(xc - 0.5, 2.75, -2.94)], [V(xc + 0.5, 1.2, -3.05), V(xc + 0.56, 2.75, -2.94)],
        [V(xc - 0.03, 1.2, -3.02), V(xc + 0.03, 2.75, -2.98)], [V(xc - 0.5, 1.95, -3.02), V(xc + 0.5, 2.01, -2.98)]] as const) things.add(boxGeo(a, b), M.frame);
      const view = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), new THREE.MeshBasicMaterial({ map: cityTex() }));
      this.views.push(view.material);
      view.position.set(xc, 1.9, -3.4); view.layers.set(NOINK); R.add(view);
    }
    // portrait (gold frame) and wall calendar on the back wall
    things.add(boxGeo(V(-0.55, 1.45, -3.0), V(0.55, 2.75, -2.96)), M.gold);
    const por = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.18), new THREE.MeshBasicMaterial({ map: portraitTex(), color: new THREE.Color(0.85, 0.85, 0.85) }));
    por.position.set(0, 2.1, -2.955); R.add(por);
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ map: calTex(), color: new THREE.Color(0.9, 0.9, 0.9) }));
    cal.position.set(1.4, 1.95, -2.955); R.add(cal);
    // long committee table with blotters, chairs behind it
    things.add(boxGeo(V(-1.6, TABLE_Y - 0.06, -1.7), V(1.6, TABLE_Y, -0.9)), M.table);
    things.add(boxGeo(V(-1.6, 0.2, -1.66), V(1.6, TABLE_Y - 0.06, -1.62)), M.table); // modesty panel
    for (const [x, z] of [[-1.55, -1.65], [1.55, -1.65], [-1.55, -0.95], [1.55, -0.95]]) things.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, TABLE_Y - 0.06, z + 0.05)), M.leg);
    for (const x of [-0.9, 0, 0.9]) {
      things.add(boxGeo(V(x - 0.22, TABLE_Y, -1.55), V(x + 0.22, TABLE_Y + 0.006, -1.25)), M.blotter);
      things.add(boxGeo(V(x - 0.24, 0, -2.45), V(x + 0.24, 1.25, -2.38)), M.chair);
    }
    // map table on the right with the painted war map lying on it
    things.add(boxGeo(V(1.9, MAP_Y - 0.06, -0.5), V(3.5, MAP_Y, 0.6)), M.table);
    for (const [x, z] of [[1.95, -0.45], [3.45, -0.45], [1.95, 0.55], [3.45, 0.55]]) things.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, MAP_Y - 0.06, z + 0.05)), M.leg);
    const map = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshBasicMaterial({ map: mapTex(), color: new THREE.Color(0.9, 0.9, 0.9) }));
    map.rotateX(-Math.PI / 2); map.position.set(2.7, MAP_Y + 0.003, 0.05); R.add(map);
    // filing cabinet on the left wall: four drawers with handles
    things.add(boxGeo(V(-3.95, 0, -2.45), V(-3.35, 1.35, -1.85)), M.cab);
    for (let i = 0; i < 4; i++) {
      const y = 0.12 + i * 0.32;
      things.add(boxGeo(V(-3.35, y, -2.4), V(-3.33, y + 0.28, -1.9)), M.cab);
      things.add(boxGeo(V(-3.33, y + 0.18, -2.2), V(-3.3, y + 0.21, -2.1)), M.gold);
    }
    // electronics box for the ending (shot 17): grey case, dial, four lamps that blink in tick()
    const bb = new Batch();
    bb.add(boxGeo(V(-0.2, 0, -0.14), V(0.2, 0.3, 0.14)), M.box);
    const dial = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20); dial.rotateX(Math.PI / 2); dial.translate(-0.1, 0.18, 0.15); bb.add(dial, M.glass);
    bb.build(this.box, true);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.MeshBasicMaterial({ color: "#ffcc33" });
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), m);
      l.position.set(0.02 + (i % 2) * 0.09, 0.1 + Math.floor(i / 2) * 0.1, 0.145); this.box.add(l); this.lights.push(m);
    }
    this.box.position.set(0.72, TABLE_Y, -1.15); this.box.visible = false; R.add(this.box);
    // CC0 furniture: bookcases on the left wall, plants and lamps by the windows, rugs, coat rack, radio, books
    const glow = new Batch(), P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("bookcaseClosedDoors", -3.8, 0, -0.5, 1.95, Math.PI / 2); P("bookcaseClosedWide", -3.82, 0, 0.9, 1.6, Math.PI / 2);
    P("pottedPlant", -1.85, 0, -2.72, 1.2); P("pottedPlant", 1.9, 0, -2.72, 1.2);
    P("lampSquareFloor", 3.6, 0, -2.6, 1.75); P("lampRoundFloor", -3.6, 0, -1.45, 1.7);
    placeProp(walls, glow, kit, "rugRectangle", 0, 0.004, -1.25, { w: 3.8 });
    placeProp(walls, glow, kit, "rugRound", 2.7, 0.004, 0.05, { w: 2.0 });
    P("coatRackStanding", -3.5, 0, 2.3, 1.75);
    P("radio", -3.65, 1.35, -2.15, 0.3, Math.PI / 2);
    P("books", 3.3, MAP_Y, 0.45, 0.16, 0.4); P("books", -1.3, TABLE_Y, -1.55, 0.14, -0.3);
    P("lampRoundTable", 1.35, TABLE_Y, -1.6, 0.42);
    P("speakerSmall", -3.6, 1.35, -2.35, 0.3, Math.PI / 2);
    walls.build(R, false);
    things.build(R, true);
    glow.build(R, false);
  }

  protected tick(id: number, f: number) {
    for (const v of this.views) v.map = isNight(id) ? nightTex("city", true) : cityTex();
    const t0 = 1844 - LEAD;
    this.box.visible = id === 17 && f >= t0;
    if (this.box.visible) {
      const s = 0.3 + 0.7 * ease.back((f - t0) / 6); // pops in with an overshoot
      this.box.scale.setScalar(s);
      const cols = ["#ff5a4a", "#ffcc33", "#5ad16a", "#5ab0ff"];
      this.lights.forEach((m, i) => m.color.set(((f >> 2) + i) % 3 ? cols[i] : "#3a3f4a"));
    }
  }
  protected stage(id: number, f: number, light: number) { return officeStage(id, f, light); }
}

// ---------------- who stands where, per shot ----------------
const lt = (l: number) => q(l);
const member = (i: number, o: FrontOpts) => personAt(`CM${i}`, COMMITTEE[i], [-0.9, 0, 0.9][i], -2.05, o);
const officer = (i: number, x: number, z: number, o: FrontOpts) => personAt(`OF${i}`, OFFICERS[i], x, z, o);
const fred = (x: number, z: number, o: FrontOpts) => personAt("FRED", FRED, x, z, o, drawFred);

export const officeStage = (id: number, f: number, light: number): Stage => {
  const out: Stage = { places: [], fx: [] }, L = lt(light);
  if (id === 4) {
    const shake = f >= 493 - LEAD && f < 510 ? 7 * Math.sin(((f - 491) / 6) * Math.PI * 2) * (1 - (f - 491) / 19) : 0;
    out.places.push(member(0, { expr: f >= 467 - LEAD ? "nervous" : "stern", blink: blinkAt(f, 2), light: L, arms: f >= 467 - LEAD && f < 520 ? ["hang", "temple"] : undefined }));
    out.places.push(member(1, { expr: f >= 493 - LEAD ? "stern" : "neutral", headTilt: q(shake), blink: blinkAt(f, 3), light: L, arms: f >= 493 - LEAD ? ["cross", "cross"] : undefined }));
    out.places.push(member(2, { expr: f >= 551 - LEAD ? "smile" : "neutral", blink: blinkAt(f, 4), light: L, arms: f >= 525 - LEAD && f < 552 ? ["reach", "hang"] : undefined }));
    out.places.push(fred(-2.15, -0.5, { expr: f >= 529 - LEAD ? "grin" : "neutral", facing: 1, look: 1, blink: blinkAt(f, 1), light: L, arms: f >= 547 - LEAD ? ["hang", "up"] : ["hang", "hang"] }));
    contact(out, -2.15, 0, -0.5, 0.6);
    // the money bag slides from the third member along the table toward Fred
    const u = ease.back((f - (527 - LEAD)) / 22, 1.2), x = 0.9 + (-1.35 - 0.9) * u; // slides, overshoots a little, settles
    card(out, "bag", 300, 300, fxBag, x, TABLE_Y + 0.17, -1.15, 0.36);
  } else if (id === 13) {
    out.places.push(officer(0, 2.3, -0.95, { expr: "stern", look: 1, blink: blinkAt(f, 5), light: L, arms: ["hip", "hip"] }));
    out.places.push(officer(1, 3.15, -0.95, { expr: "stern", look: -1, blink: blinkAt(f, 6), light: L, arms: ["cross", "cross"] }));
    const u = clamp01((f - 1335) / 95), x = 2.05 + 1.1 * u, step = Math.sin(((f - 1335) / 6) * Math.PI);
    const happy = f >= 1410 - LEAD;
    out.places.push(pigeonAt("map", [x, MAP_Y, 0.05], { light: L, look: happy ? "happy" : "neutral", nod: happy ? 0 : step * 0.5, cap: true }));
    contact(out, x, MAP_Y, 0.05, 0.22);
    if (happy && f < 1430) { const t = q((f - 1408) / 22); card(out, `seeds|${t}`, 300, 200, (p) => fxSeeds(p, t), x + 0.12, MAP_Y + 0.12, 0.1, 0.32, true); }
  } else if (id === 16) {
    out.places.push(officer(0, 0, -2.05, { expr: "stern", blink: blinkAt(f, 5), light: L, arms: f < 1686 - 12 ? ["hang", "lift"] : ["hip", "hang"] }));
    const hit = 1686 - 1, stamped = f >= hit;
    flatCard(out, `folder|${stamped}`, 400, 300, (p) => fxFolder(p, stamped), 0, TABLE_Y + 0.008, -1.2, 0.5);
    // wind-up then slam (kit anticipation), hold, then back up with a small spring
    const y = f < hit ? 1.08 - 0.22 * ease.anticip((f - (hit - 12)) / 12) : f < hit + 4 ? 0.86 : 0.86 + 0.22 * ease.spring((f - hit - 4) / 30, 1.2, 6);
    card(out, "stamp", 200, 300, fxStamp, 0.05, y + 0.15, -1.15, 0.2);
    if (f >= hit && f < hit + 14) { const t = q((f - hit) / 14); card(out, `puff|${t}`, 300, 260, (p) => fxPuff(p, t), 0.05, TABLE_Y + 0.1, -1.1, 0.6, true); }
  } else if (id === 17) {
    out.places.push(officer(0, -0.6, -2.05, { expr: f >= 1826 - LEAD ? "stern" : "neutral", blink: blinkAt(f, 5), light: L, arms: f >= 1826 - LEAD ? ["cross", "cross"] : ["hang", "hip"] }));
    out.places.push(officer(1, 0.6, -2.05, { expr: f >= 1844 - LEAD ? "shock" : "neutral", blink: blinkAt(f, 6), light: L, arms: f >= 1844 - LEAD ? ["up", "up"] : ["hang", "hang"] }));
    // calendar pages tear off and fly (time passing), from 1751
    for (let i = 0; i < 6; i++) {
      const t = (f - (1751 - LEAD) - i * 5) / 28;
      if (t < 0 || t > 1) continue;
      const x = 1.4 + 1.6 * t * (0.6 + 0.1 * i), y = 1.95 + 0.5 * Math.sin(t * Math.PI) - 0.6 * t * t, z = -2.9 + 1.8 * t;
      card(out, "page", 200, 240, fxPage, x, y, z, 0.2, false, rad(40 * t * (i % 2 ? 1 : -1) + i * 10));
    }
    // the folder comes back ("tried again"), is slammed shut ("gave up")
    if (f >= 1768 - LEAD) {
      flatCard(out, "folder|false", 400, 300, (p) => fxFolder(p, false), -0.3, TABLE_Y + 0.008, -1.2, 0.5, rad(-6));
      const hit = 1826 - 1;
      if (f >= hit && f < hit + 14) { const t = q((f - hit) / 14); card(out, `puff|${t}`, 300, 260, (p) => fxPuff(p, t), -0.3, TABLE_Y + 0.1, -1.1, 0.6, true); }
    }
    // the pigeons leave the table once electronics work
    if (f >= 1768) {
      const u = clamp01((f - 1846) / 34);
      ([[0, -0.15, { cap: true }], [1, -0.32, { scarf: true }], [2, -0.02, { tuft: true }]] as const).forEach(([i, dz, acc]) => {
        const x = -1.25 + i * 0.22 + 3.0 * u * u, step = u > 0 ? Math.sin(((f - 1846) / 5 + i) * Math.PI) * 0.5 : 0;
        out.places.push(pigeonAt(`out${i}`, [x, TABLE_Y, -1.2 + dz], { light: L, look: u > 0 ? "sulk" : "neutral", nod: step, ...acc }));
        contact(out, x, TABLE_Y, -1.2 + dz, 0.22);
      });
    }
  }
  if (id === 2) {
    out.places.push(officer(0, 2.3, -0.95, { expr: "stern", blink: blinkAt(f, 5), light: L, arms: ["hip", "hip"] }));
    out.places.push(officer(1, 3.15, -0.95, { expr: f >= 220 - LEAD ? "nervous" : "neutral", blink: blinkAt(f, 6), light: L, arms: f >= 220 - LEAD ? ["temple", "hang"] : ["hang", "hang"] }));
  } else if (id === 18) {
    const cheer = f >= 1951 - LEAD;
    for (const i of [0, 1, 2]) out.places.push(member(i, { expr: cheer ? "grin" : "smile", blink: blinkAt(f, 2 + i), light: L,
      arms: cheer ? (i === 1 ? ["up", "up"] : i === 0 ? ["thumb", "hang"] : ["hang", "thumb"]) : undefined }));
    if (f >= 1951 - LEAD) card(out, `idea|${q(clamp01((f - 1949) / 12))}`, 300, 300, (p) => fxIdea(p, clamp01((f - 1949) / 12)), 0.3, TABLE_Y + 0.55, -1.15, 0.3);
    card(out, "trophy", 300, 400, fxTrophy, 0, TABLE_Y + 0.2, -1.15, 0.3);
  } else if (id === 20) {
    card(out, "trophy", 300, 400, fxTrophy, -0.18, TABLE_Y + 0.2, -1.15, 0.3);
    if (f >= 2105 - LEAD) {
      const u = clamp01((f - 2103) / 8), y = TABLE_Y + 0.6 * (1 - u);
      out.places.push(pigeonAt("final", [0.12, y, -1.15], { light: L, look: "happy", cap: true }));
      if (u >= 1) contact(out, 0.12, TABLE_Y, -1.15, 0.22);
    }
  }
  return out;
};
