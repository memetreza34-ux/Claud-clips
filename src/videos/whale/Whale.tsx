// "Der explodierende Wal" in the 2.5D look of the bat short (painted plates + our own drawings, shots.tsx).
// Place changes crossfade over 8 frames; white flashes after the hook and on the blast; captions and the finished mix
// (scripts/whale_audio.py) on top.
import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from "remotion";
import mix from "../../../projects/whale/audio/mix.wav";
import { Captions } from "./Captions";
import { FLASHES, SHOTS, TOTAL } from "./timing";
import { SCENES } from "./flowshots";

export const WHALE_FRAMES = TOTAL;
/** shots that crossfade in (a new place); the rest cut */
const XF = new Set([3, 4, 5, 6, 7, 8, 9, 12, 14, 15, 16, 17, 18, 19]);
const FADE = 8;

const Scene: React.FC<{ id: number; from: number }> = ({ id, from }) => {
  const t = useCurrentFrame(), f = from + t, a = SHOTS[id - 1].a, S = SCENES[id];
  const alpha = XF.has(id) ? Math.max(0, Math.min(1, (f - (a - FADE) + 1) / (FADE + 1))) : 1;
  return <AbsoluteFill style={{ opacity: alpha }}><S t={f - a} f={f} /></AbsoluteFill>;
};

export const WhaleShort: React.FC = () => {
  const f = useCurrentFrame();
  const fl = FLASHES.find((x) => f >= x && f < x + 4);
  const flash = fl === undefined ? 0 : [1, 0.75, 0.45, 0.2][f - fl];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((s) => {
        const from = s.a - (XF.has(s.id) ? FADE : 0);
        return <Sequence key={s.id} from={from} durationInFrames={s.b - from}><Scene id={s.id} from={from} /></Sequence>;
      })}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Captions />
      <Audio src={mix} />
    </AbsoluteFill>
  );
};
