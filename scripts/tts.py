"""Local narration with Kokoro: one wav per sentence, joined with short gaps.

usage: .venv/Scripts/python scripts/tts.py <SCRIPT.md> <out_dir> [--voice am_michael] [--speed 1.1] [--gap 0.06]
Reads the lines under the "## Voice-over" heading of SCRIPT.md.
Writes voice.wav and lines.json (start/end of every line, used to time the shots).
Model files are expected in models/kokoro/.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


def read_lines(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    body = text.split("## Voice-over", 1)[1]
    return [line.strip() for line in body.splitlines() if line.strip() and not line.startswith("#")]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=1.1)
    ap.add_argument("--gap", type=float, default=0.06)
    args = ap.parse_args()

    kokoro = Kokoro("models/kokoro/kokoro-v1.0.onnx", "models/kokoro/voices-v1.0.bin")
    args.out.mkdir(parents=True, exist_ok=True)

    chunks, meta, t, rate = [], [], 0.0, 24000
    for i, line in enumerate(read_lines(args.script)):
        audio, rate = kokoro.create(line, voice=args.voice, speed=args.speed, lang="en-us")
        dur = len(audio) / rate
        meta.append({"id": i, "text": line, "start": round(t, 3), "end": round(t + dur, 3)})
        chunks += [audio, np.zeros(int(args.gap * rate), dtype=audio.dtype)]
        t += dur + args.gap
        print(f"{i:2d} {dur:5.2f}s  {line[:70]}", flush=True)

    sf.write(args.out / "voice.wav", np.concatenate(chunks), rate)
    (args.out / "lines.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    words = sum(len(m["text"].split()) for m in meta)
    print(f"total {t:.1f}s, {words} words, {words / t:.2f} words/s")


if __name__ == "__main__":
    main()
