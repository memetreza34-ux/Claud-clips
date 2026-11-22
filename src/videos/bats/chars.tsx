// Original cast of the bat short, drawn as flat SVG with a thick dark outline.
// Lytle: small dentist, peach round head, side hair and a bald top, round glasses, light blue coat, dental mirror.
// Bat: round plum body, big ears, sleepy lids; the hero bat wears a tiny green helmet and carries a red firebomb.
import React from "react";
import { INK, LINE } from "./kit";

export type LytleExpr = "neutral" | "amazed" | "grin" | "narrow" | "panic" | "proud";

const SKIN = "#f3c39b", SKIN_D = "#e2a57c", HAIR = "#5a3a2a", COAT = "#cfe6f5", COAT_D = "#a9cde6";

/** Lytle's head, centre (0, 0), radius ~150. look: pupil offset in px. */
export const LytleHead: React.FC<{ expr?: LytleExpr; look?: [number, number]; blink?: boolean; mouthOpen?: number }> = ({ expr = "neutral", look = [0, 0], blink = false, mouthOpen = 0 }) => {
  const eyeH = expr === "amazed" || expr === "panic" ? 46 : expr === "narrow" ? 17 : 34;
  const pupil = expr === "amazed" || expr === "panic" ? 11 : 15;
  const brow = (side: -1 | 1) => {
    const y = expr === "amazed" || expr === "panic" ? -112 : expr === "narrow" ? (side === -1 ? -64 : -72) : expr === "grin" ? (side === 1 ? -108 : -78) : -88;
    const tilt = expr === "narrow" ? side * 14 : expr === "panic" ? -side * 12 : expr === "grin" && side === 1 ? -10 : 0;
    return <path d={`M${side * 30} ${y + tilt} Q${side * 62} ${y - 14} ${side * 96} ${y - tilt}`} stroke={HAIR} strokeWidth={15} fill="none" strokeLinecap="round" />;
  };
  const eye = (side: -1 | 1) => (
    <g transform={`translate(${side * 62} -28)`}>
      {blink ? (
        <path d={`M-30 0 Q0 ${blink ? 10 : 6} 30 0`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse rx={30} ry={eyeH} fill="#ffffff" stroke={INK} strokeWidth={5} />
          <circle cx={look[0]} cy={look[1]} r={pupil} fill={INK} />
          <circle cx={look[0] + 5} cy={look[1] - 6} r={4} fill="#ffffff" />
        </>
      )}
      {/* glasses */}
      <circle r={50} fill="rgba(200,230,255,0.18)" stroke={INK} strokeWidth={8} />
    </g>
  );
  const mouth = () => {
    if (expr === "amazed" || mouthOpen > 0.3) return <ellipse cx={0} cy={70} rx={26} ry={30 + mouthOpen * 10} fill="#7a2630" stroke={INK} strokeWidth={LINE} />;
    if (expr === "panic") return <path d="M-46 76 Q0 40 46 76 Q0 112 -46 76Z" fill="#7a2630" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />;
    if (expr === "grin") return <path d="M-50 56 Q10 108 64 46 Q10 80 -50 56Z" fill="#ffffff" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />;
    if (expr === "proud") return <path d="M-44 62 Q0 96 44 62" stroke={INK} strokeWidth={LINE} fill="none" strokeLinecap="round" />;
    if (expr === "narrow") return <path d="M-30 74 Q8 66 40 60" stroke={INK} strokeWidth={LINE} fill="none" strokeLinecap="round" />;
    return <path d="M-30 72 Q0 84 30 72" stroke={INK} strokeWidth={LINE} fill="none" strokeLinecap="round" />;
  };
  return (
    <g>
      {/* ears */}
      <ellipse cx={-150} cy={0} rx={26} ry={36} fill={SKIN} stroke={INK} strokeWidth={LINE} />
      <ellipse cx={150} cy={0} rx={26} ry={36} fill={SKIN} stroke={INK} strokeWidth={LINE} />
      {/* head */}
      <defs>
        <clipPath id="lytleHead"><ellipse cx={0} cy={0} rx={150} ry={160} /></clipPath>
        <radialGradient id="lytleSkin" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#ffd9b8" /><stop offset="0.6" stopColor={SKIN} /><stop offset="1" stopColor={SKIN_D} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={150} ry={160} fill="url(#lytleSkin)" />
      {/* shadow side (key light from the upper left) and a cool rim on the right */}
      <g clipPath="url(#lytleHead)">
        <ellipse cx={120} cy={40} rx={110} ry={190} fill="#b9765a" opacity={0.28} />
        <ellipse cx={0} cy={150} rx={160} ry={50} fill="#a8644a" opacity={0.22} />
        <path d="M140 -60 Q160 20 128 110" stroke="#cfe2ff" strokeWidth={8} fill="none" opacity={0.55} />
      </g>
      <ellipse cx={0} cy={0} rx={150} ry={160} fill="none" stroke={INK} strokeWidth={LINE} />
      <ellipse cx={-50} cy={-96} rx={54} ry={24} fill="#ffffff" opacity={0.28} />
      {/* side hair, bald top */}
      <path d="M-150 -30 Q-160 -110 -96 -128 Q-120 -80 -118 -20Z" fill={HAIR} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M150 -30 Q160 -110 96 -128 Q120 -80 118 -20Z" fill={HAIR} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M-20 -158 Q0 -186 26 -160" stroke={HAIR} strokeWidth={8} fill="none" strokeLinecap="round" />
      {/* cheeks */}
      <ellipse cx={-92} cy={44} rx={24} ry={14} fill={SKIN_D} opacity={0.7} />
      <ellipse cx={92} cy={44} rx={24} ry={14} fill={SKIN_D} opacity={0.7} />
      {brow(-1)}{brow(1)}
      {eye(-1)}{eye(1)}
      {/* nose */}
      <path d="M0 0 Q-22 34 4 40" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      {mouth()}
      {expr === "panic" && <path d="M120 -110 q10 30 0 44 q-14 -10 0 -44Z" fill="#8fd3ff" stroke={INK} strokeWidth={4} />}
    </g>
  );
};

/** Lytle from the waist up: head at (0, 0), coat below; arm: angle of the right arm in degrees */
export const Lytle: React.FC<{ expr?: LytleExpr; look?: [number, number]; blink?: boolean; arm?: number; mirror?: boolean }> = ({ expr, look, blink, arm = 0, mirror = true }) => (
  <g>
    {/* coat */}
    <path d="M-170 380 Q-190 230 -110 170 L110 170 Q190 230 170 380 L170 640 L-170 640Z" fill={COAT} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    <path d="M0 175 L-50 300 M0 175 L50 300" stroke={COAT_D} strokeWidth={10} />
    <path d="M-60 168 L0 240 L60 168" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-20 180 L0 220 L20 180" fill="#c0392b" stroke={INK} strokeWidth={4} />
    {/* pocket with the dental mirror */}
    <rect x={60} y={330} width={80} height={70} rx={10} fill={COAT_D} stroke={INK} strokeWidth={5} />
    {mirror && (
      <g transform="translate(110 330) rotate(12)">
        <rect x={-5} y={-80} width={10} height={90} fill="#b8bec6" stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-92} r={20} fill="#e8f4ff" stroke={INK} strokeWidth={5} />
      </g>
    )}
    {/* arms */}
    <path d="M-150 220 Q-220 380 -150 520" stroke={INK} strokeWidth={56} fill="none" strokeLinecap="round" />
    <path d="M-150 220 Q-220 380 -150 520" stroke={COAT} strokeWidth={42} fill="none" strokeLinecap="round" />
    <g transform={`translate(150 220) rotate(${arm})`}>
      <path d="M0 0 Q70 160 0 300" stroke={INK} strokeWidth={56} fill="none" strokeLinecap="round" />
      <path d="M0 0 Q70 160 0 300" stroke={COAT} strokeWidth={42} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={318} r={34} fill={SKIN} stroke={INK} strokeWidth={LINE} />
    </g>
    {/* neck + head */}
    <rect x={-40} y={130} width={80} height={60} fill={SKIN} stroke={INK} strokeWidth={LINE} />
    <LytleHead expr={expr} look={look} blink={blink} />
  </g>
);

