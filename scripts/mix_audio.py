"""Music, sound effects and the final mix of a clip, from two small JSON files instead of hand-written code.

usage: ~/claud-clips-work/venv-qwen/bin/python scripts/mix_audio.py <name>     (any python with numpy, scipy, soundfile)
Reads projects/<name>/voice/{voice.wav, lines.json, words.json} and projects/<name>/shots.json; writes
projects/<name>/audio/{music.wav, sfx.wav, mix.wav}.

shots.json, per shot (optional keys):
  "mood": hook | groove | escalate | suspense | action | night | deadpan | silent   (music section; default groove)
  "ambience": beach | wind | room | crowd | rain | none                           (a quiet bed under the shot)
cues.json (optional): {"cues": [{"shot": 10, "word": "knallt", "offset": -2, "sfx": "boom", "gain": 0}, ...]}
  word = first word in that shot starting with it (or "frame": absolute frame instead), offset in frames (sound lands
  2 frames before the picture by default rule), gain in dB.
  sfx: boom | boom_small | splat | whoosh | whoosh_low | swish | crowd_cheer | crowd_panic | applause | hurrah | oof |
       gasp | timpani | cymbal | pop | tick | click | scratch | thud | wood | metal | glass | bell | paper | step
       or "kenney:<sample name>" for any file in the Kenney audio packs on the T7.
Stems against the voice: music -7 LU, effects -12 LU; master -15 LUFS, -1.2 dBTP limiter (template mix.py).
"""
from __future__ import annotations
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
SAMPLES = Path("/Volumes/T7/Claud-clips/assets/kenney-audio")
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def m(name: str, octave: int) -> int:
    return NOTE[name] + 12 * (octave + 1)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def mono(x):
    return x.mean(axis=0) if np.ndim(x) == 2 else x


_cache: dict[str, np.ndarray] = {}
def smp(name: str):
    if name not in _cache:
        hits = [p for p in SAMPLES.rglob(f"{name}.ogg") if not p.name.startswith("._")] if SAMPLES.exists() else []
        if not hits:
            _cache[name] = None
        else:
            x, sr = sf.read(str(hits[0]), always_2d=True)
            _cache[name] = resample_poly(x.mean(axis=1), SR, sr) if sr != SR else x.mean(axis=1)
    return _cache[name]


def boom(dur, r, big=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 70 * np.exp(-t / 0.25) + 28
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 * big))
    roar = dsp.lp(r.standard_normal(n), 600) * np.exp(-t / (0.9 * big)) * np.clip(t / 0.006, 0, 1)
    crack = mono(G.rattle(dur, r, density=40.0, heavy=True))[:n]
    crack = np.pad(crack, (0, n - len(crack))) * np.exp(-t / (0.4 * big))
    return norm(sub) + norm(roar) * 0.8 + norm(crack) * 0.25


def thud(r, f0=60.0, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.08) + 0.4 * dsp.lp(r.standard_normal(n), 400) * np.exp(-t / 0.03)


def kenney(stem: str, fallback, i=0):
    for k in (f"{stem}_{i % 5:03d}", stem):
        x = smp(k)
        if x is not None:
            return x
    return fallback


def sfx(name: str, r, i: int = 0):
    if name.startswith("kenney:"):
        x = smp(name.split(":", 1)[1])
        return x if x is not None else thud(r)
    table = {
        "boom": lambda: boom(2.6, r), "boom_small": lambda: boom(0.7, r, big=0.3),
        "splat": lambda: kenney("impactSoft_heavy", thud(r, 90), i), "thud": lambda: thud(r),
        "whoosh": lambda: G.whoosh(0.5, r), "whoosh_low": lambda: G.whoosh(0.8, r, f_lo=150, f_hi=800, peak=0.4),
        "swish": lambda: G.whoosh(0.25, r, f_lo=900, f_hi=4000),
        "crowd_cheer": lambda: G.applause(2.2, r, people=30), "applause": lambda: G.applause(3.0, r, people=40),
        "crowd_panic": lambda: G.babble(2.0, r, base=190, scale=1.3, rate=6.0), "hurrah": lambda: G.hurrah(r, 170, 1.0),
        "oof": lambda: G.oof(r), "gasp": lambda: G.whoa(r),
        "timpani": lambda: I.timpani(I.m2f(m("F", 2)), 0.9, r), "cymbal": lambda: I.cymbal(0.6, r),
        "pop": lambda: kenney("drop", thud(r, 300, 0.1), i), "tick": lambda: kenney("tick", thud(r, 2000, 0.03), i),
        "click": lambda: kenney("click", thud(r, 1500, 0.04), i), "scratch": lambda: kenney("scratch", G.whoosh(0.2, r, f_lo=2000, f_hi=6000), i),
        "wood": lambda: kenney("impactWood_heavy", thud(r, 120), i), "metal": lambda: kenney("impactMetal_heavy", thud(r, 200), i),
        "glass": lambda: kenney("impactGlass_heavy", thud(r, 900, 0.2), i), "bell": lambda: kenney("impactBell_heavy", I.glock(I.m2f(m("C", 6)), 0.7, r), i),
        "paper": lambda: kenney("bookPlace1", thud(r, 200, 0.1), i), "step": lambda: kenney("footstep_concrete", thud(r, 140, 0.1), i),
    }
    if name not in table:
        sys.exit(f"unknown sfx {name}")
    return table[name]()


