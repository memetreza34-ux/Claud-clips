// Painted interior textures (Canvas2D, cached by key like paint.ts): striped wallpaper with a small motif, vertical
// board panelling with dark seams, wood grain for table tops, and night views for the windows. Hand-painted look:
// per-board colour jitter, faint brush noise, dark gaps (the tutorial's "you can see the grain and the dark gaps").
import { ctex, jit } from "./paint";

const shadeHex = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), c = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};
const noise = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, a = 0.05) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,30,40,${a})`;
    g.fillRect(r() * w, r() * h, 6 + r() * 30, 2 + r() * 3);
  }
};

/** wallpaper: soft vertical stripes and a small diamond motif; 1 tile = 0.8 m */
export const wallpaperTex = (base: string, accent: string) => ctex(`wp_${base}_${accent}`, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = shadeHex(base, 0.95); g.fillRect(x + 40, 0, 24, 512); }
  g.fillStyle = accent;
  for (let y = 32; y < 512; y += 64) for (let x = 20; x < 512; x += 64) {
    g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 6, y); g.lineTo(x, y + 7); g.lineTo(x - 6, y); g.closePath(); g.fill();
  }
  noise(g, r, 512, 512, 260, 0.035);
});

/** board panelling: 4 vertical boards per tile with dark seams and a lit bevel; 1 tile = 1 m */
export const panelTex = (base: string) => ctex(`panel_${base}`, 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) {
    const x = i * 128;
    g.fillStyle = jit(r, base, 0.07, 3, 0.1); g.fillRect(x, 0, 128, 512);
    g.strokeStyle = "rgba(30,20,20,0.12)"; g.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const gx = x + 14 + r() * 100; g.beginPath(); g.moveTo(gx, 0); g.bezierCurveTo(gx + 8, 170, gx - 8, 340, gx + 4, 512); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(x + 4, 0, 5, 512);
    g.fillStyle = "rgba(25,15,20,0.75)"; g.fillRect(x, 0, 4, 512);
  }
  g.fillStyle = "rgba(25,15,20,0.5)"; g.fillRect(0, 0, 512, 6);
  noise(g, r, 512, 512, 160, 0.04);
});

/** wood grain for table tops: 3 planks with wavy grain and dark seams; stretched once per face */
export const grainTex = (base: string) => ctex(`grain_${base}`, 512, 512, (g, r) => {
  for (let i = 0; i < 3; i++) {
    const y0 = (i * 512) / 3, hgt = 512 / 3;
    g.fillStyle = jit(r, base, 0.06, 3, 0.08); g.fillRect(0, y0, 512, hgt);
    g.strokeStyle = "rgba(40,22,15,0.22)"; g.lineWidth = 2;
    for (let k = 0; k < 9; k++) {
      const yy = y0 + 8 + r() * (hgt - 16), a = 2 + r() * 5, ph = r() * 6;
      g.beginPath(); for (let x = 0; x <= 512; x += 16) { const y = yy + a * Math.sin(x / 70 + ph); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    }
    g.fillStyle = "rgba(25,12,10,0.7)"; g.fillRect(0, y0, 512, 4);
  }
  noise(g, r, 512, 512, 120, 0.04);
});

/** night outside a window: deep blue sky, moon, dark hills or houses with a few lit windows */
export const nightTex = (key: string, city: boolean) => ctex(`night_${key}`, 512, city ? 1024 : 512, (g, r) => {
  const h = city ? 1024 : 512, gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#0f1a3d"); gr.addColorStop(0.65, "#25386e"); gr.addColorStop(1, "#3a4f8a");
  g.fillStyle = gr; g.fillRect(0, 0, 512, h);
  g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(380, h * 0.16, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,0.8)"; for (let i = 0; i < 40; i++) g.fillRect(r() * 512, r() * h * 0.5, 2, 2);
  const blocks = city ? [[0, 160, 420], [150, 120, 520], [260, 140, 380], [390, 140, 470]] : [[0, 220, 200], [200, 180, 150], [360, 160, 230]];
  for (const [x, w, bh] of blocks) {
    g.fillStyle = "#1a2348"; g.fillRect(x, h - bh, w, bh);
    for (let y = h - bh + 24; y < h - 20; y += 46) for (let xx = x + 14; xx < x + w - 20; xx += 32)
      if (r() < 0.35) { g.fillStyle = "#ffd88a"; g.fillRect(xx, y, 14, 22); }
  }
});

/** plaster (cartoon-short-kit paint.js): warm base with soft blotches and a darker skirting band; 1 tile = 1 m */
export const plasterTex = (base: string) => ctex(`plaster_${base}`, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(90,70,50,0.07)";
    g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 30, 6 + r() * 16, 0, 0, 7); g.fill();
  }
});
