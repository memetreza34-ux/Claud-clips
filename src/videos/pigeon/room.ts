// Shared base for the pigeon short's interior sets (lab, office, ...): glide cameras with hold creep, punch pushes and
// impact kicks; a camera-relative sun frozen per shot; the two-tone light uniforms; lit character cards and effect cards
// from the template's pool. Each set subclasses RoomWorld, builds its room in the constructor and returns who stands
// where per frame from stage().
import * as THREE from "three";
import { Batch, quad, boxGeo, V } from "./build";
import { Pen, fxContact } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";

/** warm interior evening instead of the bridge's backlit sunset (which turned rooms violet and dark): lamp-warm key,
 *  soft lilac shade, no deep crush */
const EVENING: LightPreset = { ...LIGHTS.golden, el: 28, lit: [1.5, 1.12, 0.8], shade: [0.4, 0.35, 0.46], lift: [0.08, 0.07, 0.09],
  charTint: [1.0, 0.9, 0.8], charShade: 0.88, sideTint: [0.92, 0.88, 0.94], sunCol: "#ffd9a8", sunI: 2.6, sky: "#f3d9c0", hemiI: 0.6, fog: "#e9c9a8", actorShadow: false };
/** night for the explanation (tutorial: "a deep night blue right as the explanation begins"): warm lamp key on deep blue
 *  shade, characters cooled toward the room's blue */
const NIGHT: LightPreset = { ...LIGHTS.day, el: 35, lit: [1.3, 1.06, 0.82], shade: [0.15, 0.19, 0.44], lift: [0.03, 0.05, 0.13],
  charTint: [0.8, 0.84, 1.05], charShade: 0.82, sideTint: [0.74, 0.8, 1.0], sunCol: "#ffd6a0", sunI: 2.3, sky: "#3a4f8a",
  ground: "#2a2440", hemiI: 0.35, fog: "#1e2a55", actorShadow: false };
const lightOf = (l: "day" | "golden" | "night") => (l === "golden" ? EVENING : l === "night" ? NIGHT : LIGHTS.day);
export const isNight = (id: number) => PSHOTS[id - 1].light === "night";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, Place, FxPlace } from "./cast";
import { PSHOTS } from "./shots";
import { drawPigeon, PigeonOpts } from "./pcast";
import { FrontOpts, Outfit, bodyFront } from "./toon";

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
/** easing from the cartoon-short-kit (motion.js): overshoot-and-settle, wind-up-then-go, fast start, damped spring */
export const ease = {
  back: (t: number, s = 1.7) => { const x = clamp01(t) - 1; return x * x * ((s + 1) * x + s) + 1; },
  anticip: (t: number, s = 0.12): number => { const x = clamp01(t); return x < 0.25 ? -s * Math.sin((x / 0.25) * Math.PI) : ease.back((x - 0.25) / 0.75); },
  out: (t: number) => 1 - (1 - clamp01(t)) ** 3,
  spring: (t: number, freq = 3, damp = 5) => { const x = Math.max(0, t); return 1 - Math.exp(-damp * x) * Math.cos(freq * 2 * Math.PI * x); },
};
/** centripetal-ish Catmull-Rom through points, u in [0, 1] over the whole path */
const spline = (pts: V3[], u: number): V3 => {
  const n = pts.length - 1, x = clamp01(u) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  return p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)) as V3;
};
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const rad = (d: number) => (d * Math.PI) / 180;
/** reactions land 2 frames before their word */
export const LEAD = 2;
export const q = (v: number) => Math.round(v * 40) / 40;
/** blink: closed for 3 frames every ~1.7 s, staggered per character */
export const blinkAt = (f: number, seed: number) => ((f + seed * 17) % 52) < 3;
/** one peck: down at frame `at`, up again 8 frames later */
export const peckAt = (f: number, at: number) => { const d = f - (at - 4); return d < 0 || d > 12 ? 0 : d < 4 ? d / 4 : 1 - (d - 4) / 8; };

// ---------------- cameras ----------------
export type Key = { f: number; dur?: number; pos: V3; look: V3; fov: number; roll?: number; path?: V3[] };
/** keys glide in over `dur` frames from the previous key; creep = fov shrink per frame of the hold; punch words push
 *  0.4 %/f for 20 f; kicks flip the roll every frame for 7 f; cInf = lens blur per key */
