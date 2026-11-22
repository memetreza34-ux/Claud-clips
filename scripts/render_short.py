"""One command for the whole picture pipeline: draft or final, partial re-renders, chunked renders for long videos,
a detached mode that survives the agent's session ending, glitch repair and a QA report.

usage:
  python3 scripts/render_short.py v1 --short <name> --draft      # review copy: half resolution, 4 tabs, no repair
  python3 scripts/render_short.py final --short <name>           # full resolution, repair, QA
  python3 scripts/render_short.py final --short <name> --detach  # same, in the background: survives the session;
                                                                 #   log ../tmp/render_<name>_final.log, done marker .done
  python3 scripts/render_short.py final --short <name> --chunk 3000   # long videos: render 3000-frame parts, skip parts
                                                                 #   that already exist (resume after a crash), join them
  python3 scripts/render_short.py v2 --short <name> --frames 400-520 --into out/<name>/<name>_v1.mp4
                                                                 # re-render one range and splice it into a video
A short is found in SHORTS below or in projects/<name>/short.json ({"comp", "out", "shots"}; scripts/new_short.py
writes it). Writes <out>/<name>_<version>.mp4. The composition carries the final mix and the captions, so the render is
the deliverable; repair_frames.py swaps clean stills in for glitch frames (keeping the audio).
Temp files go to ../tmp on the Mac (CLIPS_TMP overrides), and the Mac is kept awake while it runs (caffeinate).
Drafts skip the glitch repair (it took 15 of 40 minutes on the whale draft); --repair turns it on.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TMP = Path(os.environ.get("CLIPS_TMP", str(ROOT.parent / "tmp")))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# older shorts: short -> (composition, output folder, shot plan in render frames for repair and QA)
SHORTS = {
    "pigeon": ("PigeonShort", "out/pigeon", "projects/pigeon/shots_render.json"),
    "bats": ("Bats3DShort", "out/bats3d", "projects/bats/shots_render.json"),
    "batsp": ("BatsPShort", "out/bats3d", "projects/bats/shots_render.json"),
    "whale": ("WhaleShort", "out/whale", "projects/whale/shots_render.json"),
    "whalefull": ("WhaleFullShort", "out/whale", "projects/whale/shots_render.json"),
    "whalecode": ("WhaleCodeShort", "out/whale", "projects/whale/code_shots.json"),
}


def short_of(name: str) -> tuple[str, str, str]:
    if name in SHORTS:
        return SHORTS[name]
    meta = ROOT / "projects" / name / "short.json"
    if not meta.exists():
        sys.exit(f"unknown short {name}: not in SHORTS and no {meta}")
    m = json.loads(meta.read_text())
    return m["comp"], m.get("out", f"out/{name}"), m.get("shots", f"projects/{name}/shots_render.json")


def run(label: str, cmd: list[str], times: dict) -> None:
    t0 = time.time()
    print(f"-- {label}", flush=True)
    p = subprocess.run(["caffeinate", "-dimsu", *cmd], cwd=ROOT, env={**os.environ, "TMPDIR": f"{TMP}/"},
                       capture_output=True, text=True)
    noise = ("404", "Failed to load", "CVDisplayLink", "Rendered ", "Stitched ", "Encoded ", "Bundling", "Getting compositions")
    for line in (p.stdout + p.stderr).splitlines():
        if line.strip() and not any(n in line for n in noise):
            print("   ", line[:300], flush=True)
    times[label] = times.get(label, 0) + time.time() - t0
    if p.returncode:
        sys.exit(f"{label} failed ({p.returncode})")


def frames_of(video: Path) -> int:
    return int(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries",
                               "stream=nb_read_packets", "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout)


def comp_frames(comp: str, short: str) -> int:
    """duration of a composition in frames: from the voice for clips made by new_short.py (same formula as
    src/lib/timing.ts), else from `remotion compositions`"""
    lines = ROOT / "projects" / short / "voice/lines.json"
    if (ROOT / "projects" / short / "short.json").exists() and lines.exists():
        import math
        return math.ceil(json.loads(lines.read_text())[-1]["end"] * 30) + 10
    p = subprocess.run(["npx", "remotion", "compositions", "src/index.ts", f"--browser-executable={CHROME}"],
                       cwd=ROOT, env={**os.environ, "TMPDIR": f"{TMP}/"}, capture_output=True, text=True)
    for line in p.stdout.splitlines():
        parts = line.split()
        if parts and parts[0] == comp:
            nums = [int(x) for x in parts[1:] if re.fullmatch(r"\d+", x)]
            if len(nums) >= 2:
                return nums[1]  # fps, frames
    sys.exit(f"could not find the length of {comp}:\n{p.stdout[-800:]}{p.stderr[-800:]}")


def detach(a: argparse.Namespace) -> None:
    """re-run this command in its own session (nohup, setsid), so it survives the agent or terminal that started it"""
    TMP.mkdir(parents=True, exist_ok=True)
    log = TMP / f"render_{a.short}_{a.name}.log"
    done = log.with_suffix(".done")
    done.unlink(missing_ok=True)
    args = [x for x in sys.argv[1:] if x != "--detach"]
    shell = f'{sys.executable} {Path(__file__).resolve()} {" ".join(args)} > "{log}" 2>&1; echo $? > "{done}"'
    subprocess.Popen(["nohup", "sh", "-c", shell], cwd=ROOT, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                     stderr=subprocess.DEVNULL, start_new_session=True)
    print(f"started in the background\n  log:  {log}\n  done: {done} (holds the exit code when it has finished)")


def render_range(a, comp: str, out: Path, frames: str | None, tabs: int, times: dict) -> None:
    cmd = ["npx", "remotion", "render", "src/index.ts", comp, str(out), "--codec", "h264", "--crf", "14",
           "--gl=angle", f"--concurrency={tabs}", "--timeout=120000", f"--browser-executable={CHROME}", "--log=error"]
    if a.draft:
        cmd.append("--scale=0.5")
    if frames:
        cmd.append(f"--frames={frames}")
    run(f"render ({'draft' if a.draft else 'full'}, {tabs} tabs{', frames ' + frames if frames else ''})", cmd, times)


def repair(a, comp: str, src: Path, dst: Path, shots: Path, offset: int | None, times: dict) -> None:
    venv = ROOT / ".venv/bin/python"
    rep = [str(venv) if venv.exists() else sys.executable, "scripts/repair_frames.py", str(src), str(dst), "--comp", comp]
    if a.repair_xfades and offset is None:
        rep += ["--shots", str(shots)]
    if a.draft:
        rep += ["--scale", "0.5"]
    if offset:
        rep += ["--offset", str(offset)]
    run("repair", rep, times)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--short", default="pigeon")
    ap.add_argument("--draft", action="store_true", help="half resolution, 4 tabs, for review")
    ap.add_argument("--frames", help="a-b: render only this range")
    ap.add_argument("--into", type=Path, help="with --frames: finished video to splice the range into")
    ap.add_argument("--tabs", type=int, help="Chrome tabs (default 4 for drafts, 1 for full resolution)")
    ap.add_argument("--chunk", type=int, help="render in parts of this many frames, resume from the parts already there")
    ap.add_argument("--detach", action="store_true", help="run in the background, detached from this session")
    ap.add_argument("--no-repair", action="store_true")
    ap.add_argument("--repair", action="store_true", help="also repair glitch frames in a draft")
    ap.add_argument("--repair-xfades", action="store_true", help="also re-render every crossfade frame (not needed since the prewarm)")
    a = ap.parse_args()
    if a.detach:
        detach(a)
        return
    if a.draft and not a.repair:
        a.no_repair = True

    comp, out, shots = short_of(a.short)
    OUT, SHOTS = ROOT / out, ROOT / shots
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    times: dict[str, float] = {}
    raw = OUT / f"{a.short}_{a.name}_raw.mp4"
    final = OUT / f"{a.short}_{a.name}.mp4"
    # full resolution: one tab is faster AND clean (measured on frames 150-420: 1 tab 71 s / 0 glitches, 2 tabs 90 s /
    # 1 glitch; with 2 tabs under memory pressure v15 came out with 269 glitched frames)
    tabs = a.tabs or (4 if a.draft else 1)

    if a.chunk and not a.frames:
        # long videos: parts of `chunk` frames, each rendered (and repaired) on its own; parts already there are kept,
        # so a crash costs one part; then the video streams are joined and the audio is joined losslessly
        n = comp_frames(comp, a.short)
        parts_dir = OUT / f"parts_{a.short}_{a.name}"
        parts_dir.mkdir(exist_ok=True)
        parts = []
        for f0 in range(0, n, a.chunk):
            f1 = min(n, f0 + a.chunk) - 1
            part = parts_dir / f"{f0:06d}-{f1:06d}.mp4"
            if not part.exists():
                tmp = part.with_name(part.stem + "_raw.mp4")
                render_range(a, comp, tmp, f"{f0}-{f1}", tabs, times)
                if a.no_repair:
                    tmp.rename(part)
                else:
                    repair(a, comp, tmp, part, SHOTS, f0, times)
                    tmp.unlink(missing_ok=True)
            parts.append(part)
        lst = parts_dir / "list.txt"
        lst.write_text("".join(f"file '{p.name}'\n" for p in parts))
        vid, aud = parts_dir / "video.mp4", parts_dir / "audio.wav"
        run("join video", ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-map", "0:v", "-c", "copy", str(vid)], times)
        run("join audio", ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-map", "0:a", "-c:a", "pcm_s16le", str(aud)], times)
        run("finish", ["ffmpeg", "-v", "error", "-y", "-i", str(vid), "-i", str(aud), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                       "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", str(final)], times)
    else:
        render_range(a, comp, raw, a.frames, tabs, times)
        fixed = raw if a.no_repair else OUT / f"{a.short}_{a.name}_fixed.mp4"
        if not a.no_repair:
            repair(a, comp, raw, fixed, SHOTS, int(a.frames.split("-")[0]) if a.frames else None, times)
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
        qa = TMP / f"qa_{a.short}_{a.name}"
        qa.mkdir(exist_ok=True)
        run("qa", ["python3", "scripts/short_qa.py", str(final), str(qa), str(SHOTS)], times)
    print("\ntiming: " + ", ".join(f"{k.split(' (')[0]} {v / 60:.1f} min" for k, v in times.items())
          + f"  | total {sum(times.values()) / 60:.1f} min  -> {final}")


if __name__ == "__main__":
    main()
