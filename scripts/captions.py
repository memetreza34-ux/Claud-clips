"""Burn one-word captions (from words.json) into a rendered short and lay the final mix under it, without re-rendering.

usage: python3 scripts/captions.py <video.mp4> <voice_dir> <mix.wav> <out.mp4>
Captions like the reference format: white bold sans in sentence case with its punctuation, thin black outline, lower
middle, hard swap on every word, each word held until the next one starts (at least 4 frames).
The audio is taken as it is (mix it first with scripts/pigeon_mix.py).
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("voice_dir", type=Path)
    ap.add_argument("audio", type=Path)
    ap.add_argument("out", type=Path)
    a = ap.parse_args()

    words = json.loads((a.voice_dir / "words.json").read_text(encoding="utf-8"))
    parts, prev = [], 0.0
    for i, w in enumerate(words):
        st = max(w["s"], prev)
        nxt = words[i + 1]["s"] if i + 1 < len(words) else w["e"] + 0.4
        en = max(nxt, st + 4 / 30)
        prev = en
        txt = w["w"].replace("'", "’").replace('"', "").replace(":", "\\:")  # drawtext needs the colon escaped
        parts.append(f"drawtext=fontfile='{FONT}':text='{txt}':fontsize=72:fontcolor=white:borderw=5:bordercolor=black"
                     f":x=(w-text_w)/2:y=h*0.79:enable='between(t,{st:.3f},{en - 0.001:.3f})'")
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write(f"[0:v]{','.join(parts)}[v]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.video), "-i", str(a.audio), "-/filter_complex", f.name,
                    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(a.out)], check=True)
    Path(f.name).unlink()
    print(f"{a.out}: {len(parts)} captions")


if __name__ == "__main__":
    main()
