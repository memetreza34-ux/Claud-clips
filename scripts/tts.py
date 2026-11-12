"""Local narration with Kokoro: one wav per sentence, joined with short gaps, pauses squeezed.

usage: .venv/bin/python scripts/tts.py <SCRIPT.md> <out_dir> [--voice am_fenrir] [--speed 1.25] [--gap 0.05] [--max-pause 0.12]
The defaults are the channel voice: keep them for every short (am_fenrir at 1.25 gives ~3.7 words/s).
Reads the lines under the "## Voice-over" heading of SCRIPT.md.
Writes voice.wav and lines.json (start/end of every line, used to time the shots).
The reference shorts have almost no dead air (pauses over 0.25 s add up to under 1 s per video), so every silence inside
a line is shortened to --max-pause and each line is trimmed to 20 ms of lead-in and tail.
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


def squeeze(audio: np.ndarray, rate: int, max_pause: float, edge: float = 0.02, floor_db: float = -38.0) -> np.ndarray:
    """shorten every silent run inside the line to max_pause (keeping its two ends), trim the edges to `edge`"""
    hop = int(0.01 * rate)
    n = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: n * hop].reshape(n, hop) ** 2, axis=1))
    quiet = rms < rms.max() * 10 ** (floor_db / 20)
    loud = np.flatnonzero(~quiet)
    if not len(loud):
        return audio
    a, b = max(0, loud[0] * hop - int(edge * rate)), min(len(audio), (loud[-1] + 1) * hop + int(edge * rate))
    keep, i, half = [], loud[0], int(max_pause * rate / 2)
    start = a
    while i <= loud[-1]:
        if quiet[i]:
            j = i
            while j <= loud[-1] and quiet[j]:
                j += 1
            s0, s1 = i * hop, j * hop
            if s1 - s0 > 2 * half:
                keep.append(audio[start:s0 + half])
                start = s1 - half
            i = j
        else:
            i += 1
    keep.append(audio[start:b])
    return np.concatenate(keep)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--voice", default="am_fenrir")
    ap.add_argument("--speed", type=float, default=1.25)
    ap.add_argument("--gap", type=float, default=0.05)
    ap.add_argument("--max-pause", type=float, default=0.12)
    args = ap.parse_args()

    kokoro = Kokoro("models/kokoro/kokoro-v1.0.onnx", "models/kokoro/voices-v1.0.bin")
    args.out.mkdir(parents=True, exist_ok=True)

    chunks, meta, t, rate = [], [], 0.0, 24000
    for i, line in enumerate(read_lines(args.script)):
        audio, rate = kokoro.create(line, voice=args.voice, speed=args.speed, lang="en-us")
        audio = squeeze(audio, rate, args.max_pause)
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
