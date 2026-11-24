"""Find and replace glitched frames in a rendered short.

The multi-tab Remotion render sometimes captures a canvas before its post-processing targets are sized, which gives a
tiled garbage frame. Single stills of the same frame are always clean and identical to a good render, so this script
finds suspects (a frame far from both neighbours while the neighbours are close to each other), renders exactly those
frames as stills, and puts them back. False positives cost nothing: the still is the same picture.

usage: python3 scripts/repair_frames.py <raw.mp4> <out.mp4> [--shots shots.json] [--scale 0.5] [--offset N] [--workers 2]
Set TMPDIR to a big drive first (Remotion bundles land there).
"""
import argparse
import sys
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W, H = 54, 96


def frames_small(video: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


def suspects(fr: np.ndarray, ratio: float) -> list[int]:
    """runs of 1-3 frames that jump away from frame n-1 and come back: d(n-1, n) large, d(n-1, n+k) small"""
    d = lambda a, b: float(np.mean(np.abs(fr[a] - fr[b])))
    out: set[int] = set()
    for n in range(1, len(fr) - 1):
        jump = d(n - 1, n)
        if jump < 4.0:
            continue
        for k in (1, 2, 3):
            if n + k < len(fr) and ratio * (d(n - 1, n + k) + 0.5) < jump:
                out.update(range(n, n + k))
                break
    return sorted(out)


def xfade_frames(shots: Path, pad: int = 2) -> list[int]:
    import json
    plan = json.loads(shots.read_text())
    out: set[int] = set()
    for a, b in plan.get("xfade", []):
        out.update(range(a - pad, b + pad))
    return sorted(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("raw", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--comp", default="PigeonShort")
    ap.add_argument("--ratio", type=float, default=3.0)
    ap.add_argument("--shots", type=Path, help="shots.json: every crossfade frame is re-rendered too")
    ap.add_argument("--scale", type=float, default=1.0, help="render scale of the video (drafts: 0.5)")
    ap.add_argument("--offset", type=int, default=0, help="composition frame of the video's first frame (partial renders)")
    ap.add_argument("--workers", type=int, default=2, help="parallel still renderers")
    a = ap.parse_args()

    small = frames_small(a.raw)
    xf = [n - a.offset for n in (xfade_frames(a.shots) if a.shots else []) if 0 <= n - a.offset < len(small)]
    bad = sorted(set(suspects(small, a.ratio)) | set(xf))
    print(f"suspect frames ({len(bad)}): {bad}")
    if not bad:
        subprocess.run(["cp", str(a.raw), str(a.out)], check=True)
        return
    tmp = Path(tempfile.mkdtemp(prefix="repair-"))
    # bundle once, then render the stills in parallel workers (each its own browser)
    bundle_js = """
import { bundle } from "@remotion/bundler";
import path from "node:path";
console.log(await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") }));
"""
    serve = subprocess.run(["node", "--input-type=module", "-e", bundle_js], capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1]
    js = """
import { renderStill, selectComposition } from "@remotion/renderer";
const [serveUrl, out, comp, list, chrome, scale, offset] = process.argv.slice(1);
const chromiumOptions = { gl: "angle" };
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable: chrome, chromiumOptions });
for (const f of list.split(",").map(Number))
  await renderStill({ composition, serveUrl, frame: f + Number(offset), output: `${out}/f${f}.png`, imageFormat: "png", scale: Number(scale),
    browserExecutable: chrome, chromiumOptions, timeoutInMilliseconds: 600000 });
"""
    parts = [bad[i::a.workers] for i in range(a.workers) if bad[i::a.workers]]
    procs = [subprocess.Popen(["node", "--input-type=module", "-e", js, serve, str(tmp), a.comp, ",".join(map(str, part)), CHROME,
                               str(a.scale), str(a.offset)], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True) for part in parts]
    for pr in procs:
        _, err = pr.communicate()
        if pr.returncode:
            sys.exit("still worker failed: " + "\n".join(l for l in err.splitlines() if "404" not in l)[-800:])
    # overlay each clean still on its own frame number
    inputs, chain, last = [], [], "[0:v]"
    for i, n in enumerate(bad):
        inputs += ["-i", str(tmp / f"f{n}.png")]
        lab = f"[v{i}]"
        chain.append(f"{last}[{i + 1}:v]overlay=0:0:enable='eq(n\\,{n})'{lab}")
        last = lab
    graph = tmp / "graph.txt"
    graph.write_text(";".join(chain))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.raw), *inputs, "-/filter_complex", str(graph), "-map", last,
                    "-map", "0:a?", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy",
                    str(a.out)], check=True)
    left = suspects(frames_small(a.out), a.ratio)
    print(f"replaced {len(bad)} frames -> {a.out}; suspects left: {left}")
    subprocess.run(["rm", "-rf", str(tmp)], check=False)  # exFAT drives add ._ files, so remove the folder in one go


if __name__ == "__main__":
    main()