export type ShotCam = { keys: Key[]; creep: number; punch?: number[]; kicks?: number[]; cInf: number[]; drift?: V3 };
/** default slow dolly over every shot (metres, camera space: right, up, forward): parallax instead of a frozen frame */
const DRIFT: V3 = [0.06, 0.02, 0.2]; // mostly a slow push-in, a hint of sideways parallax
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const keyAt = (ks: Key[], f: number) => {
  let i = 0; while (i + 1 < ks.length && f >= ks[i + 1].f) i++;
  const k = ks[i], u = i && k.dur ? glide((f - k.f) / k.dur) : 1;
  return { i, k, p: ks[Math.max(0, i - 1)], u };
};
export const camOf = (CAMS: Record<number, ShotCam>) => (id: number, f: number): Cam => {
  const S = CAMS[id], { k, p, u } = keyAt(S.keys, f);
  // a key with via-points flies a curve (kit motion.js) instead of a straight line
  const pos = k.path && u < 1 ? spline([p.pos, ...k.path, k.pos], u) : lerp3(p.pos, k.pos, u), look = lerp3(p.look, k.look, u);
  // slow dolly across the shot: sideways from -dx/2 to +dx/2, a little up and forward; the look point follows at 40 %
  const sh = PSHOTS[id - 1], t = clamp01((f - sh.a) / Math.max(1, sh.b - sh.a)) - 0.5, [dx, dy, dz] = S.drift ?? DRIFT;
  const fx = look[0] - pos[0], fz = look[2] - pos[2], fl = Math.hypot(fx, fz) || 1, rx = -fz / fl, rz = fx / fl;
  const mv: V3 = [rx * dx * t + (fx / fl) * dz * (t + 0.5), dy * t, rz * dx * t + (fz / fl) * dz * (t + 0.5)];
  for (let j = 0; j < 3; j++) { pos[j] += mv[j]; look[j] += 0.4 * mv[j]; }
  // arrival: every shot opens 0.3 m further back and pushes in with an ease-out burst over 14 f (reference moves peak on
  // their first frame and decay; with the crossfades this reads as the camera travelling into the next moment)
  const arrive = 0.3 * (1 - ease.out((f - sh.a + 4) / 14));
  for (let j = 0; j < 3; j += 2) pos[j] -= ((j ? fz : fx) / fl) * arrive;
  let fov = p.fov + (k.fov - p.fov) * u, roll = (p.roll ?? 0) + ((k.roll ?? 0) - (p.roll ?? 0)) * u;
  let push = S.creep * Math.max(0, f - PSHOTS[id - 1].a);
  for (const w of S.punch ?? []) push += 0.004 * Math.max(0, Math.min(20, f - (w - 2)));
  fov *= Math.max(0.82, 1 - push);
  for (const w of S.kicks ?? []) { const n = f - (w - 1); if (n >= 0 && n < 7) roll += rad(1.6) * (n % 2 ? -1 : 1) * (1 - n / 7); }
  return { pos, look, fov, roll };
};
export const dofOf = (CAMS: Record<number, ShotCam>) => (id: number, f: number) => {
  const S = CAMS[id], { i, u } = keyAt(S.keys, f), a = S.cInf[Math.max(0, i - 1)], b = S.cInf[i];
  return { cInf: 1.45 * (a + (b - a) * u), focus: undefined as undefined | ((f: number) => V3) };
};

// ---------------- room shell ----------------
export type ShellMats = { floor: THREE.Material; low: THREE.Material; wall: THREE.Material; rail: THREE.Material; ceil: THREE.Material };
/** floor, ceiling and three walls (x -4..4, z -3..3, camera side open): low panel to 1.0 m, rail, upper wall; `holes`
 *  are window rectangles [x0, x1, y0, y1] cut into the back wall (above the rail) */
