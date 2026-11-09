"""Burn one-word captions (from words.json) into a rendered short and mix in the music, without re-rendering.

usage: python3 scripts/captions.py <video.mp4> <voice_dir> <music.wav> <out.mp4> [--music-db -9]
Captions: white bold sans, black outline, lower third, hard swap on every word, each word held until the next one
starts (at least 4 frames). Audio: the video's voice + music, normalised to -14 LUFS / -1 dBTP.
"""
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def clean(w: str) -> str:
    w = re.sub(r"[^\w'\-]", "", w).replace("'", "’")
    return w.upper()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("voice_dir", type=Path)
    ap.add_argument("music", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--music-db", type=float, default=-9)
    a = ap.parse_args()

    words = json.loads((a.voice_dir / "words.json").read_text(encoding="utf-8"))
    parts, prev = [], 0.0
    for i, w in enumerate(words):
        st = max(w["s"], prev)
        nxt = words[i + 1]["s"] if i + 1 < len(words) else w["e"] + 0.4
        en = max(nxt, st + 4 / 30)
        prev = en
        txt = clean(w["w"])
        if not txt:
            continue
        parts.append(f"drawtext=fontfile='{FONT}':text='{txt}':fontsize=104:fontcolor=white:borderw=8:bordercolor=black"
                     f":x=(w-text_w)/2:y=h*0.80:enable='between(t,{st:.3f},{en - 0.001:.3f})'")
    graph = (f"[0:v]{','.join(parts)}[v];"
             f"[1:a]volume={a.music_db}dB[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,"
             f"loudnorm=I=-14:TP=-1:LRA=7,aresample=48000[a]")
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write(graph)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.video), "-i", str(a.music), "-/filter_complex", f.name,
                    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(a.out)], check=True)
    Path(f.name).unlink()
    print(f"{a.out}: {len(parts)} captions")


if __name__ == "__main__":
    main()
