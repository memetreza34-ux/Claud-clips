"""Small original underscore for a short: bouncy plucked bass, soft off-beat chords and a marimba-like motif,
ducked under the narration (from words.json) and ended with a button chord on the last word.

usage: .venv/bin/python scripts/music.py <voice_dir> <out.wav> [--bpm 100]
Reads words.json from voice_dir, writes a 48 kHz stereo wav exactly as long as the narration.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def hz(name: str, octave: int) -> float:
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)


def tone(f: float, dur: float, decay: float, harm=(1.0, 0.35, 0.12)) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    w = sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harm))
    env = np.exp(-t / decay) * np.minimum(1, t / 0.004)
    return w * env


def add(buf: np.ndarray, sig: np.ndarray, at: float, gain: float) -> None:
    i = int(at * SR)
    if i >= len(buf):
        return
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += gain * sig[:n]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("voice_dir", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--bpm", type=float, default=100)
    a = ap.parse_args()

    words = json.loads((a.voice_dir / "words.json").read_text(encoding="utf-8"))
    total = words[-1]["e"] + 0.7
    beat = 60 / a.bpm
    buf = np.zeros(int(total * SR))

    # F - C - Dm - Bb, one bar each (4 beats), as (root, chord tones)
    prog = [("F", ["F", "A", "C"]), ("C", ["C", "E", "G"]), ("D", ["D", "F", "A"]), ("A#", ["A#", "D", "F"])]
    motif = [("C", 5), ("A", 4), ("F", 4), ("A", 4), ("C", 5), ("D", 5), ("C", 5), None]  # eighth notes, one bar
    end = words[-1]["s"]
    bar, t = 0, 0.0
    while t < end - 0.05:
        root, chord = prog[bar % 4]
        section = 0 if t < 5.0 else 1  # hook: bass only, then the full groove
        for b in range(4):
            tb = t + b * beat
            if tb >= end - 0.05:
                break
            if b in (0, 2):
                add(buf, tone(hz(root, 2), 0.5, 0.18, (1.0, 0.5, 0.2)), tb, 0.55)
            if section and b in (1, 3):
                for n in chord:
                    add(buf, tone(hz(n, 4), 0.25, 0.07, (1.0, 0.2)), tb, 0.12)
        if section and bar % 2 == 0:
            for k, m in enumerate(motif):
                if m:
                    add(buf, tone(hz(m[0], m[1]), 0.4, 0.12, (1.0, 0.0, 0.25, 0.0, 0.08)), t + k * beat / 2, 0.22)
        bar += 1
        t += 4 * beat
    # button: F major hit on the last word
    for n, o in [("F", 2), ("F", 3), ("A", 4), ("C", 5), ("F", 5)]:
        add(buf, tone(hz(n, o), 0.9, 0.35), end, 0.3)

    # duck 7 dB while the voice speaks (word spans merged over gaps < 0.3 s), 60 ms attack / 250 ms release
    speak = np.zeros(len(buf))
    for w in words:
        speak[int(w["s"] * SR):int(w["e"] * SR)] = 1
    g = np.where(speak > 0, 10 ** (-7 / 20), 1.0)
    out = np.empty_like(g)
    cur = 1.0
    att, rel = np.exp(-1 / (0.06 * SR)), np.exp(-1 / (0.25 * SR))
    for i, x in enumerate(g):
        k = att if x < cur else rel
        cur = x + (cur - x) * k
        out[i] = cur
    buf *= out
    buf /= np.max(np.abs(buf)) + 1e-9
    buf *= 0.5
    stereo = np.stack([buf, np.roll(buf, int(0.012 * SR)) * 0.95], axis=1)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(a.out, stereo, SR)
    print(f"{a.out}: {total:.2f} s, {bar} bars at {a.bpm:g} bpm")


if __name__ == "__main__":
    main()
