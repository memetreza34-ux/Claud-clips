"""Sound effects + final mix for the pigeon short.

usage: .venv/bin/python scripts/pigeon_mix.py
Reads projects/pigeon/voice/voice.wav and projects/pigeon/audio/music.wav, places every effect on its picture frame
(events() below, in AUTHORING frames like lab.ts / office.ts; voice/warp.json maps them onto the current narration),
and writes projects/pigeon/audio/{sfx.wav, mix.wav}.
Effects are recorded CC0 sounds from Kenney's RPG Audio, Impact Sounds and Interface Sounds packs (on the T7, see
SAMPLES) where one fits, and the template's synthesizers (sfx_gen.py) for whooshes, creaks, rattles and applause.
Stems against the voice: music -7 LU (the cartoon-short-kit puts the bed at half the voice level), effects -12 LU;
master -15 LUFS, -1.2 dBTP limiter (template mix.py).
"""
import bisect
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "vendor/claude-animated-shorts/templates/audio"))
import dsp  # noqa: E402
import sfx_gen as G  # noqa: E402
from mix import limiter  # noqa: E402

SR, FPS = dsp.SR, 30
AUD = ROOT / "projects/pigeon/audio"
VOICE = ROOT / "projects/pigeon/voice"
SAMPLES = Path("/Volumes/T7/Claud-clips/assets/kenney-audio")


def norm(x: np.ndarray) -> np.ndarray:
    return x / (np.max(np.abs(x)) + 1e-9)


def mono(x: np.ndarray) -> np.ndarray:
    return x.mean(axis=0) if x.ndim == 2 else x


_cache: dict[str, np.ndarray] = {}
def smp(name: str) -> np.ndarray:
    """a Kenney CC0 sample by file name (without .ogg), mono at 48 kHz"""
    if name not in _cache:
        path = next(p for p in SAMPLES.rglob(f"{name}.ogg") if not p.name.startswith("._"))
        x, sr = sf.read(str(path), always_2d=True)
        _cache[name] = resample_poly(x.mean(axis=1), SR, sr) if sr != SR else x.mean(axis=1)
    return _cache[name]


def pick(stem: str, i: int, n: int = 5) -> np.ndarray:
    """one of the numbered takes (stem_000 .. stem_004), rotating so repeats don't sound identical"""
    return smp(f"{stem}_{i % n:03d}")


def warp_to_render():
    """authoring frame -> current render frame (inverse of voice/warp.json); identity without a warp file"""
    p = VOICE / "warp.json"
    if not p.exists():
        return lambda f: f
    a = json.loads(p.read_text())
    ns, os_ = [x[0] for x in a], [x[1] for x in a]
    def inv(f: float) -> float:
        i = min(max(1, bisect.bisect_left(os_, f)), len(os_) - 1)
        return ns[i - 1] + (f - os_[i - 1]) * (ns[i] - ns[i - 1]) / max(1e-6, os_[i] - os_[i - 1])
    return inv


