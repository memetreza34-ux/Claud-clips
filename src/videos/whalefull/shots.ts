// Shot table of the full code-built whale short: the 19 voice-line shots of ../whale/timing.ts with a light per shot,
// in the shape room.ts expects. beat(id, word) = start frame of that word in shot id.
import { SHOTS, beat, TOTAL, FPS, FLASHES } from "../whale/timing";

export type Light = "day" | "golden" | "night" | "warm";
//                       1       2       3       4       5       6       7       8       9       10      11        12      13      14        15       16       17        18        19
const LIGHT: Light[] = ["warm", "warm", "warm", "warm", "warm", "warm", "warm", "warm", "warm", "warm", "golden", "warm", "warm", "golden", "night", "night", "golden", "golden", "warm"];
export const PSHOTS = SHOTS.map((s, i) => ({ ...s, light: LIGHT[i] }));
export { beat, TOTAL, FPS, FLASHES };
/** shot start and end frames */
export const A = (id: number) => SHOTS[id - 1].a, B = (id: number) => SHOTS[id - 1].b;
