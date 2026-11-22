// "Die Fledermausbombe" in the 2.5D look (painted plates + our characters, shots.tsx). Place changes crossfade over
// 8 frames, the hook ends on a white flash; captions and the finished mix (scripts/bats_audio.py) on top.
import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from "remotion";
import mix from "../../../projects/bats/audio/mix.wav";
import { Captions } from "../bats/Captions";
import { FLASH, SHOTS, TOTAL } from "../bats/timing";
import { SCENES } from "./shots";

export const BATSP_FRAMES = TOTAL;
const XF = new Set([3, 5, 6, 7, 11, 12, 13, 15]);
const FADE = 8;

const Scene: React.FC<{ id: number; from: number }> = ({ id, from }) => {
  const t = useCurrentFrame(), f = from + t, a = SHOTS[id - 1].a, S = SCENES[id];
  const alpha = XF.has(id) ? Math.max(0, Math.min(1, (f - (a - FADE) + 1) / (FADE + 1))) : 1;
  return <AbsoluteFill style={{ opacity: alpha }}><S t={f - a} f={f} /></AbsoluteFill>;
};

export const BatsPShort: React.FC = () => {
  const f = useCurrentFrame();
  const flash = f >= FLASH && f < FLASH + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH] : 0;
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
