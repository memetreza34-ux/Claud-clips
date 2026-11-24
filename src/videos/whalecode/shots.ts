// Shot table of the code-built whale test (10 s, no voice, no text), in the shape room.ts expects.
export type Light = "day" | "golden" | "night" | "warm";
export const FPS = 30;
export const TOTAL = 300;
/** frame of the plunger press and of the blast */
export const PRESS = 160, BANG = 168;
export const PSHOTS: { id: number; a: number; b: number; light: Light }[] = [
  { id: 1, a: 0, b: 150, light: "warm" },
  { id: 2, a: 150, b: TOTAL, light: "warm" },
];
