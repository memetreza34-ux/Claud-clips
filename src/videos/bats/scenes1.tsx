// Shots 1-3 of the bat short. Each scene gets its local frame t (0 = shot start).
// Look: layered sets with depth of field (whatever is not in focus is blurred), light glows, colour grade + vignette,
// slightly wobbling hand-drawn outlines, shaded characters, wide-angle framing with lots of set detail.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Bat, Lytle, LytleHead } from "./chars";
import { BEAT, SHOTS } from "./timing";
import { Camera, Depth, Foreground, Glow, Grade, H, INK, LINE, Layer, Punch, W, Wobble, blinking, breathe, creep, lerp, punch } from "./kit";

type P = { t: number };
const at = (id: number, beat: number) => beat - SHOTS[id - 1].a; // beat frame in shot-local time
const WOB = { filter: "url(#wob)" };

/** flickering cartoon flames, base centre (x, y), size s */
export const Flames: React.FC<{ x: number; y: number; s: number; t: number; seed: string }> = ({ x, y, s, t, seed }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2, 3, 4].map((i) => {
      const ph = random(seed + i) * 6.28, h = 120 + 50 * Math.sin(t * 0.45 + ph) + random(seed + "h" + i) * 60;
      const dx = (i - 2) * 38 + Math.sin(t * 0.3 + ph) * 8, w = 46 + random(seed + "w" + i) * 20;
      const tip = Math.sin(t * 0.6 + ph) * 18;
      return (
        <g key={i}>
          <path d={`M${dx - w} 0 Q${dx - w} ${-h * 0.55} ${dx + tip} ${-h} Q${dx + w} ${-h * 0.55} ${dx + w} 0Z`} fill="#ff7a1a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${dx - w * 0.5} 0 Q${dx - w * 0.5} ${-h * 0.4} ${dx + tip * 0.6} ${-h * 0.62} Q${dx + w * 0.5} ${-h * 0.4} ${dx + w * 0.5} 0Z`} fill="#ffd23a" />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- shot 1: the burning base
const Sky1: React.FC<{ t: number }> = ({ t }) => (
  <Layer>
    <defs>
      <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1c1238" /><stop offset="0.5" stopColor="#5a2450" /><stop offset="0.8" stopColor="#c8503a" /><stop offset="1" stopColor="#f39a4a" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky1)" />
    {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={random(`sx${i}`) * W} cy={random(`sy${i}`) * 700} r={1.5 + random(`sr${i}`) * 2.5} fill="#ffffff" opacity={0.4 + 0.4 * Math.sin(t * 0.1 + i)} />)}
    {/* far desert mountains */}
    <path d="M0 1260 L140 1150 L260 1200 L420 1090 L600 1180 L760 1110 L900 1170 L1080 1080 L1080 1500 L0 1500Z" fill="#4a2648" />
    <path d="M0 1330 L200 1250 L380 1300 L560 1230 L780 1300 L1080 1240 L1080 1500 L0 1500Z" fill="#6a2f45" />
  </Layer>
);

const Base1: React.FC<{ t: number; flag: number }> = ({ t, flag }) => (
  <Layer>
    {/* control tower left, fuel tanks right, runway lights */}
    <rect x={20} y={980} width={90} height={500} fill="#6c7380" stroke={INK} strokeWidth={LINE} />
    <path d="M-10 940 L140 940 L120 1000 L10 1000Z" fill="#9ad0e8" stroke={INK} strokeWidth={LINE} />
    <rect x={-20} y={910} width={180} height={34} fill="#59606c" stroke={INK} strokeWidth={LINE} />
    <circle cx={65} cy={900} r={12} fill="#ff4a3a" />
    {[0, 1].map((i) => <g key={i}><rect x={960 + i * 70} y={1300} width={60} height={180} rx={20} fill="#c9ccd2" stroke={INK} strokeWidth={LINE} /><rect x={960 + i * 70} y={1350} width={60} height={14} fill="#c8323a" /></g>)}
    {/* hangar: arched roof, ribs, big door, light spill */}
    <path d="M150 1490 L150 1210 Q540 950 930 1210 L930 1490Z" fill="#a3abb6" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    <path d="M540 1030 Q760 1060 930 1210 L930 1490 L700 1490Z" fill="#7f8794" opacity={0.6} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${230 + i * 125} ${1170 - Math.sin(((i + 0.5) / 6) * Math.PI) * 95} L${230 + i * 125} 1490`} stroke="#7d8692" strokeWidth={5} />)}
    <rect x={340} y={1300} width={400} height={190} fill="#22242c" stroke={INK} strokeWidth={LINE} />
    <path d="M340 1490 L740 1490 L860 1640 L220 1640Z" fill="#ffb35a" opacity={0.25} />
    <text x={540} y={1270} textAnchor="middle" fontFamily="Arial Black, Arial" fontWeight={900} fontSize={52} fill="#f2f2f2" stroke={INK} strokeWidth={4} paintOrder="stroke">HANGAR 3</text>
    <rect x={880} y={850} width={10} height={380} fill="#d9d9d9" stroke={INK} strokeWidth={3} />
    <g transform={`translate(890 860) skewY(${Math.sin(t * 0.25) * 4})`}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={0} y={i * 17} width={170} height={17} fill={i % 2 ? "#f4f4f4" : "#c8323a"} />)}
      <rect x={0} y={0} width={76} height={68} fill="#2a4f9a" />
      <rect x={0} y={0} width={170} height={119} fill="none" stroke={INK} strokeWidth={4} />
      {flag > 0 && <Flames x={100} y={30} s={0.5 * flag} t={t} seed="flag" />}
    </g>
    <Flames x={300} y={1140} s={1.0} t={t} seed="r1" />
    <Flames x={560} y={1050} s={1.35} t={t + 7} seed="r2" />
    <Flames x={790} y={1140} s={0.95} t={t + 13} seed="r3" />
    {[0, 1, 2].map((i) => <circle key={i} cx={380 + i * 160} cy={780 - ((t * 2 + i * 60) % 220)} r={90 + i * 22} fill="#2a1a2e" opacity={0.4} />)}
    {/* tarmac with runway lights */}
    <rect x={-50} y={1490} width={1180} height={600} fill="#3e3438" stroke={INK} strokeWidth={LINE} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={60 + i * 160} cy={1560 + (i % 2) * 40} r={9} fill="#ffe28a" />)}
  </Layer>
);

/** shot 1: close on the hero bat with its bomb (base blurred behind), pull back to the burning base on "amerikanischer" */
export const Shot1: React.FC<P> = ({ t }) => {
  const rev = at(1, BEAT.american);
  const z = t < rev - 4 ? 2.5 * creep(t, rev, 0.08) + punch(t, at(1, BEAT.bats), 0.25) : lerp(t, rev - 4, rev + 16, 2.7, 1.0);
  const cy = t < rev - 4 ? 700 : lerp(t, rev - 4, rev + 16, 700, 1000);
  const bgBlur = t < rev - 4 ? 14 : lerp(t, rev - 4, rev + 12, 14, 0);
  const flag = t > rev ? Math.min(1, (t - rev) / 10) : 0;
  return (
    <AbsoluteFill>
      <Wobble f={t} />
      <Camera z={z} x={540} y={cy}>
        <Depth blur={bgBlur * 0.6}><Sky1 t={t} /></Depth>
        <Depth blur={bgBlur}><div style={WOB}><Base1 t={t} flag={flag} /></div></Depth>
        <Layer style={WOB}>
          <g transform={`translate(540 ${700 + breathe(t, 1.6, 6)}) scale(1.6)`}>
            <Bat expr="smug" hero bomb flap={0.5 + 0.5 * Math.sin(t * 0.9)} blink={blinking(t, "hero")} />
          </g>
        </Layer>
      </Camera>
      <Glow x={540} y={1250} r={700} color="#ff9a3a" a={0.45 + 0.08 * Math.sin(t * 0.6)} />
      {/* embers drifting up in front */}
      <Foreground blur={4}>
        <Layer>{Array.from({ length: 26 }, (_, i) => {
          const u = (random(`e${i}`) + t * 0.006 * (1 + random(`ev${i}`))) % 1;
          return <circle key={i} cx={random(`ex${i}`) * W + Math.sin(t * 0.1 + i) * 30} cy={H - u * H} r={3 + random(`es${i}`) * 5} fill="#ffcf5a" opacity={1 - u} />;
        })}</Layer>
      </Foreground>
      <Grade tint="#ffe2d0" vignette={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- shot 2: the cave at dusk
const Mini: React.FC<{ x: number; y: number; s: number; ph: number; c?: string }> = ({ x, y, s, ph, c = "#22172e" }) => {
  const up = Math.sin(ph) * 10;
  return <path transform={`translate(${x} ${y}) scale(${s})`} d={`M-30 ${-up} Q-14 -4 0 4 Q14 -4 30 ${-up} Q16 6 0 14 Q-16 6 -30 ${-up}Z`} fill={c} />;
};

const Swarm: React.FC<{ t: number; n?: number }> = ({ t, n = 320 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const u = (random(`u${i}`) + t * (0.004 + random(`v${i}`) * 0.003)) % 1;
      const spread = (random(`s${i}`) - 0.5) * (60 + u * 560);
      const x = 520 + u * 500 + spread * 0.6 + Math.sin(u * 9 + i) * 30;
      const y = 930 - u * 1150 + spread * 0.35;
      return <Mini key={i} x={x} y={y} s={0.45 + u * 0.95} ph={t * 0.9 + i} />;
    })}
  </g>
);

const CaveFar: React.FC = () => (
  <Layer>
    <defs>
      <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3d3478" /><stop offset="0.45" stopColor="#c86a7a" /><stop offset="0.75" stopColor="#ffb07a" /><stop offset="1" stopColor="#ffd9a0" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky2)" />
    <circle cx={820} cy={1010} r={120} fill="#fff1c0" />
    <path d="M0 1120 L120 1040 L130 980 L260 980 L270 1050 L420 1100 L560 1060 L600 1000 L720 1000 L740 1070 L1080 1110 L1080 1400 L0 1400Z" fill="#a8586a" opacity={0.85} />
  </Layer>
);

const CaveNear: React.FC<{ t: number }> = ({ t }) => (
  <Layer>
    <path d="M-40 1300 L110 880 L300 770 L520 710 L760 790 L980 910 L1120 1300Z" fill="#b8664a" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    {/* rock strata and shading */}
    <path d="M110 880 L300 770 L520 710 L560 760 L330 840 L150 960Z" fill="#d88a62" />
    <path d="M760 790 L980 910 L1120 1300 L900 1300 L860 980Z" fill="#8f4a3a" opacity={0.7} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${160 + i * 40} ${1010 + i * 60} Q540 ${930 + i * 60} ${960 - i * 30} ${1060 + i * 60}`} stroke="#9a5038" strokeWidth={5} fill="none" />)}
    <ellipse cx={540} cy={970} rx={160} ry={125} fill="#140c1c" stroke={INK} strokeWidth={LINE} />
    <ellipse cx={540} cy={990} rx={120} ry={90} fill="#000000" opacity={0.5} />
    <Swarm t={t} />
    {/* desert floor with path, rocks, cacti and the parked car */}
    <path d="M-40 1290 L1120 1290 L1120 1990 L-40 1990Z" fill="#dba56a" stroke={INK} strokeWidth={LINE} />
    <path d="M470 1290 L610 1290 L900 1990 L180 1990Z" fill="#e8bc82" />
    {[[140, 1420, 1], [930, 1460, 1.2], [80, 1700, 1.6]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 0 L0 -110 M0 -60 Q-40 -60 -40 -90 M0 -40 Q36 -40 36 -76" stroke="#5f7d3a" strokeWidth={20} strokeLinecap="round" fill="none" />
        <path d="M0 0 L0 -110 M0 -60 Q-40 -60 -40 -90 M0 -40 Q36 -40 36 -76" stroke="#7aa04a" strokeWidth={10} strokeLinecap="round" fill="none" />
      </g>
    ))}
    {[[300, 1380, 40], [780, 1360, 30], [980, 1600, 54]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} fill="#b07a4a" stroke={INK} strokeWidth={4} />)}
    <g transform="translate(760 1390) scale(0.9)">
      <path d="M-120 0 L-110 -50 Q-60 -90 30 -90 Q90 -90 110 -40 L130 0Z" fill="#3c6a8a" stroke={INK} strokeWidth={LINE} />
      <rect x={-60} y={-80} width={110} height={36} rx={10} fill="#bfe2f5" stroke={INK} strokeWidth={4} />
      <circle cx={-70} cy={4} r={24} fill="#22242c" stroke={INK} strokeWidth={4} /><circle cx={80} cy={4} r={24} fill="#22242c" stroke={INK} strokeWidth={4} />
    </g>
  </Layer>
);

