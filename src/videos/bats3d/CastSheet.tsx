// Model sheet of the bat-short cast (a still composition for review): Lytle in four expressions, bats in four looks.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "../pigeon/toon";
import { drawBat, drawLytle } from "./bcast";

const Card: React.FC<{ draw: (p: Pen) => void; label: string }> = ({ draw, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, 600, 1000);
    draw(new Pen(g));
  }, [draw]);
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas ref={ref} width={600} height={1000} style={{ width: 270, height: 450 }} />
      <div style={{ fontFamily: "Arial", fontSize: 28, color: "#333" }}>{label}</div>
    </div>
  );
};

const L = (expr: "neutral" | "shock" | "grin" | "stern", label: string) => <Card label={label} draw={(p) => drawLytle(p, { expr, mode: "stand" })} />;

export const CastSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e3d2b8)", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: 0 }}>
    {L("neutral", "Lytle neutral")}{L("shock", "staunend")}{L("grin", "grinst")}{L("stern", "misstrauisch")}
    <Card label="Held (smug)" draw={(p) => drawBat(p, { look: "smug", hero: true, bomb: true, flap: 0.6 })} />
    <Card label="schläft" draw={(p) => drawBat(p, { look: "sleep", flap: 0 })} />
    <Card label="wach" draw={(p) => drawBat(p, { look: "awake", flap: 0.5, gaze: 1 })} />
    <Card label="Schreck" draw={(p) => drawBat(p, { look: "shock", flap: 1 })} />
  </AbsoluteFill>
);
