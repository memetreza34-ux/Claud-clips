// The sky: shots 1 (hook) and 9 (the fins steer the bomb back). The bomb falls nose-first past streaming clouds with
// the three pilots in its porthole; the sea lies far below. Clouds rise past the camera to sell the fall.
import * as THREE from "three";
import { NOINK } from "./ink";
import { cloudHD, CLOUD_DAY } from "./paint";
import { fxWindow } from "./pcast";
import { makeBomb, WINDOW } from "./bomb";
import { RoomWorld, ShotCam, Stage, camOf, dofOf, card, rad, q, glide } from "./room";

const CAMS: Record<number, ShotCam> = {
  1: { keys: [{ f: 0, pos: [2.0, 0.9, 2.9], look: [0.15, -0.15, 0], fov: 48 }], creep: 0.0012, punch: [135], cInf: [0] },
  9: { keys: [{ f: 945, pos: [-1.2, 0.6, 3.1], look: [0.1, -0.1, 0], fov: 50 }], creep: 0.001, cInf: [0] },
};
export const skyCam = camOf(CAMS);
export const skyDof = dofOf(CAMS);

const BASE_TILT = rad(-62); // nose down and forward
/** shot 9: drifted 14 degrees, levels out on "back" (f 975) */
const tiltAt = (id: number, f: number) => (id === 9 ? rad(14) * (1 - glide((f - 973) / 10)) : 0);

export class SkyWorld extends RoomWorld {
  private bomb: THREE.Group;
  private fins: THREE.Object3D[];
  private clouds: { m: THREE.Mesh; x: number; y: number; z: number; s: number }[] = [];
  private win = new THREE.Vector3();
  protected dust = false;

  constructor() {
    super(skyCam);
    const R = this.root;
    // sky dome: zenith blue -> pale horizon -> hazy below the horizon (the sea shows through the haze far down)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `varying vec3 vP; void main(){ float y = vP.y;
        vec3 top = vec3(0.17, 0.42, 0.78), hor = vec3(0.72, 0.84, 0.95), sea = vec3(0.16, 0.48, 0.66);
        vec3 c = y > 0.0 ? mix(hor, top, smoothstep(0.0, 0.6, y)) : mix(hor, sea, smoothstep(0.0, -0.35, y));
        gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    }));
    dome.layers.set(NOINK); dome.renderOrder = -1; R.add(dome);
    // clouds all around and below, lit side up
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + (i % 3) * 0.4, d = 9 + (i % 5) * 5;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(i % 4, CLOUD_DAY), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); R.add(m);
      this.clouds.push({ m, x: Math.cos(a) * d, y: -14 + (i * 7.3) % 28, z: Math.sin(a) * d - 6, s: 5 + (i % 4) * 2.5 });
    }
    const { group, fins } = makeBomb();
    this.bomb = group; this.fins = fins; R.add(group);
  }

  protected tick(id: number, f: number) {
    // a gentle wobble while it falls; clouds stream upward (the camera falls with the bomb)
    const wob = rad(1.5) * Math.sin(f / 9);
    this.bomb.rotation.set(rad(4) * Math.sin(f / 13), 0, BASE_TILT + tiltAt(id, f) + wob);
    const flap = id === 9 && f >= 951 && f < 978 ? rad(25) * Math.sin(((f - 951) / 6) * Math.PI) : 0;
    this.fins.forEach((m, i) => (m.rotation.y = i % 2 ? flap : -flap));
    for (const c of this.clouds) {
      const y = ((c.y + f * 0.12 + 14) % 28) - 14;
      c.m.position.set(c.x, y, c.z); c.m.scale.set(c.s, c.s / 2, 1);
      c.m.lookAt(c.x * 0.2, y, 8);
    }
    this.bomb.updateMatrixWorld(true);
    this.win.copy(WINDOW).applyMatrix4(this.bomb.matrixWorld);
  }

  protected stage(_id: number, f: number): Stage {
    const out: Stage = { places: [], fx: [] }, k = q(0.5 + 0.5 * Math.sin(f / 3));
    card(out, `window|${k}`, 300, 300, (p) => fxWindow(p, k), this.win.x, this.win.y, this.win.z + 0.04, 0.2);
    return out;
  }
}
