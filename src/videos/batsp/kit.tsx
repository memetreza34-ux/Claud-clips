// 2.5D toolkit for the bat short: a painted background plate per shot (scripts/make_plates.py, local Z-Image-Turbo),
// our own characters and effects drawn with the engine's Pen on canvases in front of it, and a calm camera.
// Shot space is 1080 x 1920; the camera zooms around a point and pans with eased keys (at most a few % per shot).
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { Pen } from "../pigeon/toon";

export const W = 1080, H = 1920;
const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.45, 0, 0.25, 1);
export const lerp = (t: number, a: number, b: number, from: number, to: number, e = ease) => interpolate(t, [a, b], [from, to], { ...clampX, easing: e });
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const back = (x: number, s = 1.7) => { const u = clamp01(x) - 1; return u * u * ((s + 1) * u + s) + 1; };

// ---------------- camera ----------------
export type CamKey = { t: number; z: number; x: number; y: number; dur?: number };
/** eased glide between keys (each key glides in over `dur` frames, default 18; dur 0 = cut) plus a slow creep */
export const camAt = (keys: CamKey[], t: number, len: number, creep = 0.03) => {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1].t) i++;
  const k = keys[i], p = keys[Math.max(0, i - 1)], d = k.dur ?? 18, u = i && d ? ease(clamp01((t - k.t) / d)) : 1;
  const z = (p.z + (k.z - p.z) * u) * (1 + creep * clamp01(t / Math.max(1, len)));
  return { z, x: p.x + (k.x - p.x) * u, y: p.y + (k.y - p.y) * u };
};
/** small punch on a joke beat: +4 % over 5 frames, easing back to +2 % */
export const punch = (t: number, at: number) => (t < at - 2 ? 0 : interpolate(t, [at - 2, at + 3, at + 20], [0, 0.04, 0.02], { ...clampX, easing: Easing.out(Easing.cubic) }));

/** a layer moved by the camera; depth < 1 moves less (background), > 1 more (foreground): parallax */
export const Layer: React.FC<{ cam: { z: number; x: number; y: number }; depth?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ cam, depth = 1, children, style }) => {
  const z = 1 + (cam.z - 1) * depth, x = W / 2 + (cam.x - W / 2) * depth, y = H / 2 + (cam.y - H / 2) * depth;
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${z}) translate(${-x}px, ${-y}px)` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** painted background plate, filling the shot (a little oversized so pans never show an edge) */
export const Plate: React.FC<{ id: string; blur?: number; filter?: string; over?: number }> = ({ id, blur = 0, filter = "", over = 1.04 }) => (
  <Img src={staticFile(`bats_plates/${id}.png`)} style={{ position: "absolute", left: (W - W * over) / 2, top: (H - H * over) / 2, width: W * over, height: H * over, objectFit: "cover", filter: `${blur ? `blur(${blur}px) ` : ""}${filter}` }} />
);

// ---------------- sprites drawn with the Pen ----------------
/** a Pen drawing on its own canvas. Design space cw x ch; shown `w` px wide with its anchor (ax, ay in 0..1 of the
 *  design box, default bottom centre) at (x, y). Redrawn only when `k` (the drawing key) changes. */
export const Sprite: React.FC<{ k: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; w: number;
  ax?: number; ay?: number; flip?: boolean; rot?: number; opacity?: number; filter?: string; res?: number }> = ({ k, cw, ch, draw, x, y, w, ax = 0.5, ay = 1, flip, rot = 0, opacity = 1, filter, res = 1.4 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const h = (w * ch) / cw, s = Math.min(3, (w * res) / cw);
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    const g = cv.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(s, 0, 0, s, 0, 0);
    draw(new Pen(g));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, s]);
  return (
    <canvas ref={ref} width={Math.ceil(cw * s)} height={Math.ceil(ch * s)}
      style={{ position: "absolute", left: x - ax * w, top: y - ay * h, width: w, height: h, opacity, filter,
        transformOrigin: `${ax * 100}% ${ay * 100}%`, transform: `${flip ? "scaleX(-1) " : ""}rotate(${rot}rad)` }} />
  );
};

/** soft contact shadow on the floor */
export const Shadow: React.FC<{ x: number; y: number; w: number; o?: number }> = ({ x, y, w, o = 0.35 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: "50%",
    background: `radial-gradient(closest-side, rgba(20,14,30,${o}), rgba(20,14,30,0))` }} />
);
/** soft glow (lamps, fire light, screens) */
export const Glow: React.FC<{ x: number; y: number; r: number; color: string; o?: number }> = ({ x, y, r, color, o = 0.6 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", opacity: o, mixBlendMode: "screen",
    background: `radial-gradient(closest-side, ${color}, rgba(0,0,0,0))` }} />
);

/** final look over every shot: tint toward the plate's light, vignette */
export const Grade: React.FC<{ tint?: string; tintO?: number; vig?: number }> = ({ tint = "#ffb070", tintO = 0.08, vig = 0.45 }) => (
  <>
    <AbsoluteFill style={{ background: tint, opacity: tintO, mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,6,20,${vig}) 100%)` }} />
  </>
);
