// 2D toolkit for the bat short: palette, camera moves, reaction zoom (vignette + speed lines), soft foreground blur.
// Everything is drawn in a 1080x1920 SVG/DOM space; the camera scales and moves a whole shot around a focus point.
import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";

export const W = 1080, H = 1920;
export const INK = "#1d1a22";
export const LINE = 5; // outline width at 1080 px

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const lerp = (f: number, a: number, b: number, from: number, to: number, e = ease) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });

/** camera: zoom `z` around the point (x, y) of the shot, which lands in the frame centre at z > 1 */
export const Camera: React.FC<{ z: number; x?: number; y?: number; children: React.ReactNode }> = ({ z, x = W / 2, y = H / 2, children }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${z}) translate(${-x}px, ${-y}px)` }}>
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

/** the slow creep every hold gets: 1 -> 1 + amount over the shot */
export const creep = (f: number, len: number, amount = 0.06) => 1 + amount * Math.min(1, f / Math.max(1, len));

/** reaction zoom on a joke beat: fast push (6 f), hold, used with <Punch/> for the vignette and speed lines */
export const punch = (f: number, at: number, peak = 0.35) =>
  f < at - 2 ? 0 : interpolate(f, [at - 2, at + 4, at + 14, at + 22], [0, peak, peak * 0.9, peak * 0.85], { ...clamp, easing: Easing.out(Easing.cubic) });

export const Punch: React.FC<{ f: number; at: number; until?: number }> = ({ f, at, until = at + 24 }) => {
  if (f < at - 2 || f > until) return null;
  const k = interpolate(f, [at - 2, at + 3, until - 6, until], [0, 1, 1, 0], clamp);
  const lines = Array.from({ length: 34 }, (_, i) => {
    const ang = (i / 34) * Math.PI * 2 + random(`a${i}`) * 0.12;
    const r0 = 560 + random(`r${i}`) * 260 - ((f * 37 + i * 53) % 90);
    const len = 220 + random(`l${i}`) * 260;
    const w = 6 + random(`w${i}`) * 10;
    const c = Math.cos(ang), s = Math.sin(ang);
    return <path key={i} d={`M${W / 2 + c * r0} ${H / 2 + s * r0 * 1.4} L${W / 2 + c * (r0 + len) - s * w} ${H / 2 + s * (r0 + len) * 1.4 + c * w} L${W / 2 + c * (r0 + len) + s * w} ${H / 2 + s * (r0 + len) * 1.4 - c * w}Z`} fill="#ffffff" opacity={0.75} />;
  });
  return (
    <AbsoluteFill style={{ opacity: k, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 48% at 50% 46%, rgba(10,8,20,0) 52%, rgba(10,8,20,0.88) 100%)" }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>{lines}</svg>
    </AbsoluteFill>
  );
};

/** soft out-of-focus layer in front of the camera (a shoulder, a lamp, a wing) */
export const Foreground: React.FC<{ blur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ blur = 22, children, style }) => (
  <AbsoluteFill style={{ filter: `blur(${blur}px)`, ...style }}>{children}</AbsoluteFill>
);

/** full-frame SVG layer in shot space */
export const Layer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>{children}</svg>
);

/** hand-drawn feel: outlines wobble slightly and "boil" (new noise seed every 4 frames, like redrawn animation) */
export const Wobble: React.FC<{ f: number; amount?: number; id?: string }> = ({ f, amount = 3.2, id = "wob" }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={Math.floor(f / 4) % 7} />
      <feDisplacementMap in="SourceGraphic" scale={amount} />
    </filter>
  </svg>
);

/** depth layer: blurred when out of focus (background behind a close-up, foreground in a wide) */
export const Depth: React.FC<{ blur: number; children: React.ReactNode }> = ({ blur, children }) => (
  <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>
);

/** a light source glow (lamp, fire, moon): additive-looking radial gradient */
export const Glow: React.FC<{ x: number; y: number; r: number; color: string; a?: number }> = ({ x, y, r, color, a = 0.55 }) => (
  <AbsoluteFill style={{ mixBlendMode: "screen", opacity: a, background: `radial-gradient(circle ${r}px at ${x}px ${y}px, ${color} 0%, transparent 100%)` }} />
);

/** colour grade over the finished shot: tint (multiply), lift, and a soft vignette */
export const Grade: React.FC<{ tint: string; vignette?: number; lift?: string }> = ({ tint, vignette = 0.55, lift = "rgba(40,30,70,0.12)" }) => (
  <>
    <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} />
    <AbsoluteFill style={{ background: lift, mixBlendMode: "screen" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, rgba(8,6,18,${vignette}) 100%)` }} />
  </>
);

/** blink: eyes closed for 3 frames every ~2.5-4 s, offset per character */
export const blinking = (f: number, seed: string) => {
  const period = 80 + Math.floor(random(seed) * 40);
  return (f + Math.floor(random(seed + "o") * period)) % period < 3;
};

/** gentle idle bob for characters */
export const breathe = (f: number, speed = 1, amp = 1) => Math.sin((f / 30) * Math.PI * 1.1 * speed) * amp;