export const roomShell = (walls: Batch, things: Batch, M: ShellMats, holes: [number, number, number, number][] = [], floorRep: [number, number] = [3.2, 2.4]) => {
  walls.add(quad(V(-4, 0, 3), V(4, 0, 3), V(4, 0, -3), V(-4, 0, -3), floorRep[0], floorRep[1]), M.floor);
  walls.add(quad(V(-4, 3.2, -3), V(4, 3.2, -3), V(4, 3.2, 3), V(-4, 3.2, 3)), M.ceil);
  // UVs in metres (u along the wall, v up), so painted textures tile at their own scale
  const back = (x0: number, x1: number, y0: number, y1: number, m: THREE.Material) => walls.add(quad(V(x0, y0, -3), V(x1, y0, -3), V(x1, y1, -3), V(x0, y1, -3), x1, y1, x0, y0), m);
  const left = (y0: number, y1: number, m: THREE.Material) => walls.add(quad(V(-4, y0, 3), V(-4, y0, -3), V(-4, y1, -3), V(-4, y1, 3), 6, y1, 0, y0), m);
  const right = (y0: number, y1: number, m: THREE.Material) => walls.add(quad(V(4, y0, -3), V(4, y0, 3), V(4, y1, 3), V(4, y1, -3), 6, y1, 0, y0), m);
  back(-4, 4, 0, 1.0, M.low); left(0, 1.0, M.low); right(0, 1.0, M.low);
  left(1.0, 3.2, M.wall); right(1.0, 3.2, M.wall);
  // upper back wall around the holes: vertical strips between holes, plus pieces below and above each hole
  const hs = [...holes].sort((a, b) => a[0] - b[0]);
  let x = -4;
  for (const [x0, x1, y0, y1] of hs) {
    back(x, x0, 1.0, 3.2, M.wall); back(x0, x1, 1.0, y0, M.wall); back(x0, x1, y1, 3.2, M.wall); x = x1;
  }
  back(x, 4, 1.0, 3.2, M.wall);
  things.add(boxGeo(V(-4, 0.98, -3), V(4, 1.04, -2.96)), M.rail);
  things.add(boxGeo(V(-4, 0.98, -3), V(-3.96, 1.04, 3)), M.rail);
  things.add(boxGeo(V(3.96, 0.98, -3), V(4, 1.04, 3)), M.rail);
};

// ---------------- placements ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
/** frame of the stage being built (set by RoomWorld.update), for idle motion of anyone the stage does not animate */
let IDLE_F = 0;
const hashOf = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h / 9973; };
export const PIG_SCALE = 0.27; // 520 design units of pigeon -> ~0.3 m
export const pigeonAt = (key: string, at: V3, o: PigeonOpts, mirror = false, scale = 1): Place => {
  // idle: a small head bob unless the stage drives the nod itself
  // idle nod in 0.1 steps (7 drawings per pigeon) so the canvas only redraws on a visible change
  const nod = o.nod ?? Math.round(3.5 * Math.sin(IDLE_F / 6 + 6.28 * hashOf(key))) / 10;
  const oq = { ...o, peck: q(o.peck ?? 0), nod: q(nod) };
  return { key: `PG|${key}|${JSON.stringify(oq)}`, x: at[0], y: at[1], z: at[2], scale: PIG_SCALE * scale, mirror, draw: (p: Pen) => drawPigeon(p, oq) };
};
export const personAt = (name: string, o: Outfit, x: number, z: number, fo0: FrontOpts, draw?: (p: Pen, fo: FrontOpts) => void): Place => {
  // idle: a slow head tilt in half-degree steps unless the stage sets one
  // whole-degree steps (5 drawings), slower: each change redraws a big canvas
  const fo = { ...fo0, headTilt: fo0.headTilt ?? Math.round(2 * Math.sin(IDLE_F / 28 + 6.28 * hashOf(name))) };
  return { key: `${name}|${JSON.stringify(fo)}`, x, y: 0, z, draw: (p: Pen) => (draw ? draw(p, fo) : bodyFront(p, o, fo)) };
};
/** soft floating dust mote on a 64 x 64 canvas */
const fxDust = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  gr.addColorStop(0, "rgba(255,246,222,0.42)"); gr.addColorStop(0.5, "rgba(255,240,210,0.12)"); gr.addColorStop(1, "rgba(255,240,210,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
};
export const contact = (out: Stage, x: number, y: number, z: number, w: number) =>
  out.fx.push({ key: "blob|contact|room", cw: 128, ch: 128, draw: (p) => fxContact(p, "#5d6080"), x, y: y + 0.004, z, w, h: w * 0.75, flat: true });
