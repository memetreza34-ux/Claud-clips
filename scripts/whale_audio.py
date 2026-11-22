"""Music, sound effects and the final mix for the whale short ("Der explodierende Wal").

usage: python3 scripts/whale_audio.py   (any python with numpy, scipy, soundfile)
Reads projects/whale/voice/{voice.wav, lines.json, words.json}; writes projects/whale/audio/{music.wav, sfx.wav, mix.wav}.
Shots start on the voice lines (src/videos/whale/timing.ts). Music: the template's synthesized instruments:
  hook (glockenspiel over a low drone) -> mischief groove from shot 2 (tuba, pizzicato, brushes) -> escalation from
  shot 6 (+ horn stabs) -> suspense on the dunes in shot 9 (pizzicato only) -> silence for the blast -> chaos from
  shot 11 (snare march) -> night-blue explanation in shots 15-16 (pad + vibraphone) -> deadpan in 17-19 (sparse pluck),
  one last timpani + tuba hit on "hatte".
Effects: Kenney CC0 samples (on the T7) plus synthesized booms, waves, wind and the crowd, each on its picture frame.
Stems against the voice: music -7 LU, effects -12 LU; master -15 LUFS, -1.2 dBTP limiter (template mix.py).
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
VOICE = ROOT / "projects/whale/voice"
AUD = ROOT / "projects/whale/audio"
SAMPLES = Path("/Volumes/T7/Claud-clips/assets/kenney-audio")
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
LINES = json.loads((VOICE / "lines.json").read_text())
STARTS = [0] + [round(l["start"] * FPS) for l in LINES[1:]]  # shot n starts on line n-1 (timing.ts)


def word_frame(text: str, line: int) -> int:
    """start frame of the first word in a voice line that begins with `text`"""
    words = json.loads((VOICE / "words.json").read_text())
    a, b = LINES[line]["start"] - 0.05, LINES[line]["end"] + 0.05
    w = next(w for w in words if a <= w["s"] <= b and w["w"].strip("„“\",.:?!").lower().startswith(text.lower()))
    return round(w["s"] * FPS)


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


def boom(dur: float, r, big: float = 1.0) -> np.ndarray:
    """explosion: a falling sub thump, a low noise roar and a crackling tail"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 70 * np.exp(-t / 0.25) + 28
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 * big))
    roar = dsp.lp(r.standard_normal(n), 600) * np.exp(-t / (0.9 * big)) * np.clip(t / 0.006, 0, 1)
    crack = mono(G.rattle(dur, r, density=40.0, heavy=True))[:n]
    crack = np.pad(crack, (0, n - len(crack))) * np.exp(-t / (0.4 * big))
    return norm(sub) * 1.0 + norm(roar) * 0.8 + norm(crack) * 0.25


def splat(r, i: int) -> np.ndarray:
    """a wet chunk landing"""
    a, b = norm(pick("impactSoft_heavy", i)), 0.5 * norm(pick("impactPunch_heavy", i + 1))
    out = np.zeros(max(len(a), len(b))); out[:len(a)] += a; out[:len(b)] += b
    return out


def beach(dur: float, r) -> np.ndarray:
    return norm(mono(G.water_bed(dur, r, close=0.4, slosh_rate=0.25))) * 0.8 + norm(mono(G.breeze(dur, r, level=0.8, gust=0.3, bright=700))) * 0.5


