// Story time: every frame number in the scenes, cameras and sound cues was authored on the first narration
// (voice/words_authoring.json). scripts/warp.py maps the current narration onto it; the short plays authoring frame
// storyFrame(render frame), so a new voice re-times everything at once.
import anchors from "../../../projects/pigeon/voice/warp.json";

const N = anchors.map((a) => a[0]), O = anchors.map((a) => a[1]);

/** authoring frame (fractional) shown at render frame f */
export const storyFrame = (f: number) => {
  if (f <= N[0]) return O[0] + (f - N[0]);
  let lo = 0, hi = N.length - 1;
  if (f >= N[hi]) return O[hi] + (f - N[hi]);
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (N[m] <= f) lo = m; else hi = m; }
  return O[lo] + ((f - N[lo]) * (O[hi] - O[lo])) / (N[hi] - N[lo]);
};
