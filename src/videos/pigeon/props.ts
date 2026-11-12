// CC0 furniture from Kenney's Furniture Kit (public/kenney/furniture, license next to the files): loaded once before
// the first frame, placed into a set's static batches at real-world sizes. Lamp shades go into a glow batch (HDR
// colour above 1, so the bloom pass makes them shine like practical lights).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, Kit, V, toLambert } from "./build";

export const PROP_NAMES = ["bookcaseOpen", "bookcaseClosedWide", "bookcaseClosedDoors", "books", "chair", "chairDesk", "chairRounded",
  "lampRoundTable", "lampSquareFloor", "lampRoundFloor", "pottedPlant", "plantSmall1", "plantSmall2", "plantSmall3", "rugRectangle",
  "rugRound", "cardboardBoxClosed", "cardboardBoxOpen", "radio", "trashcan", "coatRackStanding", "sideTable", "sideTableDrawers",
  "loungeSofa", "tableCoffee", "televisionModern", "cabinetTelevision", "pillowBlue", "pillow", "speakerSmall", "ceilingFan"] as const;

let propsP: Promise<Kit> | null = null;
export const loadProps = () => {
  if (!propsP) {
    const loader = new GLTFLoader();
    propsP = Promise.all(PROP_NAMES.map((n) => loader.loadAsync(staticFile(`kenney/furniture/${n}.glb`)).then((g) => [n, g.scene] as const)
      .catch(() => [n, null] as const))).then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return propsP;
};

const GLOW = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.2, 0.78) }); // warm shade, just over 1 for a soft bloom
const boxes = new WeakMap<THREE.Object3D, THREE.Box3>();
/** size: { h } scales to that height in metres, { w } to that footprint width (rugs) */
export type Size = { h: number } | { w: number };

/** add a furniture model to `b` (lit) and its lamp shades to `glow`, base on y, turned by yaw around its centre */
export const placeProp = (b: Batch, glow: Batch, kit: Kit, name: string, x: number, y: number, z: number, size: Size, yaw = 0) => {
  const o = kit[name];
  if (!o) return;
  let box = boxes.get(o);
  if (!box) { o.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(o); boxes.set(o, box); }
  const s = "h" in size ? size.h / Math.max(0.005, box.max.y - box.min.y) : size.w / Math.max(0.01, box.max.x - box.min.x);
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(s, s, s))
    .multiply(new THREE.Matrix4().makeTranslation(-cx, -box.min.y, -cz));
  o.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const mm = new THREE.Matrix4().multiplyMatrices(m, mesh.matrixWorld);
    if (mat.name === "lamp") glow.add(mesh.geometry, GLOW, mm); else b.add(mesh.geometry, toLambert(mat), mm);
  });
};
