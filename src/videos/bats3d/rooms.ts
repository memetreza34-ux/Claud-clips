// Interior sets of the bat short, all in the pigeon room frame (x -4..4, z -3..3, camera side open):
//   5  OvalWorld    the President behind his desk: the letter, a raised brow, the forwarding note, the stamp
//   6  DentistWorld Lytle's practice: dental chair, lamp; he hangs the framed note next to his diploma
//   13/14 ReportWorld army office: typewriter close-up, the deadpan clerk, smoke past the window, the burnt sign
//   15 MapWorld     wall map: the dotted line stops at the US coast, the hero bat plants a victory flag
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit } from "../pigeon/build";
import { placeProp } from "../pigeon/props";
import { ctex } from "../pigeon/paint";
import { wallpaperTex, panelTex, plasterTex } from "../pigeon/ptex";
import { NOINK } from "../pigeon/ink";
import { FrontOpts, Pen } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, roomShell, personAt, contact, card, flatCard, clamp01, LEAD, q, blinkAt, ease, V3 } from "./broom";
import { LYTLE, drawLytle, drawBat } from "./bcast";
import { PRES, CLERK, fxLetter, fxHands, fxNote, fxStamp, fxFrame, fxReport, REPORT, fxBurntSign, fxMap, fxFlag } from "./bcast2";
import { BEAT } from "../bats/timing";

type Mats = { floor: THREE.Material; low: THREE.Material; wall: THREE.Material; rail: THREE.Material; ceil: THREE.Material };
const shellMats = (k: string, floor: string, low: string, wa: string, wb: string, rail = "#f3efe4", ceil = "#f2ead8"): Mats => ({
  floor: lam(k + "Floor", () => ({ color: floor })),
  low: lam(k + "Low", () => ({ map: panelTex(low) })),
  wall: lam(k + "Wall", () => ({ map: wallpaperTex(wa, wb) })),
  rail: lam(k + "Rail", () => ({ color: rail })),
  ceil: lam(k + "Ceil", () => ({ map: plasterTex(ceil) })),
});
/** a painted backdrop behind the window holes of the back wall */
const backdrop = (R: THREE.Object3D, key: string, top: string, bottom: string, w = 9, y = 2.2) => {
  const t = ctex("bd_" + key, 64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 4), new THREE.MeshBasicMaterial({ map: t }));
  m.position.set(0, y, -3.4); m.layers.set(NOINK); R.add(m);
};
const desk = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, top: THREE.Material, body: THREE.Material) => {
  b.add(boxGeo(V(x0, h - 0.05, z0), V(x1, h, z1)), top);
  b.add(boxGeo(V(x0 + 0.04, 0, z0 + 0.04), V(x1 - 0.04, h - 0.05, z1 - 0.04)), body);
};
const flagTex = () => ctex("roomFlag", 380, 200, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f4f4" : "#c8323a"; g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1); }
  g.fillStyle = "#2a4f9a"; g.fillRect(0, 0, 152, 108);
});
const lytle = (x: number, z: number, o: FrontOpts) => personAt("LYTLE", LYTLE, x, z, o, drawLytle);

// ======================= 5: the President's office =======================
const C5 = { a: 604, up: BEAT.zahnarzt - 6, down: 676, stamp: BEAT.spinner };
const CAMS5: Record<number, ShotCam> = {
  5: { keys: [{ f: C5.a, pos: [0.05, 0.95, -0.35], look: [0.0, 0.92, -1.6], fov: 40 },
    { f: C5.up, dur: 14, pos: [0.05, 1.12, -0.25], look: [0.0, 1.12, -2.05], fov: 36 },
    { f: C5.down, dur: 14, pos: [0.08, 1.8, -0.45], look: [0.08, 0.79, -1.12], fov: 46 }], creep: 0.0012, punch: [C5.up + 6], kicks: [C5.stamp], cInf: [8, 10, 7], drift: [0.03, 0.01, 0.06] },
};
export const ovalCam = camOf(CAMS5), ovalDof = dofOf(CAMS5);
const PRES_Z = -2.05;

