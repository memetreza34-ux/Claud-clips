// One-word captions (same look as the bat and pigeon shorts): white bold sans, black outline, at 64 % of the height,
// hard swap per word, each word held until the next one, at least 4 frames.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import words from "../../../projects/whale/voice/words.json";
import { FPS } from "./timing";

const SPANS = (() => {
  const out: { w: string; a: number; b: number }[] = [];
  let prev = 0;
  words.forEach((w, i) => {
    const st = Math.max(w.s, prev), nxt = i + 1 < words.length ? words[i + 1].s : w.e + 0.4, en = Math.max(nxt, st + 4 / FPS);
    prev = en;
    out.push({ w: w.w.replace(/["„“”]/g, ""), a: st * FPS, b: en * FPS });
  });
  return out;
})();

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SPANS.find((s) => f >= s.a && f < s.b);
  if (!cur) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{ position: "absolute", top: "64%", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 76,
        color: "#ffffff", WebkitTextStroke: "11px #000000", paintOrder: "stroke fill", whiteSpace: "nowrap", lineHeight: 1 }}>
        {cur.w}
      </div>
    </AbsoluteFill>
  );
};
