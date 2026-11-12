// Pigeon shot table: frames from projects/pigeon/shots.json (the shot plan in SHOTS.md), plus set and light per shot.
// Shots whose set is not built yet fall back to the bridge world (Pigeon.tsx).
import plan from "../../../projects/pigeon/shots.json";

export type SetName = "sky" | "airfield" | "lab" | "office" | "nose" | "living" | "stage";
export type Light = "day" | "golden" | "night";
export type PShot = { id: number; a: number; b: number; set: SetName; light: Light };

const META: [SetName, Light][] = [
  ["sky", "day"], ["office", "day"], ["lab", "day"], ["office", "day"], ["lab", "day"], ["lab", "day"], ["lab", "day"],
  ["lab", "day"], ["sky", "day"], ["lab", "day"], ["lab", "day"], ["lab", "day"], ["office", "night"], ["living", "night"],
  ["lab", "night"], ["office", "day"], ["office", "day"], ["office", "golden"], ["office", "golden"], ["office", "golden"],
];

export const PSHOTS: PShot[] = plan.shots.map((s, i) => ({ ...s, set: META[i][0], light: META[i][1] }));
export const PTOTAL = PSHOTS[PSHOTS.length - 1].b;
export const PFLASH = plan.flash[0];
export const pShotAt = (f: number) => PSHOTS.find((s) => f >= s.a && f < s.b) ?? PSHOTS[PSHOTS.length - 1];

/** layers at frame f: the base shot, plus the next one fading in inside an xfade window [a, b) */
/** frames before a crossfade in which the incoming shot already renders, invisible: its fresh canvas has drawn real
 *  frames by the time it fades in (a canvas captured on its first frame shows tiled garbage) */
const PREWARM = 10;
export const pLayersAt = (f: number): { id: number; alpha: number }[] => {
  for (const [a, b] of plan.xfade) {
    if (f >= a - PREWARM && f < a) return [{ id: pShotAt(f).id, alpha: 1 }, { id: pShotAt(b).id, alpha: 0 }];
    if (f >= a && f < b) {
      const next = pShotAt(b);
      return [{ id: next.id - 1, alpha: 1 }, { id: next.id, alpha: (f - a + 1) / (b - a + 1) }];
    }
  }
  return [{ id: pShotAt(f).id, alpha: 1 }];
};
