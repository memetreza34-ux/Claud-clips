// Bat short timeline: shot frames and beat frames from projects/bats/SHOTS.md (v3, German voice), 30 fps.
import lines from "../../../projects/bats/voice/lines.json";

export const FPS = 30;
export const TOTAL = Math.ceil(lines[lines.length - 1].end * FPS) + 8;

export type Place = "airbase" | "cave" | "car" | "office" | "dentist" | "lab" | "cutaway" | "bedroom" | "desk" | "map";
export type Shot = { id: number; a: number; b: number; place: Place };

const PLACES: Place[] = ["airbase", "cave", "car", "car", "office", "dentist", "lab", "lab", "airbase", "airbase",
  "cutaway", "bedroom", "desk", "desk", "map"];
const STARTS = [0, 164, 374, 535, 604, 743, 834, 1001, 1079, 1241, 1382, 1528, 1646, 1770, 1885];

export const SHOTS: Shot[] = STARTS.map((a, i) => ({ id: i + 1, a, b: STARTS[i + 1] ?? TOTAL, place: PLACES[i] }));

/** beat frames (word starts) per shot, from the Beats column of SHOTS.md */
export const BEAT = {
  bats: 16, american: 127, millionen: 302, pearl: 431, daechern: 586, zahnarzt: 626, spinner: 723, einrahmen: 784,
  schwerer: 892, kuehlschrank: 983, frueh: 1051, genau: 1222, generals: 1340, flammen: 1363, ecke: 1518,
  sekunden: 1607, testmaterial: 1735, stuetzpunkt: 1842, amerika: 1975,
};

/** white flash after the hook */
export const FLASH = 164;
