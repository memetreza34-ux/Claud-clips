// Which set (world class + depth of field) plays each of the 19 shots of the full whale short.
import * as THREE from "three";
import { Kit } from "../pigeon/build";
import { Cam } from "./room";
import { BeachWorld, beachDof } from "./beach";
import { OfficeWorld, officeDof } from "./office";
import { BoardWorld, boardDof } from "./board";
import { TruckWorld, truckDof } from "./truck";
import { DunesWorld, dunesDof } from "./dunes";
import { ParkingWorld, parkingDof } from "./parking";
import { KitchenWorld, kitchenDof } from "./kitchen";
import { NewsroomWorld, newsroomDof } from "./newsroom";

type World = { root: THREE.Object3D; update: (id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) => THREE.Vector3 };
type Dof = (id: number, f: number) => { cInf: number; focus?: (f: number) => [number, number, number] };
export type OwnSet = { key: string; make: (kit: Kit) => World; dof: Dof };
const beach: OwnSet = { key: "beach", make: () => new BeachWorld(), dof: beachDof };
const S = (key: string, make: (kit: Kit) => World, dof: Dof): OwnSet => ({ key, make, dof });
export const SETS: Record<number, OwnSet> = {
  1: beach, 2: beach, 3: beach, 7: beach, 8: beach, 10: beach, 14: beach, 17: beach,
  4: S("office", (k) => new OfficeWorld(k), officeDof),
  5: S("board", (k) => new BoardWorld(k), boardDof), 15: S("board", (k) => new BoardWorld(k), boardDof),
  6: S("truck", (k) => new TruckWorld(k), truckDof),
  9: S("dunes", (k) => new DunesWorld(k), dunesDof), 11: S("dunes", (k) => new DunesWorld(k), dunesDof),
  12: S("parking", (k) => new ParkingWorld(k), parkingDof), 13: S("parking", (k) => new ParkingWorld(k), parkingDof), 19: S("parking", (k) => new ParkingWorld(k), parkingDof),
  16: S("kitchen", (k) => new KitchenWorld(k), kitchenDof),
  18: S("newsroom", (k) => new NewsroomWorld(k), newsroomDof),
};
/** shots that crossfade in (a new place); the others cut */
export const XF = new Set([4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19]);
export type { Cam };
