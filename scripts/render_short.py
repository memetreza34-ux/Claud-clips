"""One command for the whole picture pipeline, with draft mode, partial re-renders and a timing report.

usage:
  python3 scripts/render_short.py v14                    # final: full resolution, repair, QA
  python3 scripts/render_short.py v14 --draft            # review copy: half resolution (540x960), 4 tabs
  python3 scripts/render_short.py v14 --frames 400-520 --into out/pigeon/pigeon_v13.mp4
                                                         # re-render one frame range and splice it into a finished video

Writes out/pigeon/pigeon_<name>.mp4. The composition already carries the final mix and the captions, so the render is
the deliverable; repair_frames.py then swaps in clean stills for any glitch frame it detects (keeping the audio).
Crossfades prewarm their incoming canvas (shots.ts), so their frames come out clean and are not re-rendered by default.
All temp files go to the T7 (TMPDIR), and the Mac is kept awake while it runs (caffeinate).
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out/pigeon"
TMP = Path("/Volumes/T7/Claud-clips/tmp")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SHOTS = ROOT / "projects/pigeon/shots_render.json"


def run(label: str, cmd: list[str], times: dict) -> None:
    t0 = time.time()
    print(f"-- {label}", flush=True)
    p = subprocess.run(["caffeinate", "-dimsu", *cmd], cwd=ROOT, env={**os.environ, "TMPDIR": f"{TMP}/"},
                       capture_output=True, text=True)
    noise = ("404", "Failed to load", "CVDisplayLink", "Rendered ", "Stitched ", "Encoded ", "Bundling", "Getting compositions")
    for line in (p.stdout + p.stderr).splitlines():
        if line.strip() and not any(n in line for n in noise):
            print("   ", line[:300])
    times[label] = time.time() - t0
    if p.returncode:
        sys.exit(f"{label} failed ({p.returncode})")


def frames_of(video: Path) -> int:
    return int(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries",
                               "stream=nb_read_packets", "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--draft", action="store_true", help="half resolution, 4 tabs, for review")
    ap.add_argument("--frames", help="a-b: render only this range")
    ap.add_argument("--into", type=Path, help="with --frames: finished video to splice the range into")
    ap.add_argument("--tabs", type=int, help="Chrome tabs (default 4 for drafts, 1 for full resolution)")
    ap.add_argument("--no-repair", action="store_true")
    ap.add_argument("--repair-xfades", action="store_true", help="also re-render every crossfade frame (not needed since the prewarm)")
    a = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    times: dict[str, float] = {}
    raw = OUT / f"pigeon_{a.name}_raw.mp4"
    final = OUT / f"pigeon_{a.name}.mp4"
    # full resolution: one tab is faster AND clean (measured on frames 150-420: 1 tab 71 s / 0 glitches, 2 tabs 90 s /
    # 1 glitch; with 2 tabs under memory pressure v15 came out with 269 glitched frames)
    tabs = a.tabs or (4 if a.draft else 1)
    cmd = ["npx", "remotion", "render", "src/index.ts", "PigeonShort", str(raw), "--codec", "h264", "--crf", "14",
           "--gl=angle", f"--concurrency={tabs}", "--timeout=120000", f"--browser-executable={CHROME}", "--log=error"]
    if a.draft:
        cmd.append("--scale=0.5")
    if a.frames:
        cmd.append(f"--frames={a.frames}")
    run(f"render ({'draft' if a.draft else 'full'}, {tabs} tabs{', frames ' + a.frames if a.frames else ''})", cmd, times)

    fixed = raw if a.no_repair else OUT / f"pigeon_{a.name}_fixed.mp4"
    if not a.no_repair:
        rep = [str(ROOT / ".venv/bin/python"), "scripts/repair_frames.py", str(raw), str(fixed)]
        if a.repair_xfades and not a.frames:
            rep += ["--shots", str(SHOTS)]
        if a.draft:
            rep += ["--scale", "0.5"]
        if a.frames:
            rep += ["--offset", a.frames.split("-")[0]]
        run("repair", rep, times)

    if a.frames and a.into:
        # splice: [0, a) from the old video, the new range, (b, end] from the old video; audio from the old video
        f0, f1 = map(int, a.frames.split("-"))
        n = frames_of(a.into)
        graph = (f"[0:v]trim=end_frame={f0},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];"
                 f"[0:v]trim=start_frame={f1 + 1}:end_frame={n},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]")
        run("splice", ["ffmpeg", "-v", "error", "-y", "-i", str(a.into), "-i", str(fixed), "-filter_complex", graph,
                       "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt",
                       "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(final)], times)
    else:
        run("finish", ["ffmpeg", "-v", "error", "-y", "-i", str(fixed), "-c", "copy", "-movflags", "+faststart", str(final)], times)

    if not a.frames:
        qa = TMP / f"qa_{a.name}"
        qa.mkdir(exist_ok=True)
        run("qa", ["python3", "scripts/short_qa.py", str(final), str(qa), str(SHOTS)], times)
    print("\ntiming: " + ", ".join(f"{k.split(' (')[0]} {v / 60:.1f} min" for k, v in times.items())
          + f"  | total {sum(times.values()) / 60:.1f} min  -> {final}")


if __name__ == "__main__":
    main()
