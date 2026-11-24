// More bat-short sets:
//   7/8 BatLabWorld  army lab: a bat and its firebomb on a balance (it tips toward the bomb), the fridge opens on bats
//                    asleep in ice cube trays; shot 8 is an extreme close-up of one sleeping bat whose eye snaps open
//   11  CutawayWorld night cutaway of an attic: a target on one side, a cosy dark corner on the other; the bat picks the corner
//   12  BedroomWorld night bedroom: the cat pops out of its box and zips under the bed; two eyes glow from the dark
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, tri } from "../pigeon/build";
import { placeProp } from "../pigeon/props";
import { ctex } from "../pigeon/paint";
import { wallpaperTex, panelTex, plasterTex, nightTex } from "../pigeon/ptex";
import { NOINK } from "../pigeon/ink";
import { Pen } from "../pigeon/toon";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, roomShell, card, clamp01, LEAD, q, blinkAt, ease, rad, V3 } from "./broom";
import { drawBat, BatOpts } from "./bcast";
import { drawCat, fxEyes, fxFrost, fxTarget, fxSpeed } from "./bcast2";
import { BEAT } from "../bats/timing";

const shellMats = (k: string, floor: string, low: string, wa: string, wb: string) => ({
  floor: lam(k + "Floor", () => ({ color: floor })),
  low: lam(k + "Low", () => ({ map: panelTex(low) })),
  wall: lam(k + "Wall", () => ({ map: wallpaperTex(wa, wb) })),
  rail: lam(k + "Rail", () => ({ color: "#f3efe4" })),
  ceil: lam(k + "Ceil", () => ({ map: plasterTex("#eee6d4") })),
});
const bat = (key: string, at: V3, scale: number, o: BatOpts, roll = 0) => ({
  key: `BAT|${key}|${JSON.stringify(o)}`, x: at[0], y: at[1], z: at[2], scale, roll, draw: (p: Pen) => drawBat(p, o) });

// ======================= 7/8: the lab =======================
const C7 = { a: 834, tip: BEAT.schwerer, fridge: 952, open: BEAT.kuehlschrank - 14 };
const C8 = { a: 1001, snap: BEAT.frueh };
const PIVOT: V3 = [-0.45, 1.32, -1.1], ARM = 0.24;
const FRIDGE_X = 1.9, FRIDGE_Z = -2.2, HERO: V3 = [FRIDGE_X - 0.02, 1.02, FRIDGE_Z + 0.08];
const CAMS7: Record<number, ShotCam> = {
  7: { keys: [{ f: C7.a, pos: [-0.4, 1.4, 0.6], look: [-0.45, 1.15, -1.1], fov: 46 },
    { f: C7.fridge, dur: 16, pos: [1.85, 1.25, 0.6], look: [1.9, 1.0, -2.3], fov: 44 }], creep: 0.001, punch: [C7.tip, BEAT.kuehlschrank], cInf: [10, 8] },
  8: { keys: [{ f: C8.a, pos: [HERO[0] + 0.02, HERO[1] + 0.1, HERO[2] + 0.62], look: [HERO[0], HERO[1] + 0.08, HERO[2]], fov: 32 }], creep: 0.0025, punch: [C8.snap], cInf: [14], drift: [0.01, 0, 0.04] },
};
export const labCam = camOf(CAMS7), labDof = dofOf(CAMS7);
const tilt = (f: number) => -rad(13) * ease.back((f - (C7.tip - LEAD - 4)) / 10);