def events(r):
    """(authoring frame, sound, gain dB, pan); reactions land with the picture, 2 f before the word"""
    E = [
        (0, G.whoosh(2.4, r, f_lo=200, f_hi=900, peak=0.5, tail=0.6), -6, 0.0),  # wind past the falling bomb
        (128, G.whoosh(0.5, r), -8, 0.0),                                        # push into the porthole
        (148, G.whoosh(0.35, r, f_lo=900, f_hi=5000), -6, 0.0),                  # white flash
        (218, pick("impactMetal_heavy", 1), -4, 0.3),                            # computer cabinet bumps the bomb
        (379, smp("confirmation_002"), -8, 0.2),                                 # idea sparkle "That's a computer"
        (525, smp("handleCoins"), -6, -0.2),                                     # money bag slides along the table
        (547, smp("dropLeather"), -6, -0.3),                                     # and stops at Fred
        (583, pick("impactMetal_medium", 0), -3, -0.3),                          # hammer on the nose cone: "builds"
        (597, pick("impactMetal_medium", 2), -5, -0.3),                          # "it"
        (611, G.whoosh(0.6, r), -8, 0.0),                                        # into the screen
        (945, G.whoosh(1.5, r, f_lo=200, f_hi=900, peak=0.4), -8, 0.0),          # wind, the bomb drifting
        (951, smp("metalClick"), -8, 0.0), (963, smp("metalLatch"), -8, 0.0),    # fins move
        (1100, G.whoosh(0.4, r, f_lo=200, f_hi=900), -10, 0.0),                  # "Wait," dutch tilt
        (1684, pick("impactPlank_medium", 1), 0, 0.0),                           # stamp
        (1684, pick("impactPlate_heavy", 0), -10, 0.0),
        (1766, smp("bookPlace2"), -4, -0.2),                                     # folder comes back
        (1824, smp("bookClose"), 0, -0.2),                                       # folder slammed ("gave up")
        (1907, G.whoosh(0.5, r, f_lo=200, f_hi=1200), -12, 0.0),                 # spotlight
        (1949, smp("glass_003"), -6, 0.0),                                       # trophy glint
        (2101, smp("cloth2"), -8, 0.3),                                          # wings: pigeon lands
        (2111, pick("impactGeneric_light", 3), -10, 0.3),
    ]
    # calendar pages tear off one by one
    E += [(1749 + 5 * i, smp(f"bookFlip{1 + i % 3}"), -6 - i, 0.2 + 0.05 * i) for i in range(6)]
    # pigeons pop into frame (cartoon plucks), first peck + seeds
    E += [(f, smp(f"pluck_00{1 + i % 2}"), -6, 0.2) for i, f in enumerate([748, 752, 756])]
    E += [(796, pick("impactGeneric_light", 0), -8, 0.3), (798, G.rattle(0.4, r), -14, 0.3)]
    # pecking on the wooden table: shot 8 single pecks, shot 10 frenzy (every 5 f, quieter), shot 15 speeding up 10 -> 4 f
    E += [(f, pick("impactGeneric_light", i), -10, 0.3) for i, f in enumerate(range(845, 940, 10))]
    E += [(f, pick("impactGeneric_light", i), -14 + 3 * (i % 3 == 0), 0.25) for i, f in enumerate(range(996, 1100, 5))]
    E += [(f, pick("impactGeneric_light", i), -12, 0.2) for i, f in enumerate(range(1104, 1135, 8))]
    f, k = 1536.0, 0
    while f < 1654:
        E.append((f, pick("impactGeneric_light", k), -12 + 2 * (k % 4 == 0), 0.25 - 0.1 * (k % 2)))
        f += 10 - 6 * (f - 1536) / 118
        k += 1
    # the teen tapping the phone (shot 14, same rhythm as the pecks), coins when the game pays out
    E += [(f, smp(f"click_00{1 + i % 5}"), -12, 0.1) for i, f in enumerate(range(1432, 1500, 6))]
    E += [(1500, smp("handleCoins2"), -6, 0.2)]
    # clock spins on "forty-five"
    E += [(f, smp(f"tick_00{[1, 2, 4][i % 3]}"), -12, 0.4) for i, f in enumerate(range(1069, 1100, 2))]
    # Fred walks in (shot 12); seeds for the good birds, rain on the third, seeds on the war map
    E += [(f, pick("footstep_wood", i), -10, -0.3 + 0.03 * i) for i, f in enumerate(range(1160, 1194, 8))]
    E += [(1264, G.rattle(0.6, r), -12, 0.2)] + [(1268 + 9 * i, smp(f"drop_00{1 + i % 4}"), -18, 0.35) for i in range(6)]
    E += [(1408, G.rattle(0.6, r), -10, 0.2)]
    # pigeon steps over the map (shot 13) and out of frame (shot 17); electronics blink in
    E += [(f, pick("footstep_carpet", i), -16, 0.1) for i, f in enumerate(range(1338, 1408, 6))]
    E += [(f, pick("footstep_carpet", i), -16, 0.3) for i, f in enumerate(range(1846, 1880, 5))]
    E += [(1842 + 6 * i, smp(f"maximize_00{1 + i % 9}"), -12, 0.0) for i in range(5)]
    # applause for the prize
    E += [(1951, mono(G.applause(1.6, r)), -10, 0.0)]
    return E


def main() -> None:
    v, vsr = dsp.read_wav(str(VOICE / "voice.wav"))  # (channels, samples), 24 kHz mono
    voice = resample_poly(mono(v), SR, vsr)
    music, msr = dsp.read_wav(str(AUD / "music.wav"))
    assert msr == SR
    music = dsp.st(music)
    n = max(len(voice), music.shape[1])
    V = np.zeros((2, n)); V[:, :len(voice)] = voice
    Mu = np.zeros((2, n)); Mu[:, :min(n, music.shape[1])] = music[:, :n]

    S = np.zeros((2, n))
    r = dsp.rng(7)
    to_render = warp_to_render()
    for f, x, db, p in events(r):
        x = norm(mono(np.asarray(x, dtype=float))) * dsp.dbg(db)
        dsp.place(S, dsp.pan(x, p), to_render(f) / FPS)

    vl = dsp.integrated(V)
    Mu *= dsp.dbg(vl - 7 - dsp.integrated(Mu))
    S *= dsp.dbg(vl - 12 - dsp.integrated(S))
    mixed = V + Mu + S
    mixed *= dsp.dbg(-15 - dsp.integrated(mixed))
    out, _gain = limiter(mixed)
    dsp.write_wav(str(AUD / "sfx.wav"), S)
    dsp.write_wav(str(AUD / "mix.wav"), out)
    print(f"voice {vl:.1f} LUFS | mix {dsp.integrated(out):.1f} LUFS, true peak {dsp.true_peak(out):.1f} dBTP, {n / SR:.2f} s")


if __name__ == "__main__":
    main()