export class OvalWorld extends RoomWorld {
  constructor(kit: Kit) {
    super(ovalCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    roomShell(walls, things, shellMats("oval", "#2e3d6a", "#8a6a4a", "#efe3c4", "#e2d2ae"), [[-3.0, -1.6, 1.3, 2.9], [1.6, 3.0, 1.3, 2.9]], [3, 2]);
    backdrop(R, "oval", "#7fb2e0", "#cfe6f4");
    desk(things, -1.15, 1.15, -1.62, -0.78, 0.78, lam("ovalTop", () => ({ color: "#4a2e1e" })), lam("ovalDesk", () => ({ color: "#6a4028" })));
    placeProp(things, glow, kit, "lampRoundTable", 0.82, 0.78, -1.4, { h: 0.5 });
    placeProp(things, glow, kit, "books", -0.8, 0.78, -1.45, { h: 0.18 });
    placeProp(things, glow, kit, "bookcaseClosedWide", -2.6, 0, -2.7, { h: 2.0 });
    const pole = new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8); pole.translate(-1.55, 1.15, -2.55); things.add(pole, lam("ovalPole", () => ({ color: "#d8b25a" })));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.42), new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide }));
    fl.position.set(-1.55 + 0.38, 2.0, -2.55); fl.layers.set(NOINK); R.add(fl);
    walls.build(R, false); things.build(R, true); glow.build(R, false);
  }
  protected stage(_id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    // sitting figures sit on the floor in the engine: lift them onto the chair height
    const pres = personAt("PRES", PRES, 0, PRES_Z, { mode: "sit", expr: f >= C5.up ? "stern" : "neutral", look: 0, blink: blinkAt(f, 3), light: q(light) });
    pres.y = 0.45; out.places.push(pres);
    // the letter held up in front of his chin, his hands on its lower corners (lowered once he writes the note)
    const lift = f < C5.down ? 0 : clamp01((f - C5.down) / 10);
    card(out, "letter", 360, 480, fxLetter, 0, 0.9 - 0.3 * lift, -1.55 - 0.1 * lift, 0.36);
    card(out, "hands", 520, 300, fxHands, 0, 0.74 - 0.3 * lift, -1.5 - 0.1 * lift, 0.5);
    // the note on the desk, written word by word, then stamped
    const k = clamp01((f - C5.down - 6) / (C5.stamp - C5.down - 14));
    flatCard(out, `note|${q(k)}`, 420, 260, fxNote(k), 0.08, 0.786, -1.12, 0.34, 0);
    if (f >= C5.stamp - 6) {
      const drop = clamp01((f - (C5.stamp - 6)) / 6);
      if (drop < 1) card(out, "stampBlock", 300, 140, fxStamp, 0.22, 1.1 - 0.3 * drop, -1.05, 0.22);
      else flatCard(out, "stampMark", 300, 140, fxStamp, 0.2, 0.788, -1.02, 0.22, 0.1);
    }
    return out;
  }
}

// ======================= 6: the dental practice =======================
const C6 = { a: 743, hung: 770, zoom: BEAT.einrahmen };
const CAMS6: Record<number, ShotCam> = {
  6: { keys: [{ f: C6.a, pos: [0.3, 1.45, 1.9], look: [0.3, 1.45, -2.5], fov: 44 }], creep: 0.001, punch: [C6.zoom, C6.zoom + 6], cInf: [6] },
};
export const dentistCam = camOf(CAMS6), dentistDof = dofOf(CAMS6);

