// Bat shot table in the shape broom.ts expects (frames, light per shot), from bats/timing.ts.
import { SHOTS } from "../bats/timing";

export type Light = "day" | "golden" | "night";
const LIGHT: Light[] = ["golden", "golden", "golden", "golden", "day", "day", "day", "day", "day", "golden", "night", "night", "golden", "golden", "day"];
export const PSHOTS = SHOTS.map((s, i) => ({ ...s, light: LIGHT[i] }));
