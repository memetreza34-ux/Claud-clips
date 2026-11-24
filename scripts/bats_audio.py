"""Music, sound effects and the final mix for the bat short ("Die Fledermausbombe").

usage: .venv/bin/python scripts/bats_audio.py   (or any python with numpy, scipy, soundfile)
Reads projects/bats/voice/{voice.wav, words.json}; writes projects/bats/audio/{music.wav, sfx.wav, mix.wav}.
Music: the template's synthesized instruments, sections on the shot starts (src/videos/bats/timing.ts):
  hook (glockenspiel motif over a low drone) -> setup groove from shot 2 (tuba, pizzicato, brushes) -> escalation from
  shot 7 (+ horn stabs) -> "Moment" suspense in shot 8 (pizzicato only) -> action from shot 9 (snare march) ->
  night-blue explanation in shots 11-12 (pad + vibraphone, no drums) -> deadpan report in shots 13-14 (sparse pluck)
  -> victory in shot 15 (glockenspiel + brass), one last timpani + tuba hit on "Amerika".
Effects: Kenney CC0 samples (on the T7) and the template's synthesizers, each on its picture frame (the beats in
timing.ts). Stems against the voice: music -7 LU, effects -12 LU; master -15 LUFS, -1.2 dBTP limiter (template mix.py).
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, lfilter

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "vendor/claude-animated-shorts/templates/audio"))
import dsp  # noqa: E402
import instruments as I  # noqa: E402
import sfx_gen as G  # noqa: E402
from mix import limiter  # noqa: E402

SR, FPS = dsp.SR, 30
VOICE = ROOT / "projects/bats/voice"
AUD = ROOT / "projects/bats/audio"
SAMPLES = Path("/Volumes/T7/Claud-clips/assets/kenney-audio")
STARTS = [0, 164, 374, 535, 604, 743, 834, 1001, 1079, 1241, 1382, 1528, 1646, 1770, 1885]  # timing.ts
BEAT = dict(bats=16, american=127, millionen=302, pearl=431, daechern=586, zahnarzt=626, spinner=723, einrahmen=784,
            schwerer=892, kuehlschrank=983, frueh=1051, genau=1222, generals=1340, flammen=1363, ecke=1518,
            sekunden=1607, testmaterial=1735, stuetzpunkt=1842, amerika=1975)
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def m(name: str, octave: int) -> int:
    return NOTE[name] + 12 * (octave + 1)


def sec(f: float) -> float:
    return f / FPS


def norm(x: np.ndarray) -> np.ndarray:
    return x / (np.max(np.abs(x)) + 1e-9)


def mono(x: np.ndarray) -> np.ndarray:
    return x.mean(axis=0) if x.ndim == 2 else x


_cache: dict[str, np.ndarray] = {}
def smp(name: str) -> np.ndarray:
    if name not in _cache:
        path = next(p for p in SAMPLES.rglob(f"{name}.ogg") if not p.name.startswith("._"))
        x, sr = sf.read(str(path), always_2d=True)
        _cache[name] = resample_poly(x.mean(axis=1), SR, sr) if sr != SR else x.mean(axis=1)
    return _cache[name]


def pick(stem: str, i: int, n: int = 5) -> np.ndarray:
    return smp(f"{stem}_{i % n:03d}")


def music(words: list, total: float) -> np.ndarray:
    S = [sec(f) for f in STARTS]
    T_FLASH, T_ESC, T_WAIT, T_ACT, T_NIGHT, T_REP, T_WIN, T_FINAL = S[1], S[6], S[7], S[8], S[10], S[12], S[14], sec(BEAT["amerika"])
    bpm = 108
    beat = 60 / bpm
    buf = np.zeros((2, int(total * SR)))
    r = dsp.rng(5)

    def put(x, t: float, gain: float, pan: float = 0.0):
        x = np.asarray(x, dtype=float)
        x = x if x.ndim == 2 else dsp.pan(x, pan)
        dsp.place(buf, x / (np.abs(x).max() + 1e-9), t, gain)

    # minor-ish mischief: Dm - A - Bb - A
    prog = [("D", ["D", "F", "A"]), ("A", ["A", "C#", "E"]), ("A#", ["A#", "D", "F"]), ("A", ["A", "C#", "E"])]
    motif = [("D", 6), ("F", 6), ("A", 5), ("D", 6), ("E", 6), ("C#", 6), ("A", 5), None]
    t, bar = 0.0, 0
    while t < T_FINAL - 0.05:
        root, chord = prog[bar % 4]
        hook, wait, act, night, rep, win = t < T_FLASH, T_WAIT <= t < T_ACT, T_ACT <= t < T_NIGHT, T_NIGHT <= t < T_REP, T_REP <= t < T_WIN, t >= T_WIN
        esc = T_ESC <= t < T_WAIT
        for b in range(4):
            tb = t + b * beat
            if tb >= T_FINAL - 0.05:
                break
            if night:
                continue
            if wait:  # suspense: lone pizzicato on the off-beats
                if b in (1, 3):
                    put(I.pluck(I.m2f(m(root, 3)), 0.5, r, dur=0.4), tb, 0.2, -0.2)
                continue
            if rep:  # deadpan: one dry pluck per beat 1, brush on 3
                if b == 0:
                    put(I.pluck(I.m2f(m(chord[0], 3)), 0.4, r, dur=0.3), tb, 0.18, 0.0)
                if b == 2:
                    put(I.brush(0.4, r), tb, 0.16, 0.2)
                continue
            if not hook and b in (0, 2):
                put(I.brass(I.m2f(m(root, 1)), beat * 0.85, 0.7, r, kind="tuba"), tb, 0.5, -0.1)
            if not hook and b in (1, 3):
                for k, n in enumerate(chord):
                    put(I.pluck(I.m2f(m(n, 4)), 0.4, r, dur=0.45), tb, 0.15, -0.3 + 0.3 * k)
            if act:
                put(I.snare(0.55 + 0.2 * (b in (1, 3)), r), tb, 0.3, 0.1)
                put(I.snare(0.35, r), tb + beat / 2, 0.18, 0.1)
            elif not hook and b in (1, 3):
                put(I.brush(0.5, r), tb, 0.22, 0.2)
            if (esc or act) and b in (1, 3):
                put(I.brass(I.m2f(m(chord[1], 4)), beat * 0.4, 0.7, r, kind="stab"), tb + beat / 2, 0.2, 0.25)
        if hook:  # low drone under the burning base
            put(I.pad([I.m2f(m("D", 2)), I.m2f(m("A", 2))], 4 * beat + 0.3, 0.5, r), t, 0.35)
        if night:
            put(I.pad([I.m2f(m(n, 3)) for n in chord], 4 * beat + 0.4, 0.4, r), t, 0.3)
            put(I.vibes(I.m2f(m(chord[2], 5)), 0.45, r), t + beat, 0.2, 0.3)
        elif (hook or win or bar % 2 == 0) and not (wait or act or rep):
            inst = I.glock if hook or win else I.musicbox
            for k, nt in enumerate(motif):
                if nt and t + k * beat / 2 < T_FINAL - 0.05:
                    put(inst(I.m2f(m(nt[0], nt[1])), 0.55, r), t + k * beat / 2, 0.24, 0.15)
        if win and bar % 2 == 0:
            for k, n in enumerate(["D", "F", "A", "D"]):
                put(I.brass(I.m2f(m(n, 4 + (k == 3))), beat * 0.5, 0.8, r, kind="stab"), t + k * beat / 2, 0.22, -0.2)
        bar += 1
        t += 4 * beat
    put(I.cymbal(0.5, r), T_FLASH, 0.3)
    for tt, v in I.snare_roll(0.0, 1.2 * beat, 0.2, 0.6, r):
        put(I.snare(v, r, dur=0.2, buzz=True), T_ACT - 1.2 * beat + tt, 0.12 * (0.4 + v))
    put(I.timpani(I.m2f(m("D", 2)), 0.9, r), sec(BEAT["frueh"]), 0.45)
    put(I.cymbal(0.6, r), sec(BEAT["generals"]), 0.3)
    put(I.timpani(I.m2f(m("D", 2)), 0.9, r), T_FINAL, 0.55)
    put(I.brass(I.m2f(m("D", 1)), 1.2, 0.8, r, kind="tuba"), T_FINAL, 0.5)
    # duck 3 dB under speech
    speak = np.zeros(buf.shape[1])
    for w in words:
        speak[int(w["s"] * SR):int(w["e"] * SR)] = 1
    g = np.where(speak > 0, 10 ** (-3 / 20), 1.0)
    buf *= lfilter([0.0005], [1, -0.9995], g - 1) + 1
    return buf / (np.abs(buf).max() + 1e-9) * 0.8


def fire(dur: float, r) -> np.ndarray:
    """fire bed: low roar (filtered breeze) + crackles (rattle)"""
    roar = mono(G.breeze(dur, r, level=1.0, gust=0.3, bright=500))
    crack = mono(G.rattle(dur, r, density=18.0))
    n = min(len(roar), len(crack))
    return norm(roar[:n]) * 0.7 + norm(crack[:n]) * 0.5


def flutter(dur: float, r) -> np.ndarray:
    return mono(G.flag_flutter(dur, r))


def events(r):
    """(frame, sound, gain dB, pan): reactions land with the picture"""
    B = BEAT
    E = [
        (0, fire(5.6, r), -6, 0.0),                                   # the base burning under the hook
        (B["bats"] - 2, G.whoosh(0.4, r), -10, 0.0),                  # push onto the bat
        (B["american"] - 4, G.whoosh(0.7, r, f_lo=200, f_hi=900), -8, 0.0),  # pull back
        (160, G.whoosh(0.35, r, f_lo=900, f_hi=5000), -6, 0.0),       # white flash
        (290, flutter(2.2, r), -6, 0.2),                              # millions of bats pour out
        (380, smp("switch_003"), -8, 0.2),                            # radio knob
        (384, G.whoosh(1.2, r, f_lo=1500, f_hi=6000, peak=0.2), -18, 0.2),  # radio tuning hiss
        (B["pearl"] - 2, G.whoosh(0.3, r, f_lo=300, f_hi=1500), -10, 0.0),  # reaction zoom
        (541, smp("maximize_004"), -10, 0.0),                         # thought bubble grows
        (B["daechern"] - 2, smp("confirmation_001"), -10, 0.0),       # the idea, grin
        (597, smp("drop_002"), -8, 0.0),                              # bubble pops
        (606, smp("bookFlip2"), -6, 0.0),                             # letter
        (B["zahnarzt"] - 2, G.whoosh(0.3, r, f_lo=300, f_hi=1500), -12, 0.0),  # tilt up to the brow
        (682, smp("bookPlace1"), -8, 0.0),                            # letter down, pen to paper
        (B["spinner"] - 2, pick("impactPlank_medium", 1), 0, 0.0),    # stamp
        (B["spinner"] - 2, pick("impactPlate_heavy", 0), -10, 0.0),
        (770, pick("impactWood_light", 2), -4, 0.2),                  # frame on the nail
        (B["einrahmen"] - 2, smp("confirmation_003"), -10, 0.0),      # proud
        (B["schwerer"] - 4, smp("metalClick"), -6, -0.2),             # the balance tips
        (B["schwerer"], pick("impactMetal_light", 1), -8, -0.2),
        (B["kuehlschrank"] - 14, smp("doorOpen_1"), -4, 0.3),         # fridge door
        (B["kuehlschrank"] - 4, G.whoosh(0.8, r, f_lo=2000, f_hi=7000, peak=0.2), -16, 0.3),  # cold air
        (B["frueh"] - 2, pick("impactGlass_light", 2), -4, 0.0),      # eye snaps open, frost cracks
        (B["frueh"] - 2, smp("glass_004"), -8, 0.0),
        (1081, G.breeze(4.0, r, level=0.6, gust=0.1, bright=1200), -14, 0.0),  # hot desert wind
        (1188, smp("tick_001"), -12, -0.3), (1196, smp("tick_002"), -12, -0.3), (1204, smp("tick_004"), -10, -0.3),
        (1212, pick("impactGlass_medium", 1), -6, -0.3),              # thermometer bursts
        (B["genau"] - 6, pick("impactWood_heavy", 0), -2, 0.0),       # lid pops
        (B["genau"] - 2, flutter(1.4, r), -4, 0.0),                   # bats burst out at the camera
        (1245, flutter(1.6, r), -6, -0.2),                            # bats dive under the roof
        (1250, G.whoosh(1.0, r), -8, 0.0),
        (1290, fire(3.2, r), -6, 0.0),                                # hangar catches fire
        (B["generals"] - 2, G.whoosh(0.6, r, f_lo=150, f_hi=700, peak=0.6), -2, 0.3),  # the car goes up
        (B["generals"] - 2, pick("impactMetal_heavy", 2), -6, 0.3),
        (B["flammen"] - 2, G.whoosh(0.7, r, f_lo=150, f_hi=700, peak=0.6), -4, 0.3),
        (1345, fire(1.3, r), -4, 0.3),
        (1396, flutter(0.9, r), -12, 0.0),                            # the bat flies into the attic
        (B["ecke"] - 6, flutter(0.4, r), -12, 0.4),
        (B["ecke"] - 2, smp("cloth2"), -10, 0.4),                     # hangs in the corner
        (1546, smp("cloth3"), -6, -0.3),                              # cat out of the box
        (1578, G.whoosh(0.35, r, f_lo=600, f_hi=3000), -6, 0.0),      # zip under the bed
        (B["sekunden"] - 2, smp("glass_002"), -10, 0.0),              # glowing eyes
        (B["testmaterial"] - 2, smp("impactBell_heavy_000"), -14, 0.0),  # carriage bell
        (1772, smp("scroll_002"), -12, 0.0),                          # carriage return
        (B["stuetzpunkt"] - 6, G.whoosh(0.3, r, f_lo=300, f_hi=1500), -12, 0.0),  # he turns to camera
        (1888, smp("bookPlace3"), -10, 0.0),                          # map
        (B["amerika"] - 4, smp("drop_004"), -6, 0.2),                 # flag planted
        (B["amerika"] - 2, smp("confirmation_004"), -10, 0.2),
    ]
    # typewriter keys while the report is typed (shot 13)
    E += [(f, smp(f"click_00{1 + i % 5}"), -10 + 2 * (i % 3 == 0), 0.0) for i, f in enumerate(range(1658, 1730, 4))]
    # pen scratching the note (shot 5)
    E += [(f, smp(f"scratch_00{1 + i % 5}"), -14, 0.1) for i, f in enumerate(range(690, 716, 6))]
    # dotted line ticks on the map (shot 15)
    E += [(1893 + 3 * i, smp("tick_002"), -18, 0.1) for i in range(16)]
    return E


def main() -> None:
    words = json.loads((VOICE / "words.json").read_text())
    v, vsr = dsp.read_wav(str(VOICE / "voice.wav"))
    voice = resample_poly(mono(v), SR, vsr) if vsr != SR else mono(v)
    total = max(len(voice) / SR, words[-1]["e"]) + 1.0
    n = int(total * SR)
    V = np.zeros((2, n)); V[:, :len(voice)] = voice
    Mu = np.zeros((2, n)); mu = music(words, total); Mu[:, :mu.shape[1]] = mu[:, :n]
    S = np.zeros((2, n))
    r = dsp.rng(9)
    for f, x, db, p in events(r):
        x = norm(mono(np.asarray(x, dtype=float))) * dsp.dbg(db)
        dsp.place(S, dsp.pan(x, p), f / FPS)
    vl = dsp.integrated(V)
    Mu *= dsp.dbg(vl - 7 - dsp.integrated(Mu))
    S *= dsp.dbg(vl - 12 - dsp.integrated(S))
    mixed = V + Mu + S
    mixed *= dsp.dbg(-15 - dsp.integrated(mixed))
    out, _gain = limiter(mixed)
    AUD.mkdir(parents=True, exist_ok=True)
    dsp.write_wav(str(AUD / "music.wav"), Mu)
    dsp.write_wav(str(AUD / "sfx.wav"), S)
    dsp.write_wav(str(AUD / "mix.wav"), out)
    print(f"voice {vl:.1f} LUFS | mix {dsp.integrated(out):.1f} LUFS, true peak {dsp.true_peak(out):.1f} dBTP, {n / SR:.2f} s")


if __name__ == "__main__":
    main()
