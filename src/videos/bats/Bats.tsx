// "Die Fledermausbombe": the first fully 2D short (flat SVG characters and sets, drawn in code), German narration in
// Arman's cloned voice. Shot table in timing.ts (from projects/bats/SHOTS.md), scenes in scenes*.tsx.
import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from "remotion";
import voice from "../../../projects/bats/voice/voice.wav";
import { Captions } from "./Captions";
import { Shot1, Shot2, Shot3, Todo } from "./scenes1";
import { FLASH, SHOTS, TOTAL } from "./timing";

export const BATS_FRAMES = TOTAL;

const SCENES: Record<number, React.FC<{ t: number }>> = { 1: Shot1, 2: Shot2, 3: Shot3 };

const Scene: React.FC<{ id: number }> = ({ id }) => {
  const t = useCurrentFrame();
  const S = SCENES[id];
  return S ? <S t={t} /> : <Todo id={id} />;
};

export const BatsShort: React.FC = () => {
  const f = useCurrentFrame();
  const flash = f >= FLASH && f < FLASH + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH] : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((s) => (
        <Sequence key={s.id} from={s.a} durationInFrames={s.b - s.a}>
          <Scene id={s.id} />
        </Sequence>
      ))}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Captions />
      <Audio src={voice} />
    </AbsoluteFill>
  );
};
