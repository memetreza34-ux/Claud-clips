// One-word captions rendered inside the composition (no extra ffmpeg pass): white bold sans in sentence case with its
// punctuation, black outline, lower middle, a hard swap on every word, each word held until the next one starts and at
// least 4 frames. Timed in RENDER frames from the current narration (voice/words.json), not in story frames.
// Placed at 64 % of the height: inside the vertical-video safe area (app titles and buttons cover the bottom ~18 %).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import words from "../../../projects/pigeon/voice/words.json";

const FPS = 30;
const SPANS = (() => {
  const out: { w: string; a: number; b: number }[] = [];
  let prev = 0;
  words.forEach((w, i) => {
    const st = Math.max(w.s, prev), nxt = i + 1 < words.length ? words[i + 1].s : w.e + 0.4, en = Math.max(nxt, st + 4 / FPS);
    prev = en;
    out.push({ w: w.w.replace(/"/g, "").replace(/'/g, "’"), a: st * FPS, b: en * FPS });
  });
  return out;
})();

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SPANS.find((s) => f >= s.a && f < s.b);
  if (!cur) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{ position: "absolute", top: "64%", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 72,
        color: "#ffffff", WebkitTextStroke: "10px #000000", paintOrder: "stroke fill", whiteSpace: "nowrap", lineHeight: 1 }}>
        {cur.w}
      </div>
    </AbsoluteFill>
  );
};
