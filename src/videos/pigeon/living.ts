// Present-day living room for shot 14 ("Ever kept tapping a phone game because the next tap might pay out?"):
// a teen on the sofa tapping a glowing phone, TV, floor lamp, rug, plants. Evening light (room.ts EVENING).
import { Batch, boxGeo, V, lam, Kit } from "./build";
import { Pen, Outfit } from "./toon";
import { placeProp } from "./props";
import { wallpaperTex, panelTex, plasterTex } from "./ptex";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, roomShell, personAt, contact, card, q, blinkAt, LEAD } from "./room";

const CAMS: Record<number, ShotCam> = {
  14: { keys: [{ f: 1430, pos: [0.35, 1.0, 0.25], look: [0.0, 0.72, -2.2], fov: 44 }], creep: 0.0012, punch: [1502], cInf: [9] },
};
export const livingCam = camOf(CAMS);
export const livingDof = dofOf(CAMS);

const TEEN: Outfit = { jacket: "#5a8fc2", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#2a201a", build: "kid" };
const SOFA_Z = -2.45;

/** phone held up, screen glowing with a little match-three game, on a 200 x 300 canvas; tap = thumb ring 0..1 */
const fxPhone = (p: Pen, tap: number) => {
  p.poly([[40, 20], [160, 20], [160, 280], [40, 280]], "#1d1f2a", 8);
  p.poly([[52, 40], [148, 40], [148, 255], [52, 255]], "#bfe8ff", 0);
  const cols = ["#ff5a7a", "#ffcc33", "#5ad16a", "#5ab0ff"];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) p.ell(70 + c * 30, 70 + r * 36, 11, 11, cols[(r * 3 + c * 2) % 4], 3);
  if (tap > 0) p.ell(100, 150, 18 + 30 * tap, 18 + 30 * tap, null, 6 * (1 - tap) + 1);
};

export class LivingWorld extends RoomWorld {
  constructor(kit: Kit) {
    super(livingCam);
    const R = this.root, walls = new Batch(), things = new Batch(), glow = new Batch();
    const M = {
      floor: lam("livFloor", () => ({ color: "#c99a6a" })),
      low: lam("livLowP", () => ({ map: panelTex("#e8dcc8") })),
      wall: lam("livWallP", () => ({ map: wallpaperTex("#8fb3c9", "#7a9db5") })),
      rail: lam("livRail", () => ({ color: "#f3efe4" })),
      ceil: lam("livCeilP", () => ({ map: plasterTex("#f2ead8") })),
      frame: lam("livFrame", () => ({ color: "#3a3f4a" })),
    };
    roomShell(walls, things, M, [], [4, 3]);
    // two framed posters (plain colour fields) above the sofa
    for (const [x, c] of [[-0.75, "#e8a33c"], [0.75, "#d95a6a"]] as const) {
      things.add(boxGeo(V(x - 0.36, 1.55, -3.0), V(x + 0.36, 2.25, -2.96)), M.frame);
      things.add(boxGeo(V(x - 0.3, 1.61, -2.96), V(x + 0.3, 2.19, -2.955)), lam("livPoster" + c, () => ({ color: c })));
    }
    const P = (n: string, x: number, y: number, z: number, h: number, yaw = 0) => placeProp(things, glow, kit, n, x, y, z, { h }, yaw);
    P("loungeSofa", 0, 0, SOFA_Z, 0.85);
    P("pillowBlue", -0.6, 0.42, SOFA_Z - 0.05, 0.25, 0.2); P("pillow", 0.62, 0.42, SOFA_Z - 0.05, 0.38, -0.2);
    P("tableCoffee", 0.1, 0, -1.25, 0.42);
    P("lampRoundFloor", -1.35, 0, SOFA_Z, 1.7);
    P("pottedPlant", 1.4, 0, SOFA_Z - 0.1, 1.1);
    P("cabinetTelevision", 0, 0, 2.6, 0.55, Math.PI); P("televisionModern", 0, 0.55, 2.6, 0.75, Math.PI);
    P("plantSmall2", 0.45, 0.42, -1.25, 0.3);
    placeProp(walls, glow, kit, "rugRound", 0.1, 0.004, -1.4, { w: 2.6 });
    walls.build(R, false);
    things.build(R, true);
    glow.build(R, false);
  }

  protected stage(_id: number, f: number, light: number): Stage {
    const out: Stage = { places: [], fx: [] };
    // tapping every 6 frames (the pecking rhythm of the pigeons, the match cut); a grin each time the game pays out
    const tapK = ((f - 1430) % 6) / 6, payout = f >= 1502 - LEAD && f < 1520;
    out.places.push(personAt("TEEN", TEEN, 0, SOFA_Z + 0.42, { mode: "sit", expr: payout ? "grin" : "nervous", look: 0, blink: blinkAt(f, 7), light: q(light) }));
    contact(out, 0, 0, SOFA_Z + 0.55, 0.7);
    card(out, `phone|${q(tapK)}`, 200, 300, (p) => fxPhone(p, tapK), 0.1, 0.48, SOFA_Z + 0.82, 0.13);
    if (payout) card(out, `pay|${q((f - 1500) / 20)}`, 300, 300, (p) => {
      const t = (f - 1500) / 20;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; p.ell(150 + 90 * t * Math.cos(a), 150 + 90 * t * Math.sin(a), 16, 16, "#ffd84a", 5); }
    }, 0.45, 0.85, SOFA_Z + 0.85, 0.35);
    return out;
  }
}