export class BatLabWorld extends RoomWorld {
  private beam = new THREE.Group();
  private pans: THREE.Mesh[] = [];
  private door = new THREE.Group();
  constructor(kit: Kit) {
    super(labCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    roomShell(walls, things, shellMats("blab", "#7a7468", "#5a6a4a", "#a8ba92", "#97aa82"), [], [4, 3]);
    const brass = lam("blabBrass", () => ({ color: "#d8b25a" })), white = lam("blabWhite", () => ({ color: "#eef2f4" })), inner = lam("blabInner", () => ({ color: "#cfe6f0" }));
    // workbench with the balance
    things.add(boxGeo(V(-1.6, 0.86, -1.6), V(0.6, 0.92, -0.65)), lam("blabTop", () => ({ color: "#8a6a4a" })));
    things.add(boxGeo(V(-1.55, 0, -1.55), V(0.55, 0.86, -0.7)), lam("blabBody", () => ({ color: "#5a6a4a" })));
    things.add(boxGeo(V(PIVOT[0] - 0.12, 0.92, PIVOT[2] - 0.08), V(PIVOT[0] + 0.12, 0.96, PIVOT[2] + 0.08)), brass);
    const post = new THREE.CylinderGeometry(0.015, 0.02, PIVOT[1] - 0.96, 8); post.translate(PIVOT[0], (PIVOT[1] + 0.96) / 2, PIVOT[2]); things.add(post, brass);
    const beamM = new THREE.Mesh(new THREE.BoxGeometry(2 * ARM + 0.04, 0.018, 0.02), new THREE.MeshLambertMaterial({ color: "#d8b25a" }));
    this.beam.add(beamM); this.beam.position.set(...PIVOT); R.add(this.beam);
    for (let i = 0; i < 2; i++) {
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.02, 20), new THREE.MeshLambertMaterial({ color: "#e0c070" }));
      R.add(pan); this.pans.push(pan);
    }
    placeProp(things, glow, kit, "books", 0.25, 0.92, -1.3, { h: 0.16 });
    placeProp(things, glow, kit, "lampRoundTable", -1.3, 0.92, -1.4, { h: 0.45 });
    // the fridge: open front, three shelves with ice trays, a hinged door
    const fx0 = FRIDGE_X - 0.45, fx1 = FRIDGE_X + 0.45, fz0 = FRIDGE_Z - 0.4, fz1 = FRIDGE_Z + 0.32;
    things.add(boxGeo(V(fx0, 0, fz0), V(fx1, 1.85, fz0 + 0.05)), white);
    things.add(boxGeo(V(fx0, 0, fz0), V(fx0 + 0.05, 1.85, fz1)), white);
    things.add(boxGeo(V(fx1 - 0.05, 0, fz0), V(fx1, 1.85, fz1)), white);
    things.add(boxGeo(V(fx0, 1.8, fz0), V(fx1, 1.85, fz1)), white);
    things.add(boxGeo(V(fx0, 0, fz0), V(fx1, 0.12, fz1)), white);
    things.add(boxGeo(V(fx0 + 0.05, 0.12, fz0 + 0.05), V(fx1 - 0.05, 1.8, fz0 + 0.06)), inner);
    for (const y of [0.5, 0.95, 1.4]) {
      things.add(boxGeo(V(fx0 + 0.05, y - 0.012, fz0 + 0.05), V(fx1 - 0.05, y, fz1 - 0.02)), lam("blabShelf", () => ({ color: "#dfe8ee" })));
      things.add(boxGeo(V(fx0 + 0.1, y, fz0 + 0.12), V(fx1 - 0.1, y + 0.03, fz1 - 0.08)), lam("blabTray", () => ({ color: "#bfe6ff" })));
    }
    const doorM = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.85, 0.06), new THREE.MeshLambertMaterial({ color: "#f4f6f8" }));
    doorM.position.set(0.45, 0.925, 0.03); this.door.add(doorM);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.05), new THREE.MeshLambertMaterial({ color: "#9aa3ad" }));
    handle.position.set(0.82, 1.15, 0.08); this.door.add(handle);
    this.door.position.set(fx0, 0, fz1); R.add(this.door);
    placeProp(things, glow, kit, "bookcaseOpen", -2.8, 0, -2.6, { h: 1.9 });
    walls.build(R, false); things.build(R, true); glow.build(R, false);
  }
  protected tick(id: number, f: number) {
    const a = id === 7 ? tilt(f) : 0;
    this.beam.rotation.z = a;
    this.pans.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(PIVOT[0] + s * ARM * Math.cos(a), PIVOT[1] + s * ARM * Math.sin(a) - 0.14, PIVOT[2]); });
    // the door swings open toward the camera side
    const open = id === 8 ? 1 : ease.out((f - C7.open) / 12);
    this.door.rotation.y = -rad(110) * open;
  }
  protected stage(id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    const a = id === 7 ? tilt(f) : 0, pan = (s: number): V3 => [PIVOT[0] + s * ARM * Math.cos(a), PIVOT[1] + s * ARM * Math.sin(a) - 0.13, PIVOT[2]];
    if (id === 7) {
      const L = pan(-1), Rr = pan(1), shocked = f >= C7.tip - LEAD;
      out.places.push(bat("scale", [L[0], L[1] - 0.06, L[2]], 0.17, { look: shocked ? "shock" : "sleep", flap: 0.1, light: q(light) }));
      card(out, "bombSmall", 120, 200, (p) => {
        p.poly([[30, 20], [90, 20], [96, 150], [60, 185], [24, 150]], "#e0402e", 6);
        p.poly([[28, 60], [92, 60], [93, 78], [27, 78]], "#f5d04a", 4);
      }, Rr[0], Rr[1] + 0.07, Rr[2], 0.08);
    }
    // bats asleep in the ice trays (the hero one in the middle shelf for shot 8)
    const snap = id === 8 && f >= C8.snap - LEAD;
    for (const [y, row] of [[0.5, 0], [0.95, 1], [1.4, 2]] as const) for (let i = 0; i < 4; i++) {
      const x = FRIDGE_X - 0.3 + i * 0.2, hero = row === 1 && i === 1;
      const o: BatOpts = { look: hero && snap ? "shock" : "sleep", flap: 0, light: q(light) };
      out.places.push(bat(`tray${row}${i}`, hero ? HERO : [x, y + 0.02, FRIDGE_Z + 0.08], 0.12, o));
    }
    if (id === 8) {
      const t = snap ? clamp01((f - (C8.snap - LEAD)) / 6) : 0;
      card(out, `frost|${q(t)}`, 512, 512, fxFrost(t), HERO[0] + 0.02, HERO[1] + 0.04, HERO[2] + 0.3, 0.2, true);
    }
    return out;
  }
}

