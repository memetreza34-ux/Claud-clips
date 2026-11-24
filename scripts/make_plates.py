"""Generate the painted background plates of a short with the local Z-Image-Turbo (mflux, 4-bit, Apache 2.0).

usage: ~/claud-clips-local/venv-img/bin/python scripts/make_plates.py projects/bats/plates.json public/bats_plates [--only id,id] [--size 720x1280]
Reads {"style": ..., "plates": [{"id", "seed", "prompt"}]}, skips plates that already exist, writes <id>.png.
The model lives on the internal SSD (~/claud-clips-local/hf): loaded from the T7 it stalls.
"""
import argparse
import json
import os
import subprocess
import time
from pathlib import Path

HF = Path.home() / "claud-clips-local/hf"
BIN = Path.home() / "claud-clips-local/venv-img/bin/mflux-generate-z-image-turbo"
MODEL = next((HF / "hub/models--mflux-community--z-image-turbo-mflux-q4/snapshots").iterdir())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("plan", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--only")
    ap.add_argument("--size", default="720x1280")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    plan = json.loads(a.plan.read_text())
    w, h = a.size.split("x")
    a.out.mkdir(parents=True, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    env = {**os.environ, "HF_HOME": str(HF), "HF_HUB_OFFLINE": "1"}
    for p in plan["plates"]:
        dst = a.out / f"{p['id']}.png"
        if (only and p["id"] not in only) or (dst.exists() and not a.force):
            continue
        t0 = time.time()
        subprocess.run([str(BIN), "--model", str(MODEL), "--steps", "9", "--width", w, "--height", h, "--seed", str(p["seed"]),
                        "--prompt", f"{plan['style']} {p['prompt']}", "--output", str(dst)], env=env, check=True,
                       capture_output=True)
        print(f"{p['id']}: {time.time() - t0:.0f} s", flush=True)


if __name__ == "__main__":
    main()
