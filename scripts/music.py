"""Original underscore for the pigeon short, played on the template's synthesized instruments
(vendor/claude-animated-shorts/templates/audio/instruments.py: tuba, brass stabs, plucked strings, glockenspiel,
music box, vibraphone, pad, snare, brushes, cymbal, timpani).

usage: .venv/bin/python scripts/music.py <voice_dir> <out.wav> [--bpm 104]
Sections follow the story and are found by their words in voice_dir/words.json, so the music re-times with the voice:
hook (glockenspiel motif) -> setup groove (tuba, pizzicato, brushes) -> escalation from "One bird pecked" (+ horn
stabs) -> night-blue explanation from "You see" (pad + vibraphone, no drums) -> military from "The military" (snare
march) -> award from "Decades" (fanfare, cymbal) -> silence under "For a bomb." with one last timpani + tuba hit.
Ducked 3 dB under speech; the mix (pigeon_mix.py) sets the stem level against the voice.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "vendor/claude-animated-shorts/templates/audio"))
import dsp  # noqa: E402
import instruments as I  # noqa: E402

SR = dsp.SR
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def m(name: str, octave: int) -> int:
    return NOTE[name] + 12 * (octave + 1)


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("voice_dir", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--bpm", type=float, default=104)
    a = ap.parse_args()

    words = json.loads((a.voice_dir / "words.json").read_text())
    ws = [norm(w["w"]) for w in words]

    def at(*seq: str) -> float:
        """start time of the first occurrence of a word sequence"""
        n = len(seq)
        for i in range(len(ws) - n + 1):
            if ws[i:i + n] == list(seq):
                return words[i]["s"]
        raise KeyError(seq)

    T_ESC, T_NIGHT, T_MIL, T_AWARD = at("one", "bird", "pecked"), at("you", "see"), at("the", "military"), at("decades")
    T_FINAL = at("for", "a", "bomb")
    T_FLASH = words[next(i for i, w in enumerate(ws) if w == "bomb")]["e"]  # end of the hook line
    total = words[-1]["e"] + 1.2
    beat = 60 / a.bpm
    buf = np.zeros((2, int(total * SR)))
    r = dsp.rng(11)

    def put(x, t: float, gain: float, pan: float = 0.0):
        x = np.asarray(x, dtype=float)
        x = x if x.ndim == 2 else dsp.pan(x, pan)
        dsp.place(buf, x / (np.abs(x).max() + 1e-9), t, gain)

    prog = [("F", ["F", "A", "C"]), ("C", ["C", "E", "G"]), ("D", ["D", "F", "A"]), ("A#", ["A#", "D", "F"])]
    motif = [("C", 6), ("A", 5), ("F", 5), ("A", 5), ("C", 6), ("D", 6), ("C", 6), None]
    t, bar = 0.0, 0
    while t < T_FINAL - 0.1:
        root, chord = prog[bar % 4]
        night, mil, award, hook = T_NIGHT <= t < T_MIL, T_MIL <= t < T_AWARD, t >= T_AWARD, t < T_FLASH
        esc = T_ESC <= t < T_NIGHT
        for b in range(4):
            tb = t + b * beat
            if tb >= T_FINAL - 0.1:
                break
            if night:  # explanation: no drums, no tuba
                continue
            if not hook and b in (0, 2):
                put(I.brass(I.m2f(m(root, 1)), beat * 0.85, 0.7, r, kind="tuba"), tb, 0.5, -0.1)
            if b in (1, 3) or hook:
                for k, n in enumerate(chord):
                    put(I.pluck(I.m2f(m(n, 4)), 0.4, r, dur=0.5), tb + beat / 2 * (b % 2 == 0), 0.16, -0.3 + 0.3 * k)
            if mil:
                put(I.snare(0.55 + 0.2 * (b in (1, 3)), r), tb, 0.3, 0.1)
                put(I.snare(0.35, r), tb + beat / 2, 0.18, 0.1)
            elif not hook and b in (1, 3):
                put(I.brush(0.5, r), tb, 0.22, 0.2)
            if esc and b in (1, 3):
                put(I.brass(I.m2f(m(chord[1], 4)), beat * 0.4, 0.7, r, kind="stab"), tb + beat / 2, 0.22, 0.25)
        if night:  # soft pad chord per bar + a sparse vibraphone line
            put(I.pad([I.m2f(m(n, 3)) for n in chord], 4 * beat + 0.4, 0.4, r), t, 0.3)
            put(I.vibes(I.m2f(m(chord[2], 5)), 0.45, r), t + beat, 0.2, 0.3)
        elif (hook or bar % 2 == 0) and not mil:  # the motif: glockenspiel in the hook, music box later
            inst = I.glock if hook or award else I.musicbox
            for k, nt in enumerate(motif):
                if nt and t + k * beat / 2 < T_FINAL - 0.1:
                    put(inst(I.m2f(m(nt[0], nt[1])), 0.55, r), t + k * beat / 2, 0.24, 0.15)
        if award and bar % 2 == 0:  # fanfare: brass stabs on the arpeggio
            for k, n in enumerate(["F", "A", "C", "F"]):
                put(I.brass(I.m2f(m(n, 4 + (k == 3))), beat * 0.5, 0.8, r, kind="stab"), t + k * beat / 2, 0.24, -0.2)
        bar += 1
        t += 4 * beat
    # section accents: cymbal on the flash, snare roll into the military, cymbal on the prize; last hit on "For a bomb"
    put(I.cymbal(0.5, r), T_FLASH, 0.3)
    for tt, v in I.snare_roll(0.0, 1.2 * beat, 0.2, 0.6, r):  # roll into the military section
        put(I.snare(v, r, dur=0.2, buzz=True), T_MIL - 1.2 * beat + tt, 0.12 * (0.4 + v))
    put(I.cymbal(0.6, r), at("peace", "prize"), 0.35)
    put(I.timpani(I.m2f(m("F", 2)), 0.9, r), T_FINAL, 0.55)
    put(I.brass(I.m2f(m("F", 1)), 1.2, 0.8, r, kind="tuba"), T_FINAL, 0.5)

    # duck 3 dB under speech (word spans merged across gaps under 0.3 s), 70 ms attack / 450 ms release
    speak = np.zeros(buf.shape[1])
    for w in words:
        speak[int(w["s"] * SR):int(w["e"] * SR)] = 1
    g = np.where(speak > 0, 10 ** (-3 / 20), 1.0)
    from scipy.signal import lfilter
    env = lfilter([0.0005], [1, -0.9995], g - 1) + 1  # smooth gain changes (~45 ms time constant)
    buf *= env
    buf /= np.abs(buf).max() + 1e-9
    buf *= 0.8
    a.out.parent.mkdir(parents=True, exist_ok=True)
    dsp.write_wav(str(a.out), buf)
    print(f"{a.out}: {total:.1f} s, {bar} bars at {a.bpm:g} bpm; night {T_NIGHT:.1f}-{T_MIL:.1f} s, award from {T_AWARD:.1f} s")


if __name__ == "__main__":
    main()