// ======================= 11: the attic cutaway =======================
const C11 = { a: 1382, enter: 1394, look: 1420, pick: 1478, land: BEAT.ecke - 4 };
const CAMS11: Record<number, ShotCam> = {
  11: { keys: [{ f: C11.a, pos: [0, 2.3, 7.2], look: [0, 2.3, -0.8], fov: 44 }], creep: 0.0009, punch: [BEAT.ecke], cInf: [3], drift: [0.1, 0.02, 0.15] },
};
export const cutCam = camOf(CAMS11), cutDof = dofOf(CAMS11);
const CORNER: V3 = [2.05, 1.55, -1.3];
const skyTex = () => ctex("cutSky", 256, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0c1430"); gr.addColorStop(1, "#2c3c74");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "rgba(255,255,255,0.8)"; for (let i = 0; i < 60; i++) g.fillRect(r() * 256, r() * 360, 2, 2);
});
const fxDark = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 10, 128, 128, 126);
  gr.addColorStop(0, "rgba(14,10,24,0.95)"); gr.addColorStop(0.6, "rgba(14,10,24,0.7)"); gr.addColorStop(1, "rgba(14,10,24,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
const fxMoon = (p: Pen) => { p.ell(128, 128, 100, 100, "#fff4c8", 0); p.ell(96, 110, 18, 14, "#efe2b0", 0); p.ell(150, 160, 12, 10, "#efe2b0", 0); };

export class CutawayWorld extends RoomWorld {
  constructor() {
    super(cutCam);
    this.dust = false;
    const R = this.root, b = new Batch();
    const wall = lam("cutWall", () => ({ map: wallpaperTex("#e8c9a0", "#d9b88c") })), wood = lam("cutWood", () => ({ color: "#8a5a3a" })), roof = lam("cutRoof", () => ({ color: "#b84a3a" }));
    const house = lam("cutHouse", () => ({ color: "#d9c4a0" })), win = lam("cutWin", () => ({ color: "#ffd890" }));
    // storey below with two lit windows, the attic floor, the gable wall and the two roof slabs
    b.add(boxGeo(V(-3, 0, -2), V(3, 1.1, 1)), house);
    for (const x of [-1.6, 1.0]) b.add(boxGeo(V(x, 0.35, 1.0), V(x + 0.6, 0.85, 1.02)), win);
    b.add(boxGeo(V(-3, 1.1, -2), V(3, 1.25, 1)), wood);
    b.add(tri(V(-3, 1.25, -2), V(3, 1.25, -2), V(0, 3.9, -2)), wall);
    for (const s of [-1, 1]) {
      const slab = new THREE.BoxGeometry(4.3, 0.18, 3.4);
      slab.rotateZ(s * -Math.atan2(2.65, 3)); slab.translate(s * 1.5, 2.6, -0.4); b.add(slab, roof);
    }
    const beam = new THREE.BoxGeometry(0.12, 2.6, 0.12); beam.translate(0, 2.5, -1.9); b.add(beam, wood);
    b.build(R, true);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ map: skyTex(), depthWrite: false }));
    sky.position.set(0, 6, -9); sky.layers.set(NOINK); R.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshLambertMaterial({ color: "#2a3a3a" }));
    ground.rotateX(-Math.PI / 2); ground.position.set(0, 0, -2); R.add(ground);
  }
  protected stage(_id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    card(out, "moon", 256, 256, fxMoon, -3.4, 5.2, -8, 1.4);
    card(out, "target", 300, 340, fxTarget, -1.2, 2.05, -1.94, 0.62);
    card(out, "dark", 256, 256, fxDark, CORNER[0] + 0.1, CORNER[1], CORNER[2] - 0.2, 1.1, true);
    // the bat: flies in from above, hovers and looks at the target, turns to the corner and hangs upside down
    let at: V3, gaze = 0, roll = 0, look: BatOpts["look"] = "awake";
    if (f < C11.look) { const u = ease.out((f - C11.enter) / (C11.look - C11.enter)); at = [0.2 - 0.2 * u, 4.6 - 2.1 * u, 0.4 - 0.6 * u]; }
    else if (f < C11.pick) { at = [0, 2.5 + 0.05 * Math.sin(f / 6), -0.2]; gaze = -1; look = f < C11.pick - 20 ? "awake" : "smug"; }
    else { const u = ease.out((f - C11.pick) / (C11.land - C11.pick)); at = [CORNER[0] * u, 2.5 + (CORNER[1] - 2.5) * u, -0.2 + (CORNER[2] + 0.2) * u]; gaze = 1; look = "smug"; roll = f >= C11.land ? Math.PI : 0; }
    if (f >= C11.land + 6) look = "sleep";
    const flap = f >= C11.land ? 0 : 0.5 + 0.5 * Math.sin(f * 0.9);
    out.places.push(bat("cut", at, 0.55, { look, gaze, flap: q(flap), hero: true, blink: blinkAt(f, 4), light: q(light) }, roll));
    return out;
  }
}

