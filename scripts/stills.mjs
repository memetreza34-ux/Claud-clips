// usage: node scripts/stills.mjs <CompositionId> <outPrefix> <frame,frame,...> [scale]
// Stills for any composition. WITH_PUBLIC=1 bundles public/ (needed by the 3D shorts: Kenney props); without it the
// bundle gets an empty public dir. The bundle is cached in ../tmp/bundle-<kind> and reused until a file under src/ (or
// public/ with WITH_PUBLIC) is newer than it: a second round of stills on unchanged code starts at once instead of
// re-bundling (about a minute). Temp files go to ../tmp on the Mac (CLIPS_TMP overrides).
import fs from "node:fs";
import path from "node:path";
const TMP = process.env.CLIPS_TMP || path.resolve("..", "tmp");
fs.mkdirSync(TMP, { recursive: true }); process.env.TMPDIR = TMP + "/";
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.BROWSER || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const withPublic = !!process.env.WITH_PUBLIC;
const empty = path.join(TMP, "nopublic"); fs.mkdirSync(empty, { recursive: true });
const publicDir = withPublic ? path.resolve("public") : empty;

const newest = (dir) => {
  let t = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs);
  }
  return t;
};
const outDir = path.join(TMP, `bundle-${withPublic ? "public" : "bare"}`), stamp = path.join(outDir, ".stamp");
const srcT = Math.max(newest(path.resolve("src")), newest(path.resolve("projects")), withPublic ? newest(publicDir) : 0);
let serveUrl;
if (fs.existsSync(stamp) && fs.statSync(stamp).mtimeMs >= srcT) {
  serveUrl = outDir; console.log("bundle: reused");
} else {
  const t0 = Date.now();
  serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir, outDir });
  fs.writeFileSync(stamp, String(Date.now()));
  console.log("bundle: built", ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
const chromiumOptions = { gl: "angle" };
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
fs.mkdirSync(path.dirname(prefix), { recursive: true });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88,
    scale: Number(scale), browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000, onBrowserLog: (l) => l.type === "error" && !/404|favicon/.test(l.text) && console.log("[error]", l.text.slice(0, 300)) });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