def music(words: list, total: float) -> np.ndarray:
    S = [sec(f) for f in STARTS]
    T_GROOVE, T_ESC, T_WAIT, T_BLAST, T_CHAOS, T_Q, T_NIGHT, T_DEAD = S[1], S[5], S[8], S[9], S[10], S[13], S[14], S[16]
    T_FINAL = sec(word_frame("hatte", 18))
    bpm = 112
    beat = 60 / bpm
    buf = np.zeros((2, int(total * SR)))
    r = dsp.rng(7)

    def put(x, t: float, gain: float, pan: float = 0.0):
        x = np.asarray(x, dtype=float)
        x = x if x.ndim == 2 else dsp.pan(x, pan)
        dsp.place(buf, x / (np.abs(x).max() + 1e-9), t, gain)

    # sneaky major-ish mischief: F - C - Dm - C
    prog = [("F", ["F", "A", "C"]), ("C", ["C", "E", "G"]), ("D", ["D", "F", "A"]), ("C", ["C", "E", "G"])]
    motif = [("C", 6), ("A", 5), ("F", 5), ("A", 5), ("C", 6), ("D", 6), ("C", 6), None]
    t, bar = 0.0, 0
    while t < T_FINAL - 0.05:
        root, chord = prog[bar % 4]
        hook, wait, blast = t < T_GROOVE, T_WAIT <= t < T_BLAST, T_BLAST <= t < T_CHAOS
        chaos, q, night, dead = T_CHAOS <= t < T_Q, T_Q <= t < T_NIGHT, T_NIGHT <= t < T_DEAD, t >= T_DEAD
        esc = T_ESC <= t < T_WAIT
        for b in range(4):
            tb = t + b * beat
            if tb >= T_FINAL - 0.05 or night or blast or (T_BLAST - 0.1 <= tb < T_CHAOS):
                continue
            if wait or q:  # suspense: lone pizzicato on the off-beats
                if b in (1, 3):
                    put(I.pluck(I.m2f(m(root, 3)), 0.5, r, dur=0.4), tb, 0.2, -0.2)
                continue
            if dead:  # deadpan: one dry pluck on 1, brush on 3
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
            if chaos:
                put(I.snare(0.55 + 0.2 * (b in (1, 3)), r), tb, 0.3, 0.1)
                put(I.snare(0.35, r), tb + beat / 2, 0.18, 0.1)
            elif not hook and b in (1, 3):
                put(I.brush(0.5, r), tb, 0.22, 0.2)
            if (esc or chaos) and b in (1, 3):
                put(I.brass(I.m2f(m(chord[1], 4)), beat * 0.4, 0.7, r, kind="stab"), tb + beat / 2, 0.2, 0.25)
        if hook:
            put(I.pad([I.m2f(m("F", 2)), I.m2f(m("C", 3))], 4 * beat + 0.3, 0.5, r), t, 0.3)
        if night:
            put(I.pad([I.m2f(m(n, 3)) for n in chord], 4 * beat + 0.4, 0.4, r), t, 0.3)
            put(I.vibes(I.m2f(m(chord[2], 5)), 0.45, r), t + beat, 0.2, 0.3)
        elif (hook or bar % 2 == 0) and not (wait or blast or chaos or q or dead):
            inst = I.glock if hook else I.musicbox
            for k, nt in enumerate(motif):
                if nt and t + k * beat / 2 < min(T_FINAL, T_BLAST) - 0.05:
                    put(inst(I.m2f(m(nt[0], nt[1])), 0.55, r), t + k * beat / 2, 0.24, 0.15)
        bar += 1
        t += 4 * beat
    for tt, v in I.snare_roll(0.0, 1.5 * beat, 0.2, 0.7, r):
        put(I.snare(v, r, dur=0.2, buzz=True), T_BLAST - 1.5 * beat + tt, 0.12 * (0.4 + v))
    put(I.cymbal(0.5, r), sec(64), 0.3)
    put(I.timpani(I.m2f(m("F", 2)), 0.9, r), sec(word_frame("Moment", 13)), 0.45)
    put(I.timpani(I.m2f(m("F", 2)), 0.9, r), T_FINAL, 0.55)
    put(I.brass(I.m2f(m("F", 1)), 1.2, 0.8, r, kind="tuba"), T_FINAL, 0.5)
    speak = np.zeros(buf.shape[1])
    for w in words:
        speak[int(w["s"] * SR):int(w["e"] * SR)] = 1
    g = np.where(speak > 0, 10 ** (-3 / 20), 1.0)
    buf *= lfilter([0.0005], [1, -0.9995], g - 1) + 1
    return buf / (np.abs(buf).max() + 1e-9) * 0.8


