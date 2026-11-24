"""Contact sheet with the vertical-video safe area drawn in, to check that nothing important hides under the app UI.

usage: python3 scripts/safezone.py <video.mp4> <sheet.jpg> [--every 30]
The box is a working assumption from public creator guides (no platform publishes an official one): centre
~900x1400 px of a 1080x1920 frame, with extra room at the bottom (titles / descriptions) and the right (buttons):
x 90..960, y 250..1580 at 1080x1920 (scaled to the video's size). Red = keep faces, props and captions inside.
"""
import argparse
import subprocess
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("sheet", type=Path)
    ap.add_argument("--every", type=int, default=30, help="one frame every N frames")
    a = ap.parse_args()
    box = "drawbox=x=iw*90/1080:y=ih*250/1920:w=iw*870/1080:h=ih*1330/1920:color=red@0.9:t=4"
    vf = f"select='not(mod(n\\,{a.every}))',{box},scale=180:320,tile=12x6"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.video), "-vf", vf, "-frames:v", "1", str(a.sheet)], check=True)
    print(a.sheet)


if __name__ == "__main__":
    main()