// ======================= 12: the bedroom =======================
const C12 = { a: 1528, pop: 1545, zip: 1578, gone: 1592, eyes: BEAT.sekunden - LEAD };
const BOX: V3 = [-0.6, 0, -0.35];
const CAMS12: Record<number, ShotCam> = {
  12: { keys: [{ f: C12.a, pos: [-0.1, 0.9, 1.7], look: [-0.45, 0.45, -1.3], fov: 46 },
    { f: C12.gone, dur: 14, pos: [0.25, 0.55, 0.6], look: [0.35, 0.18, -1.5], fov: 40 }], creep: 0.001, punch: [BEAT.sekunden], cInf: [8, 10] },
};
export const bedCam = camOf(CAMS12), bedDof = dofOf(CAMS12);

export class BedroomWorld extends RoomWorld {
  constructor(kit: Kit) {
    super(bedCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    roomShell(walls, things, shellMats("bed", "#a87a52", "#e8dcc8", "#c9b0d8", "#b8a0c8"), [[-2.8, -1.6, 1.4, 2.6]], [4, 3]);
    const night = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ map: nightTex("bed", false) }));
    night.position.set(-2.2, 2.0, -3.3); night.layers.set(NOINK); R.add(night);
    // the bed: legs, frame, mattress, blanket, pillow, headboard; dark floor under it
    const frame = lam("bedFrame", () => ({ color: "#6a4430" })), sheet = lam("bedSheet", () => ({ color: "#f2ede0" })), blanket = lam("bedBlanket", () => ({ color: "#4a78b8" }));
    for (const [x, z] of [[-0.6, -1.0], [1.6, -1.0], [-0.6, -2.95], [1.6, -2.95]]) things.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.32, z + 0.04)), frame);
    things.add(boxGeo(V(-0.65, 0.3, -3.0), V(1.65, 0.4, -0.95)), frame);
    things.add(boxGeo(V(-0.6, 0.4, -2.95), V(1.6, 0.58, -1.0)), sheet);
    things.add(boxGeo(V(-0.62, 0.5, -2.2), V(1.62, 0.64, -0.98)), blanket);
    things.add(boxGeo(V(-0.4, 0.58, -2.85), V(1.4, 0.72, -2.4)), sheet);
    things.add(boxGeo(V(-0.65, 0, -3.0), V(1.65, 1.2, -2.94)), frame);
    walls.add(boxGeo(V(-0.6, 0.002, -2.95), V(1.6, 0.006, -1.0)), lam("bedUnder", () => ({ color: "#1a1428" })));
    placeProp(things, glow, kit, "cardboardBoxOpen", BOX[0], 0, BOX[2], { h: 0.42 });
    placeProp(things, glow, kit, "sideTable", -1.25, 0, -2.6, { h: 0.55 });
    placeProp(things, glow, kit, "lampRoundTable", -1.25, 0.55, -2.6, { h: 0.45 });
    placeProp(things, glow, kit, "rugRound", 0.2, 0.004, -0.5, { w: 2.2 });
    walls.build(R, false); things.build(R, true); glow.build(R, false);
  }
  protected stage(_id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    if (f < C12.gone) {
      let at: V3, look: "calm" | "wide" = "wide", s = 0.2;
      if (f < C12.zip) { const u = ease.back((f - C12.pop) / 8); at = [BOX[0], 0.05 + 0.3 * u, BOX[2] + 0.02]; look = f < C12.pop + 12 ? "calm" : "wide"; }
      else { const u = ease.out((f - C12.zip) / (C12.gone - C12.zip)); at = [BOX[0] + 1.0 * u, 0.02, BOX[2] - 1.15 * u]; s = 0.2 - 0.06 * u; }
      if (f >= C12.pop) out.places.push({ key: `CAT|${look}`, x: at[0], y: at[1], z: at[2], scale: s, draw: (p: Pen) => drawCat(p, { look, light }) });
      if (f >= C12.zip) card(out, "speed", 400, 200, fxSpeed, at[0] - 0.35, 0.18, at[2], 0.4);
    }
    if (f >= C12.eyes) { const k = ease.out((f - C12.eyes) / 6); card(out, "eyes", 256, 128, fxEyes, 0.45, 0.16, -1.5, 0.22 * k, true); }
    return out;
  }
}
