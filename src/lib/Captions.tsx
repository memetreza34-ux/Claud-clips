// Captions from words.json. "short": one word at a time, white bold with a black outline, at 64 % of the height
// (the reference look). "long": a subtitle line of up to 7 words at the bottom, for 16:9 long videos.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS } from "./timing";

type Word = { w: string; s: number; e: number };
const clean = (w: string) => w.replace(/["„“”]/g, "");

export const Captions: React.FC<{ words: Word[]; mode?: "short" | "long" }> = ({ words, mode = "short" }) => {
  const f = useCurrentFrame();
  const spans = useMemo(() => {
    const out: { w: string; a: number; b: number }[] = [];
    if (mode === "short") {
      let prev = 0;
      words.forEach((w, i) => {
        const st = Math.max(w.s, prev), nxt = i + 1 < words.length ? words[i + 1].s : w.e + 0.4, en = Math.max(nxt, st + 4 / FPS);
        prev = en; out.push({ w: clean(w.w), a: st * FPS, b: en * FPS });
      });
    } else {
      // phrases of up to 7 words, broken after sentence ends and pauses over 0.35 s
      let cur: Word[] = [];
      const flush = (end: number) => { if (cur.length) out.push({ w: cur.map((x) => clean(x.w)).join(" "), a: cur[0].s * FPS, b: end * FPS }); cur = []; };
      words.forEach((w, i) => {
        cur.push(w);
        const next = words[i + 1], gap = next ? next.s - w.e : 1;
        if (cur.length >= 7 || /[.?!]$/.test(w.w) || gap > 0.35) flush(next ? Math.min(next.s, w.e + 0.6) : w.e + 0.6);
      });
      flush(words[words.length - 1].e + 0.6);
    }
    return out;
  }, [words, mode]);
  const cur = spans.find((s) => f >= s.a && f < s.b);
  if (!cur) return null;
  const short = mode === "short";
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{ position: "absolute", top: short ? "64%" : "86%", maxWidth: short ? undefined : "80%", textAlign: "center",
        fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: short ? 76 : 54, color: "#ffffff",
        WebkitTextStroke: short ? "11px #000000" : "8px #000000", paintOrder: "stroke fill", whiteSpace: short ? "nowrap" : "normal", lineHeight: 1.15 }}>
        {cur.w}
      </div>
    </AbsoluteFill>
  );
};