export class DentistWorld extends RoomWorld {
  constructor(kit: Kit) {
    super(dentistCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    roomShell(walls, things, shellMats("dent", "#d8d0c0", "#f2f2ea", "#bfe3d6", "#a9d3c4"), [[2.0, 3.4, 1.4, 2.8]], [4, 3]);
    backdrop(R, "dent", "#9fd0f0", "#e0f0f8");
    const chrome = lam("dentChrome", () => ({ color: "#c9ccd2" })), seat = lam("dentSeat", () => ({ color: "#4fa8b2" }));
    // dental chair (left): pedestal, seat, tilted back, headrest, armrest; swing-arm lamp above it
    const ped = new THREE.CylinderGeometry(0.16, 0.24, 0.45, 16); ped.translate(-1.6, 0.225, -1.7); things.add(ped, chrome);
    things.add(boxGeo(V(-1.95, 0.45, -1.95), V(-1.25, 0.6, -1.25)), seat);
    const back = new THREE.BoxGeometry(0.7, 0.85, 0.14); back.rotateX(-0.45); back.translate(-1.6, 0.95, -2.12); things.add(back, seat);
    things.add(boxGeo(V(-1.78, 1.32, -2.42), V(-1.42, 1.48, -2.22)), seat);
    things.add(boxGeo(V(-1.25, 0.7, -1.9), V(-1.15, 0.78, -1.3)), chrome);
    things.add(boxGeo(V(-2.6, 0, -2.9), V(-2.5, 2.3, -2.8)), chrome);
    things.add(boxGeo(V(-2.6, 2.25, -2.9), V(-1.6, 2.32, -2.8)), chrome);
    const shade = new THREE.CylinderGeometry(0.22, 0.28, 0.12, 20); shade.translate(-1.6, 2.15, -2.0); things.add(shade, lam("dentLamp", () => ({ color: "#eef2f4" })));
    things.add(boxGeo(V(-1.64, 2.2, -2.85), V(-1.56, 2.3, -2.0)), chrome);
    placeProp(things, glow, kit, "sideTableDrawers", 1.5, 0, -2.6, { h: 0.85 });
    placeProp(things, glow, kit, "pottedPlant", 2.6, 0, -2.5, { h: 1.3 });
    placeProp(things, glow, kit, "plantSmall1", 1.4, 0.85, -2.6, { h: 0.3 });
    walls.build(R, false); things.build(R, true); glow.build(R, false);
  }
  protected stage(_id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    card(out, "diploma", 320, 400, fxFrame("diploma"), -0.2, 1.85, -2.94, 0.46);
    // he holds the frame up to the wall, lets go on "hung", steps back and admires it
    const back = ease.out((f - C6.hung) / 16), proud = f >= C6.zoom - LEAD;
    const x = 0.75 + 0.15 * back, z = -2.35 + 0.55 * back;
    if (f < C6.hung) card(out, "noteFrame", 320, 400, fxFrame("note"), 0.42, 1.78 + 0.02 * Math.sin(f / 3), -2.7, 0.46);
    else card(out, "noteFrame", 320, 400, fxFrame("note"), 0.42, 1.85, -2.94, 0.46);
    out.places.push(lytle(x, z, { expr: proud ? "grin" : "smile", arms: f < C6.hung ? ["lift", "lift"] : proud ? ["hip", "thumb"] : ["hang", "hang"], reachLift: 1, look: -0.6, blink: blinkAt(f, 5), light: q(light) }));
    contact(out, x, 0, z, 0.6);
    return out;
  }
}

// ======================= 13/14: the report =======================
const C13 = { a: 1646, up: 1706, done: BEAT.testmaterial };
const C14 = { a: 1770, turn: BEAT.stuetzpunkt - 6 };
const CLERK_Z = -1.78;
const CAMS13: Record<number, ShotCam> = {
  13: { keys: [{ f: C13.a, pos: [0.05, 1.22, -0.1], look: [0.0, 1.0, -1.0], fov: 40 },
    { f: C13.up, dur: 16, pos: [0.05, 1.32, 0.6], look: [0.0, 1.25, CLERK_Z], fov: 38 }], creep: 0.001, cInf: [10, 9], drift: [0.02, 0.01, 0.05] },
  14: { keys: [{ f: C14.a, pos: [0.35, 1.3, 0.5], look: [0.0, 1.22, CLERK_Z], fov: 38 }], creep: 0.0008, punch: [C14.turn + 4, BEAT.stuetzpunkt + 4], cInf: [9] },
};
export const reportCam = camOf(CAMS13), reportDof = dofOf(CAMS13);
const smokeTex = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 10, 128, 128, 124);
  gr.addColorStop(0, "rgba(60,48,52,0.75)"); gr.addColorStop(1, "rgba(60,48,52,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};

export class ReportWorld extends RoomWorld {
  constructor(kit: Kit) {
    super(reportCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    roomShell(walls, things, shellMats("rep", "#8a6a4a", "#7a7a52", "#e6dabc", "#d8caa6"), [[-1.0, 1.0, 1.25, 2.75]], [3, 2]);
    backdrop(R, "rep", "#f0a060", "#ffd8a0");
    desk(things, -0.95, 0.95, -1.35, -0.55, 0.76, lam("repTop", () => ({ color: "#5a4030" })), lam("repDesk", () => ({ color: "#6f6c46" })));
    // typewriter: body, keyboard steps, roller
    const tw = lam("repType", () => ({ color: "#2f4a3a" })), key = lam("repKey", () => ({ color: "#f2ead8" }));
    things.add(boxGeo(V(-0.22, 0.76, -1.08), V(0.22, 0.88, -0.78)), tw);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) things.add(boxGeo(V(-0.18 + c * 0.04, 0.885 + r * 0.012, -0.83 - r * 0.04), V(-0.155 + c * 0.04, 0.9 + r * 0.012, -0.81 - r * 0.04)), key);
    const roll = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 14); roll.rotateZ(Math.PI / 2); roll.translate(0, 0.92, -1.06); things.add(roll, tw);
    placeProp(things, glow, kit, "lampRoundTable", -0.7, 0.76, -1.1, { h: 0.45 });
    placeProp(things, glow, kit, "bookcaseClosedDoors", 2.4, 0, -2.7, { h: 1.9 });
    placeProp(things, glow, kit, "coatRackStanding", -2.2, 0, -2.6, { h: 1.8 });
    walls.build(R, false); things.build(R, true); glow.build(R, false);
  }
  protected stage(id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    // smoke drifting past the window behind him
    for (let i = 0; i < 6; i++) {
      const u = ((i / 6) + (f - 1646) * 0.0035) % 1;
      card(out, "smoke", 256, 256, smokeTex, -1.4 + 2.8 * u, 1.6 + 0.9 * u + 0.2 * Math.sin(i), -3.6, 1.2 + 0.6 * (i % 2), true);
    }
    const n = id === 13 ? Math.min(REPORT.length, Math.max(0, Math.floor((f - (C13.a + 10)) / 1.25 / 3) * 3)) : REPORT.length;
    card(out, `report|${n}`, 520, 620, fxReport(n), 0, 1.03, -1.0, 0.26);
    if (id === 14) flatCard(out, "burnt", 360, 140, fxBurntSign, 0.55, 0.765, -0.8, 0.34, -0.2);
    const turned = id === 14 && f >= C14.turn;
    const clerk = personAt("CLERK", CLERK, 0, CLERK_Z, { mode: "sit", expr: "neutral", look: turned ? 0 : -0.5, facing: turned ? 0 : -1, blink: blinkAt(f, 9), light: q(light) });
    clerk.y = 0.45; out.places.push(clerk);
    return out;
  }
}