export type BatExpr = "sleep" | "awake" | "smug" | "shock";
const FUR = "#5b4470", FUR_D = "#3f2e52", WING = "#4a375e";

/** a bat, body centre (0, 0), ~120 px wide; flap 0..1 opens the wings; hero adds helmet + bomb */
export const Bat: React.FC<{ expr?: BatExpr; flap?: number; hero?: boolean; bomb?: boolean; blink?: boolean; look?: [number, number] }> = ({ expr = "awake", flap = 0.4, hero = false, bomb = false, blink = false, look = [0, 0] }) => {
  const wing = (side: -1 | 1) => {
    const up = -40 + flap * -70, out = 120 + flap * 60;
    return <path d={`M${side * 40} -10 Q${side * (out * 0.6)} ${up - 40} ${side * out} ${up} Q${side * (out * 0.8)} ${up + 40} ${side * (out * 0.62)} ${up + 26} Q${side * (out * 0.5)} ${up + 66} ${side * (out * 0.34)} ${up + 44} Q${side * 60} 40 ${side * 36} 24Z`}
      fill={WING} stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
  };
  const eyes = expr === "sleep" || blink;
  return (
    <g>
      {wing(-1)}{wing(1)}
      {/* ears */}
      <path d="M-46 -40 L-62 -118 L-14 -60Z" fill={FUR} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M46 -40 L62 -118 L14 -60Z" fill={FUR} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-44 -56 L-54 -98 L-26 -64Z M44 -56 L54 -98 L26 -64Z" fill="#c98aa8" />
      <defs>
        <radialGradient id="batFur" cx="0.36" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#8a6aa8" /><stop offset="0.55" stopColor={FUR} /><stop offset="1" stopColor={FUR_D} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={62} ry={66} fill="url(#batFur)" stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={26} rx={36} ry={30} fill={FUR_D} opacity={0.45} />
      <path d="M50 -30 Q64 4 46 40" stroke="#ffb27a" strokeWidth={5} fill="none" opacity={0.6} />
      {eyes ? (
        <>
          <path d="M-36 -10 Q-22 2 -8 -10" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M8 -10 Q22 2 36 -10" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={-22} cy={-12} rx={expr === "shock" ? 18 : 15} ry={expr === "shock" ? 22 : 17} fill="#fff6c8" stroke={INK} strokeWidth={4} />
          <ellipse cx={22} cy={-12} rx={expr === "shock" ? 18 : 15} ry={expr === "shock" ? 22 : 17} fill="#fff6c8" stroke={INK} strokeWidth={4} />
          <circle cx={-22 + look[0]} cy={-10 + look[1]} r={expr === "shock" ? 5 : 7} fill={INK} />
          <circle cx={22 + look[0]} cy={-10 + look[1]} r={expr === "shock" ? 5 : 7} fill={INK} />
          {expr === "smug" && <path d="M-40 -26 L-6 -20 M40 -26 L6 -20" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
        </>
      )}
      {/* mouth + fangs */}
      {expr === "shock" ? <ellipse cx={0} cy={22} rx={10} ry={12} fill="#2a1830" /> : (
        <path d={expr === "smug" ? "M-16 18 Q4 30 20 14" : "M-12 20 Q0 28 12 20"} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      )}
      <path d="M-8 22 L-5 31 L-2 23 M8 22 L5 31 L2 23" fill="#ffffff" stroke={INK} strokeWidth={2} />
      {expr === "sleep" && <text x={46} y={-60} fontFamily="Arial Black, Arial" fontWeight={900} fontSize={34} fill="#ffffff" stroke={INK} strokeWidth={3} paintOrder="stroke">z</text>}
      {hero && (
        <g>
          <path d="M-52 -46 Q0 -96 52 -46 Z" fill="#6b8f3a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <rect x={-58} y={-50} width={116} height={12} rx={6} fill="#557330" stroke={INK} strokeWidth={5} />
        </g>
      )}
      {bomb && (
        <g transform="translate(0 74)">
          <rect x={-22} y={-14} width={44} height={56} rx={14} fill="#d8392b" stroke={INK} strokeWidth={6} />
          <rect x={-22} y={4} width={44} height={8} fill="#f5d04a" stroke={INK} strokeWidth={3} />
          <path d="M0 42 q8 14 -4 24" stroke={INK} strokeWidth={4} fill="none" />
          <path d="M-62 -10 L62 -10" stroke="#8a6a3a" strokeWidth={7} />
        </g>
      )}
    </g>
  );
};