export const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, soft = false, rot = 0) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h: (w * ch) / cw, soft, rot });
/** a flat card lying on a surface (folders, maps, papers) */
export const flatCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, rot = 0) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h: (w * ch) / cw, flat: true, rot });

// ---------------- world ----------------
export abstract class RoomWorld {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.55);
  private sun = new THREE.DirectionalLight("#fff3e0", 2.8);
  private sunCache = new Map<number, THREE.Vector3>();
  /** floating dust in the light (interiors) */
  protected dust = true;

  constructor(private camAt: (id: number, f: number) => Cam) {
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    this.root.add(this.hemi, this.sun, this.sun.target);
  }
  /** who stands where at frame f of shot id; light = canvas angle the key light comes from */
  protected abstract stage(id: number, f: number, light: number): Stage;
  /** per-frame set animation (clock hands, blinking lights, ...) */
  protected tick(_id: number, _f: number) {}

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  /** sun frozen per shot, relative to the shot's first camera: az from its forward axis toward screen right, el up */
  private shotSun(id: number) {
    let s = this.sunCache.get(id);
    if (!s) {
      const sh = PSHOTS[id - 1], L = lightOf(sh.light), c = this.camAt(id, sh.a);
      const fw = V(c.look[0] - c.pos[0], 0, c.look[2] - c.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
      const az = rad(sh.light === "golden" ? 40 : sh.light === "night" ? -35 : L.az), el = rad(L.el);
      s = fw.multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
      this.sunCache.set(id, s);
    }
    return s;
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const sh = PSHOTS[id - 1], L = lightOf(sh.light), K = LOOK.day;
    const c = this.camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 60; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), sunDir = this.shotSun(id);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    this.sun.position.copy(focus).addScaledVector(sunDir, 30); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera, Rr = 7;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 1; sc.far = 70; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat * 1.1; // a bit more colour (measured: ours .40 vs reference .47)
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    scene.fog = null; scene.background = new THREE.Color(untone(L.fog));
    this.tick(id, f);
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const light = Math.round(Math.atan2(-sunDir.y, sunDir.dot(right)) / (Math.PI / 4)) * (Math.PI / 4);
    IDLE_F = f;
    const st = this.stage(id, f, light);
    if (this.dust) for (let i = 0; i < 18; i++) {
      // motes around the look point: slow sideways sway, a slow rise that wraps
      const h1 = hashOf("d" + i), h2 = hashOf("e" + i), h3 = hashOf("g" + i);
      const y = ((h2 + f * 0.0016 * (0.6 + h3)) % 1) * 1.6 - 0.6;
      st.fx.push({ key: "dust", cw: 64, ch: 64, draw: fxDust, soft: true, w: 0.008 + 0.008 * h3, h: 0.008 + 0.008 * h3,
        x: focus.x + (h1 - 0.5) * 2.2 + 0.06 * Math.sin(f / 37 + i), y: focus.y + y, z: focus.z + (h3 - 0.5) * 1.6 });
    }
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const a = this.actor(ai++), s = p.scale ?? 1, d = cam.position.distanceTo(V(p.x, p.y + 1.1 * s, p.z)) / s;
      // drawing size by distance; the biggest canvas only for true close-ups (it is the slowest thing to redraw)
      const [w, h, k] = d < 2.0 ? [1800, 3000, 3.0] : d < 3.6 ? [1320, 2200, 2.2] : d < 6.5 ? [960, 1600, 1.6] : [480, 800, 0.8];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      // idle on every card: breathing (height +-1.2 %) and a slow sway about the feet (+-0.6 deg), own phase each
      const ph = 6.28 * hashOf(p.key.split("|")[0] + ai);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), (p.roll ?? 0) + 0.02 * Math.sin(f / 29 + ph));
      a.mesh.scale.set(p.mirror ? -s : s, s * (1 + 0.012 * Math.sin(f / 16 + ph)), s);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