def ambience(kind: str, dur: float, r):
    if kind == "beach":
        return norm(mono(G.water_bed(dur, r, close=0.4, slosh_rate=0.25))) * 0.8 + norm(mono(G.breeze(dur, r, level=0.8, gust=0.3, bright=700))) * 0.5
    if kind == "wind":
        return mono(G.breeze(dur, r, level=1.0, gust=0.3, bright=600))
    if kind == "rain":
        return mono(G.rattle(dur, r, density=60.0))
    if kind == "crowd":
        return mono(G.babble(dur, r, base=160, scale=1.0))
    if kind == "room":
        return dsp.lp(r.standard_normal(int(dur * SR)), 300) * 0.3
    return None


def music(shots, starts, total, words, r):
    """sections follow each shot's mood; bars run on 112 bpm in F (mischief) like the whale short"""
    beat = 60 / 112
    buf = np.zeros((2, int(total * SR)))

    def put(x, t, gain, pan=0.0):
        x = np.asarray(x, dtype=float)
        x = x if x.ndim == 2 else dsp.pan(x, pan)
        dsp.place(buf, x / (np.abs(x).max() + 1e-9), t, gain)

    moods = [s.get("mood", "hook" if i == 0 else "groove") for i, s in enumerate(shots)]
    def mood_at(t):
        i = max(0, np.searchsorted(starts, t, side="right") - 1)
        return moods[min(i, len(moods) - 1)]
    prog = [("F", ["F", "A", "C"]), ("C", ["C", "E", "G"]), ("D", ["D", "F", "A"]), ("C", ["C", "E", "G"])]
    motif = [("C", 6), ("A", 5), ("F", 5), ("A", 5), ("C", 6), ("D", 6), ("C", 6), None]
    t, bar, end = 0.0, 0, words[-1]["e"]
    while t < end - 0.05:
        root, chord = prog[bar % 4]
        md = mood_at(t)
        for b in range(4):
            tb = t + b * beat
            if tb >= end or mood_at(tb) in ("silent", "night"):
                continue
            mb = mood_at(tb)
            if mb == "suspense":
                if b in (1, 3):
                    put(I.pluck(I.m2f(m(root, 3)), 0.5, r, dur=0.4), tb, 0.2, -0.2)
                continue
            if mb == "deadpan":
                if b == 0:
                    put(I.pluck(I.m2f(m(chord[0], 3)), 0.4, r, dur=0.3), tb, 0.18)
                if b == 2:
                    put(I.brush(0.4, r), tb, 0.16, 0.2)
                continue
            if mb != "hook" and b in (0, 2):
                put(I.brass(I.m2f(m(root, 1)), beat * 0.85, 0.7, r, kind="tuba"), tb, 0.5, -0.1)
            if mb != "hook" and b in (1, 3):
                for k, n in enumerate(chord):
                    put(I.pluck(I.m2f(m(n, 4)), 0.4, r, dur=0.45), tb, 0.15, -0.3 + 0.3 * k)
            if mb == "action":
                put(I.snare(0.55 + 0.2 * (b in (1, 3)), r), tb, 0.3, 0.1); put(I.snare(0.35, r), tb + beat / 2, 0.18, 0.1)
            elif mb != "hook" and b in (1, 3):
                put(I.brush(0.5, r), tb, 0.22, 0.2)
            if mb in ("escalate", "action") and b in (1, 3):
                put(I.brass(I.m2f(m(chord[1], 4)), beat * 0.4, 0.7, r, kind="stab"), tb + beat / 2, 0.2, 0.25)
        if md == "hook":
            put(I.pad([I.m2f(m("F", 2)), I.m2f(m("C", 3))], 4 * beat + 0.3, 0.5, r), t, 0.3)
        if md == "night":
            put(I.pad([I.m2f(m(n, 3)) for n in chord], 4 * beat + 0.4, 0.4, r), t, 0.3)
            put(I.vibes(I.m2f(m(chord[2], 5)), 0.45, r), t + beat, 0.2, 0.3)
        elif md in ("hook", "groove") and bar % 2 == 0:
            inst = I.glock if md == "hook" else I.musicbox
            for k, nt in enumerate(motif):
                if nt and t + k * beat / 2 < end:
                    put(inst(I.m2f(m(nt[0], nt[1])), 0.55, r), t + k * beat / 2, 0.24, 0.15)
        bar += 1; t += 4 * beat
    put(I.timpani(I.m2f(m("F", 2)), 0.9, r), max(0.0, end - 0.3), 0.55)
    put(I.brass(I.m2f(m("F", 1)), 1.2, 0.8, r, kind="tuba"), max(0.0, end - 0.3), 0.5)
    speak = np.zeros(buf.shape[1])
    for w in words:
        speak[int(w["s"] * SR):int(w["e"] * SR)] = 1
    g = np.where(speak > 0, 10 ** (-3 / 20), 1.0)
    buf *= lfilter([0.0005], [1, -0.9995], g - 1) + 1
    return buf / (np.abs(buf).max() + 1e-9) * 0.8


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    name = sys.argv[1]
    proj = ROOT / "projects" / name
    lines = json.loads((proj / "voice/lines.json").read_text())
    words = json.loads((proj / "voice/words.json").read_text())
    plan = json.loads((proj / "shots.json").read_text())["shots"]
    cues = json.loads((proj / "cues.json").read_text())["cues"] if (proj / "cues.json").exists() else []
    starts = [0.0] + [lines[s["lines"][0]]["start"] for s in plan[1:]]
    ends = starts[1:] + [lines[-1]["end"] + 0.4]

    v, vsr = dsp.read_wav(str(proj / "voice/voice.wav"))
    voice = resample_poly(mono(v), SR, vsr) if vsr != SR else mono(v)
    total = max(len(voice) / SR, words[-1]["e"]) + 1.0
    n = int(total * SR)
    V = np.zeros((2, n)); V[:, :len(voice)] = voice
    r = dsp.rng(7)
    Mu = np.zeros((2, n)); mu = music(plan, np.array(starts), total, words, r); Mu[:, :mu.shape[1]] = mu[:, :n]
    S = np.zeros((2, n))
    r = dsp.rng(9)

    def word_time(shot: int, w: str) -> float:
        s = plan[shot - 1]["lines"]
        a, b = lines[s[0]]["start"] - 0.05, lines[s[-1]]["end"] + 0.05
        hit = next((x for x in words if a <= x["s"] <= b and x["w"].strip("„“\",.:;?!()").lower().startswith(w.lower())), None)
        if not hit:
            sys.exit(f"cue: no word '{w}' in shot {shot}")
        return hit["s"]

    for i, s in enumerate(plan):  # ambience beds
        kind = s.get("ambience", "none")
        bed = ambience(kind, ends[i] - starts[i] + 0.3, r) if kind != "none" else None
        if bed is not None:
            dsp.place(S, dsp.pan(norm(mono(bed)), 0.0) * dsp.dbg(-14), starts[i])
    for k, c in enumerate(cues):
        t0 = c["frame"] / FPS if "frame" in c else word_time(c["shot"], c["word"])
        t0 += c.get("offset", -2) / FPS
        x = np.asarray(sfx(c["sfx"], r, k), dtype=float)
        x = norm(x) if x.ndim == 2 else dsp.pan(norm(x), c.get("pan", 0.0))
        dsp.place(S, x * dsp.dbg(c.get("gain", -6)), max(0.0, t0))

    vl = dsp.integrated(V)
    Mu *= dsp.dbg(vl - 7 - dsp.integrated(Mu))
    if np.abs(S).max() > 0:
        S *= dsp.dbg(vl - 12 - dsp.integrated(S))
    mixed = V + Mu + S
    mixed *= dsp.dbg(-15 - dsp.integrated(mixed))
    out, _gain = limiter(mixed)
    aud = proj / "audio"; aud.mkdir(parents=True, exist_ok=True)
    dsp.write_wav(str(aud / "music.wav"), Mu); dsp.write_wav(str(aud / "sfx.wav"), S); dsp.write_wav(str(aud / "mix.wav"), out)
    print(f"voice {vl:.1f} LUFS | mix {dsp.integrated(out):.1f} LUFS, true peak {dsp.true_peak(out):.1f} dBTP, {n / SR:.2f} s, "
          f"{len(cues)} cues, {sum(1 for s in plan if s.get('ambience', 'none') != 'none')} ambience beds")


if __name__ == "__main__":
    main()