// ======================= 15: the map =======================
const C15 = { a: 1885, push: 1950, flag: BEAT.amerika };
const CAMS15: Record<number, ShotCam> = {
  15: { keys: [{ f: C15.a, pos: [0.05, 1.8, 2.4], look: [0.05, 1.8, -2.9], fov: 46 },
    { f: C15.push, dur: 20, pos: [0.6, 1.85, 0.0], look: [0.7, 1.85, -2.9], fov: 42 }], creep: 0.001, punch: [C15.flag], cInf: [5, 6] },
};
export const mapCam = camOf(CAMS15), mapDof = dofOf(CAMS15);

export class MapWorld extends RoomWorld {
  constructor(kit: Kit) {
    super(mapCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    roomShell(walls, things, shellMats("map", "#6a5a48", "#5a6a4a", "#c9d2b8", "#b8c2a6"), [], [3, 2]);
    // map board on the back wall
    things.add(boxGeo(V(-1.3, 0.92, -3.0), V(1.3, 2.68, -2.96)), lam("mapBoard", () => ({ color: "#5a3a26" })));
    placeProp(things, glow, kit, "lampSquareFloor", -1.9, 0, -2.6, { h: 1.7 });
    placeProp(things, glow, kit, "plantSmall3", 1.8, 0, -2.6, { h: 0.7 });
    walls.build(R, false); things.build(R, true); glow.build(R, false);
  }
  protected stage(_id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    const dash = clamp01((f - (C15.a + 8)) / 50);
    card(out, `map|${q(dash)}`, 1200, 800, fxMap(dash), 0, 1.8, -2.95, 2.4);
    // the hero bat sitting on the USA, planting its flag on "Amerika"
    const flap = f >= C15.flag - LEAD && f < C15.flag + 10 ? 0.8 : 0.2;
    out.places.push({ key: `BAT|map|${flap}|${blinkAt(f, 2)}`, x: 0.8, y: 1.66, z: -2.86, scale: 0.34,
      draw: (p: Pen) => drawBat(p, { look: "smug", hero: true, flap, blink: blinkAt(f, 2), light }) });
    if (f >= C15.flag - LEAD) {
      const pop = ease.back((f - (C15.flag - LEAD)) / 8);
      card(out, "vflag", 160, 260, fxFlag, 0.98, 1.84, -2.85, 0.16 * pop);
    }
    return out;
  }
}
export type { V3 };