def events(r):
    """(frame, sound, gain dB, pan): reactions land with the picture"""
    S = STARTS
    wf = word_frame
    E = [
        (0, beach(4.3, r), -10, 0.0),
        (wf("Wal", 0) - 4, smp("metalClick"), -6, 0.0),               # plunger handle
        (wf("gesprengt", 0) - 2, boom(2.5, r), 0, 0.0),               # BOOM
        (wf("regnete", 0) - 4, splat(r, 0), -6, -0.3), (wf("regnete", 0) + 4, splat(r, 1), -8, 0.3), (116, splat(r, 2), -6, 0.0),
        (S[1], beach(5.4, r), -10, 0.0),
        (wf("vierzehn", 1) - 30, smp("scroll_002"), -8, 0.0),         # tape unrolls
        (wf("vierzehn", 1) - 2, smp("tick_002"), -8, 0.0),
        (wf("stinkt", 2) - 4, G.whoosh(0.6, r, f_lo=200, f_hi=800, peak=0.3), -12, 0.0),
        (wf("fürchterlich", 2) + 4, smp("dropLeather"), -6, 0.2),     # the gull faints
        (wf("fürchterlich", 2) + 4, smp("cloth2"), -10, 0.2),
        (wf("Dynamit", 3) - 2, smp("maximize_004"), -6, 0.0),         # stick pops up
        (wf("Dynamit", 3) - 2, smp("confirmation_001"), -10, 0.0),
        (wf("Möwen", 4) - 2, smp("pluck_001"), -10, 0.2),
        (S[5], beach(4.5, r), -12, 0.0),
        (wf("Zwanzig", 5) - 4, G.whoosh(0.3, r, f_lo=300, f_hi=1500), -10, 0.0),
        (S[7], beach(2.0, r), -14, 0.0),
        (wf("Ich", 7) - 2, smp("switch_003"), -10, 0.3),              # camera
        (S[8], G.babble(2.9, r, base=150, scale=1.0), -16, 0.0),      # crowd murmur on the dune
        (S[8], G.breeze(2.9, r, level=0.8, gust=0.3, bright=600), -12, 0.0),
        (wf("vierhundert", 8) - 2, pick("impactWood_light", 1), -6, 0.0),  # sign pops up
        (wf("knallt", 9) - 2, boom(3.4, r, big=1.4), 2, 0.0),         # THE blast
        (wf("Wolke", 9) - 4, G.whoosh(1.2, r, f_lo=150, f_hi=900, peak=0.4), -6, 0.0),
        (S[10] + 2, G.applause(2.3, r, people=30), -8, 0.0),          # cheering
        (S[10] + 4, G.hurrah(r, 160, 1.0), -10, -0.3), (S[10] + 14, G.hurrah(r, 210, 1.1), -12, 0.3),
        (wf("Da", 10) - 6, G.whoosh(0.9, r, f_lo=900, f_hi=3000, peak=0.6), -14, 0.0),  # chunks whistling down
        (S[11], G.babble(2.1, r, base=190, scale=1.3, rate=6.0), -10, 0.0),  # panic
        (S[11] + 6, G.oof(r), -12, -0.3), (S[11] + 30, G.whoa(r), -12, 0.3),
        (wf("zertrümmert", 12) - 10, G.whoosh(0.4, r, f_lo=200, f_hi=700, peak=0.7), -6, 0.0),
        (wf("zertrümmert", 12) - 2, pick("impactMetal_heavy", 2), 0, 0.0),  # car crushed
        (wf("zertrümmert", 12) - 2, pick("impactGlass_heavy", 0), -4, 0.0),
        (wf("zertrümmert", 12) - 2, splat(r, 3), -4, 0.0),
        (S[13], beach(2.3, r), -12, 0.0),
        (wf("Wal", 13) - 2, smp("question_002"), -12, 0.0),
        (wf("schnell", 14) - 6, G.whoosh(0.4, r, f_lo=600, f_hi=3000), -10, 0.0),
        (S[15] + 4, smp("click_003"), -12, 0.0),                      # microwave on
        (wf("platzt", 15) - 2, boom(0.6, r, big=0.3), -6, 0.0),       # egg pops
        (wf("platzt", 15) - 2, splat(r, 4), -6, 0.0),
        (wf("überall", 15) - 2, splat(r, 1), -10, 0.0),
        (S[16], beach(2.8, r), -12, 0.0),
        (wf("vergraben", 16) - 20, G.breeze(1.4, r, level=1.0, gust=0.1, bright=200), -8, 0.0),  # dozer engine
        (wf("vergraben", 16) - 2, pick("impactSoft_medium", 2), -6, 0.0),
        (S[17] + 4, smp("bookPlace1"), -6, 0.0),                      # paper lands
        (S[18], beach(3.0, r), -14, 0.0),
        (wf("Mann", 18) - 6, smp("footstep_concrete_001"), -10, 0.2),
    ]
    E += [(f, smp(f"scratch_00{1 + i % 5}"), -14, 0.1) for i, f in enumerate(range(S[4] + 6, S[4] + 70, 7))]   # chalk
    E += [(f, smp(f"scratch_00{1 + i % 5}"), -16, 0.1) for i, f in enumerate(range(S[14] + 6, S[14] + 80, 8))]
    E += [(wf("zwanzig", 6) - 4 + 9 * i, pick("impactWood_heavy", i), -6, 0.0) for i in range(6)]          # crates
    E += [(S[11] + 4 + 9 * i, splat(r, i), -8, -0.6 + 0.24 * i) for i in range(6)]                           # blubber rain
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
        x = np.asarray(x, dtype=float)
        x = norm(x) if x.ndim == 2 else dsp.pan(norm(x), p)
        dsp.place(S, x * dsp.dbg(db), f / FPS)
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