/** shot 2: POV over Lytle's blurred shoulder at the cave, millions of bats pour out; cut in to his amazed face */
export const Shot2: React.FC<P> = ({ t }) => {
  const face = at(2, BEAT.millionen) - 12;
  if (t >= face) {
    const k = t - face, p = punch(k, 12, 0.3);
    return (
      <AbsoluteFill>
        <Wobble f={t} />
        {/* the cave behind him, far out of focus */}
        <Camera z={1.4} x={540} y={900}>
          <Depth blur={16}><CaveFar /></Depth>
          <Depth blur={12}><CaveNear t={t} /></Depth>
        </Camera>
        <Glow x={300} y={500} r={600} color="#ffd08a" a={0.5} />
        <Camera z={1.15 * creep(k, 90, 0.06) + p} x={540} y={900}>
          <Layer style={WOB}>
            <g transform="translate(540 820) scale(1.7)">
              <Lytle expr="amazed" look={[4, -12]} />
            </g>
            <g transform="translate(540 820) scale(1.7) translate(110 330) rotate(12) translate(0 -92)">
              {[0, 1, 2, 3, 4, 5].map((i) => <Mini key={i} x={-12 + ((i * 7 + k) % 24)} y={-10 + (i % 3) * 7} s={0.18} ph={k + i} />)}
            </g>
          </Layer>
        </Camera>
        <Grade tint="#ffe6d2" vignette={0.5} />
        <Punch f={k} at={12} until={40} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Wobble f={t} />
      <Camera z={creep(t, face, 0.1)} x={540} y={900}>
        <Depth blur={5}><CaveFar /></Depth>
        <div style={WOB}><CaveNear t={t} /></div>
      </Camera>
      <Glow x={820} y={1010} r={520} color="#ffc07a" a={0.55} />
      <Foreground blur={20}>
        <Layer>
          <g transform="translate(150 1880) scale(2.4)">
            <path d="M-200 200 Q-200 20 -40 0 L160 0 Q260 40 260 200Z" fill="#cfe6f5" stroke={INK} strokeWidth={LINE} />
            <ellipse cx={30} cy={-140} rx={150} ry={160} fill="#e9b58e" stroke={INK} strokeWidth={LINE} />
            <path d="M-120 -120 Q30 -40 180 -120 Q190 -20 150 0 L-90 0 Q-130 -40 -120 -120Z" fill="#5a3a2a" />
          </g>
        </Layer>
      </Foreground>
      <Grade tint="#ffe8d6" vignette={0.55} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- shot 3: the car
const Road: React.FC<{ t: number }> = ({ t }) => (
  <Layer>
    <defs>
      <linearGradient id="dusk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b347a" /><stop offset="0.55" stopColor="#e07a6a" /><stop offset="1" stopColor="#ffcf8a" /></linearGradient>
    </defs>
    <rect width={W} height={1000} fill="url(#dusk3)" />
    <circle cx={700} cy={690} r={70} fill="#fff0c0" />
    <path d="M0 720 L160 640 L180 600 L300 600 L320 660 L520 700 L1080 690 L1080 760 L0 760Z" fill="#9a5070" />
    <rect x={0} y={740} width={W} height={260} fill="#d8955a" />
    <path d="M0 1000 L470 740 L610 740 L1080 1000Z" fill="#4e4448" />
    {[0, 1, 2, 3, 4].map((i) => {
      const u = ((i * 0.2 + t * 0.012) % 1), y = 745 + u * u * 255, w = 3 + u * u * 26;
      return <rect key={i} x={540 - w / 2} y={y} width={w} height={6 + u * u * 50} fill="#ffe08a" />;
    })}
    {[0, 1, 2].map((i) => {
      const u = ((i / 3 + t * 0.01) % 1), x = 620 + u * u * 560, y = 735 - u * u * 60, h = 30 + u * u * 520;
      return <g key={i}><rect x={x} y={y - h} width={4 + u * 14} height={h} fill="#5a3a30" /><rect x={x - 20 - u * 60} y={y - h} width={40 + u * 130} height={4 + u * 10} fill="#5a3a30" /></g>;
    })}
  </Layer>
);

const Dash: React.FC<{ t: number; turn: number }> = ({ t, turn }) => (
  <Layer>
    {/* windshield frame, mirror */}
    <path d="M0 0 L1080 0 L1080 120 Q540 60 0 120Z" fill="#3a2a2a" stroke={INK} strokeWidth={LINE} />
    <path d="M0 0 L120 0 L60 1000 L0 1000Z M1080 0 L960 0 L1020 1000 L1080 1000Z" fill="#4a3434" stroke={INK} strokeWidth={LINE} />
    <rect x={420} y={90} width={240} height={70} rx={20} fill="#6a7a8a" stroke={INK} strokeWidth={LINE} />
    <rect x={440} y={102} width={200} height={46} rx={12} fill="#c8d8e8" />
    <path d="M540 60 L540 92" stroke={INK} strokeWidth={10} />
    {/* hood with chrome ornament */}
    <path d="M60 1000 Q540 900 1020 1000Z" fill="#3c6a8a" stroke={INK} strokeWidth={LINE} />
    <path d="M540 905 l-12 30 l24 0Z" fill="#e8e8f0" stroke={INK} strokeWidth={4} />
    {/* dashboard */}
    <path d="M0 990 Q540 900 1080 990 L1080 1920 L0 1920Z" fill="#7a4a32" stroke={INK} strokeWidth={LINE} />
    <path d="M0 1030 Q540 950 1080 1030" stroke="#a8704a" strokeWidth={14} fill="none" />
    <path d="M0 1070 Q540 990 1080 1070" stroke="#c9c9d2" strokeWidth={6} fill="none" />
    {/* speedometer */}
    <g transform="translate(220 1220)">
      <circle r={110} fill="#f2ead8" stroke={INK} strokeWidth={LINE} />
      {Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.8 + i * 0.175); return <path key={i} d={`M${Math.cos(a) * 80} ${Math.sin(a) * 80} L${Math.cos(a) * 96} ${Math.sin(a) * 96}`} stroke={INK} strokeWidth={5} />; })}
      <path d={`M0 0 L${Math.cos(Math.PI * (1.45 + 0.02 * Math.sin(t * 0.3))) * 80} ${Math.sin(Math.PI * (1.45 + 0.02 * Math.sin(t * 0.3))) * 80}`} stroke="#c8323a" strokeWidth={7} strokeLinecap="round" />
      <circle r={12} fill={INK} />
    </g>
    {/* radio */}
    <rect x={400} y={1130} width={440} height={230} rx={26} fill="#3b2a22" stroke={INK} strokeWidth={LINE} />
    <rect x={430} y={1160} width={260} height={90} rx={12} fill="#a8ffcc" stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <path key={i} d={`M${450 + i * 28} 1170 L${450 + i * 28} ${i % 2 ? 1186 : 1196}`} stroke="#2a6a4a" strokeWidth={3} />)}
    <rect x={460 + ((t * 3) % 200)} y={1166} width={7} height={78} fill="#c0392b" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={440 + i * 62} y={1280} width={44} height={44} rx={8} fill="#d9c9a8" stroke={INK} strokeWidth={4} />)}
    <g transform={`translate(760 1240) rotate(${turn * 3})`}>
      <circle r={48} fill="#c9b08a" stroke={INK} strokeWidth={LINE} />
      <rect x={-6} y={-42} width={12} height={30} fill={INK} />
    </g>
    {/* glovebox */}
    <rect x={720} y={1450} width={300} height={170} rx={20} fill="#6a3e2a" stroke={INK} strokeWidth={LINE} />
    <rect x={840} y={1470} width={60} height={16} rx={6} fill="#c9c9d2" stroke={INK} strokeWidth={3} />
  </Layer>
);

