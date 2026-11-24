// Clip timeline from the voice: lines.json (start/end per voice line) and words.json (word timings), 30 fps.
// A shot is one voice line by default; `groups` (from projects/<name>/shots.json) joins several lines into one shot,
// which long videos need (hundreds of lines, a shot every 2-8 s). beat(id, word) = start frame of that word in shot id.
export const FPS = 30;
type Line = { id: number; text: string; start: number; end: number };
type Word = { w: string; s: number; e: number };
export type Shot = { id: number; a: number; b: number; lines: number[] };

export const makeTiming = (lines: Line[], words: Word[], groups?: number[][]) => {
  const TOTAL = Math.ceil(lines[lines.length - 1].end * FPS) + 10;
  const gs = groups ?? lines.map((_, i) => [i]);
  const starts = gs.map((g, i) => (i ? Math.round(lines[g[0]].start * FPS) : 0));
  const SHOTS: Shot[] = gs.map((g, i) => ({ id: i + 1, a: starts[i], b: starts[i + 1] ?? TOTAL, lines: g }));
  /** start frame of the first word starting with `w` in shot `id` (`nth` = which occurrence, from 0) */
  const beat = (id: number, w: string, nth = 0) => {
    const g = gs[id - 1], a = lines[g[0]].start - 0.05, b = lines[g[g.length - 1]].end + 0.05, key = w.toLowerCase();
    const hits = words.filter((x) => x.s >= a && x.s <= b && x.w.replace(/[„“"”,.:;?!()]/g, "").toLowerCase().startsWith(key));
    if (!hits[nth]) throw new Error(`no word ${w} (#${nth}) in shot ${id}`);
    return Math.round(hits[nth].s * FPS);
  };
  const A = (id: number) => SHOTS[id - 1].a, B = (id: number) => SHOTS[id - 1].b;
  return { FPS, TOTAL, SHOTS, beat, A, B };
};
