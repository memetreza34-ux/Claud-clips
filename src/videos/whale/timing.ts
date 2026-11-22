// Whale short timeline: one shot per voice line (projects/whale/SHOTS.md), beats = word starts, 30 fps.
import lines from "../../../projects/whale/voice/lines.json";
import words from "../../../projects/whale/voice/words.json";

export const FPS = 30;
export const TOTAL = Math.ceil(lines[lines.length - 1].end * FPS) + 10;

export type Shot = { id: number; a: number; b: number };
const STARTS = lines.map((l, i) => (i ? Math.round(l.start * FPS) : 0));
export const SHOTS: Shot[] = STARTS.map((a, i) => ({ id: i + 1, a, b: STARTS[i + 1] ?? TOTAL }));

/** start frame of the first word starting with `w` in shot `id` (= voice line id - 1) */
export const beat = (id: number, w: string) => {
  const l = lines[id - 1], key = w.toLowerCase();
  const hit = words.find((x) => x.s >= l.start - 0.05 && x.s <= l.end + 0.05 && x.w.replace(/[„“",.:?!]/g, "").toLowerCase().startsWith(key));
  if (!hit) throw new Error(`no word ${w} in shot ${id}`);
  return Math.round(hit.s * FPS);
};

/** white flash after the hook (start of shot 2) and on the blast */
export const FLASHES = [STARTS[1], beat(10, "knallt")];