/** shot 3: POV through the windshield, a hand turns the radio; cut to Lytle's narrowing eyes on "Pearl Harbor" */
export const Shot3: React.FC<P> = ({ t }) => {
  const cut = at(3, BEAT.pearl) - 8;
  if (t >= cut) {
    const k = t - cut;
    return (
      <AbsoluteFill>
        <Wobble f={t} />
        <AbsoluteFill style={{ background: "#3a2830" }} />
        {/* side window with the landscape sliding past, out of focus */}
        <Depth blur={10}>
          <Layer>
            <rect x={40} y={260} width={1000} height={700} rx={50} fill="#f2a46a" />
            {[0, 1, 2].map((i) => <path key={i} d={`M${1200 - ((i * 460 + t * 12) % 1500)} 800 l90 -240 l90 240Z`} fill="#c96a48" />)}
            <rect x={40} y={800} width={1000} height={160} fill="#b9734a" />
            <rect x={40} y={260} width={1000} height={700} rx={50} fill="none" stroke="#2a1d1a" strokeWidth={40} />
          </Layer>
        </Depth>
        <Camera z={1.2 * creep(k, 110, 0.07) + punch(k, 8, 0.4)} x={520} y={880}>
          <Layer style={WOB}>
            <g transform="translate(540 980) scale(1.75)">
              <path d="M-170 300 Q-160 180 -60 160 L60 160 Q160 180 170 300 L170 600 L-170 600Z" fill="#cfe6f5" stroke={INK} strokeWidth={LINE} />
              <LytleHead expr="narrow" look={[14, 4]} />
            </g>
          </Layer>
        </Camera>
        {/* green radio light from below, warm dusk from the window */}
        <Glow x={540} y={1900} r={900} color="#5affa8" a={0.32 + 0.06 * Math.sin(k * 0.7)} />
        <Glow x={100} y={500} r={700} color="#ffb07a" a={0.4} />
        <Grade tint="#f2e2e8" vignette={0.65} />
        <Punch f={k} at={8} until={34} />
      </AbsoluteFill>
    );
  }
  const turn = lerp(t, 10, 40, -20, 35);
  return (
    <AbsoluteFill>
      <Wobble f={t} />
      <Camera z={creep(t, cut, 0.06)} x={540} y={1000}>
        <Depth blur={3}><Road t={t} /></Depth>
        <div style={WOB}><Dash t={t} turn={turn} /></div>
      </Camera>
      {/* steering wheel and hand, close to the lens */}
      <Foreground blur={14}>
        <Layer><circle cx={150} cy={1720} r={380} fill="none" stroke="#24181a" strokeWidth={80} /><path d="M150 1720 L-120 1640" stroke="#24181a" strokeWidth={60} /></Layer>
      </Foreground>
      <AbsoluteFill style={{ transform: `translate(${lerp(t, 0, 14, 300, 0)}px, ${lerp(t, 0, 14, 260, 0)}px)` }}>
        <Layer style={WOB}>
          <g transform={`translate(780 1290) rotate(${turn})`}>
            <path d="M40 40 L360 420" stroke={INK} strokeWidth={130} strokeLinecap="round" />
            <path d="M40 40 L360 420" stroke="#cfe6f5" strokeWidth={118} strokeLinecap="round" />
            <path d="M120 140 L360 420" stroke="#a9cde6" strokeWidth={40} strokeLinecap="round" />
            <circle cx={20} cy={20} r={70} fill="#f3c39b" stroke={INK} strokeWidth={LINE} />
            <path d="M-30 -20 Q-10 -60 30 -30 M-46 10 Q-60 -20 -40 -40" stroke={INK} strokeWidth={5} fill="none" />
          </g>
        </Layer>
      </AbsoluteFill>
      <Glow x={560} y={1200} r={360} color="#7dffb0" a={0.3} />
      <Glow x={700} y={700} r={600} color="#ffd08a" a={0.35} />
      <Grade tint="#fbe6dc" vignette={0.6} />
    </AbsoluteFill>
  );
};

/** stand-in for shots that are not built yet */
export const Todo: React.FC<{ id: number }> = ({ id }) => (
  <AbsoluteFill style={{ background: "#2d2a3a", justifyContent: "center", alignItems: "center", color: "#fff", fontFamily: "Arial Black, Arial", fontSize: 64, textAlign: "center" }}>
    Shot {id}<br />{SHOTS[id - 1].place}<br /><span style={{ fontSize: 36, opacity: 0.6 }}>kommt noch</span>
  </AbsoluteFill>
);
