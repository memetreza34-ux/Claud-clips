// The pigeon-guided bomb: olive body along +x (nose at +x), grey nose cone with a round porthole on its +z side,
// four tail fins that can flap. Shared by the sets that show it.
import * as THREE from "three";
import { Batch, lam } from "./build";

/** porthole centre in bomb space (the pilots' window card goes here, slightly in front) */
export const WINDOW = new THREE.Vector3(0.62, 0.02, 0.33);

export const makeBomb = () => {
  const group = new THREE.Group(), fins: THREE.Object3D[] = [];
  const bm = { body: lam("bombBody", () => ({ color: "#6f7a55" })), nose: lam("bombNose", () => ({ color: "#9aa3ad" })),
    fin: lam("bombFin", () => ({ color: "#5a6445" })), rim: lam("bombRim", () => ({ color: "#3a3f4a" })) };
  const bb = new Batch();
  const body = new THREE.CylinderGeometry(0.28, 0.28, 1.1, 28); body.rotateZ(Math.PI / 2); bb.add(body, bm.body);
  const nose = new THREE.CylinderGeometry(0.28, 0.06, 0.45, 28); nose.rotateZ(Math.PI / 2); nose.translate(0.775, 0, 0); bb.add(nose, bm.nose);
  const tail = new THREE.CylinderGeometry(0.14, 0.28, 0.3, 28); tail.rotateZ(Math.PI / 2); tail.translate(-0.7, 0, 0); bb.add(tail, bm.body);
  const ring = new THREE.TorusGeometry(0.1, 0.022, 8, 28); ring.translate(0.62, 0.02, 0.27); bb.add(ring, bm.rim);
  bb.build(group, true);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.22), bm.fin);
    fin.geometry.translate(0, 0, 0.11);
    const g = new THREE.Group(); g.position.set(-0.78, 0, 0); g.rotation.x = (i * Math.PI) / 2; g.add(fin); group.add(g); fins.push(fin);
  }
  return { group, fins };
};
