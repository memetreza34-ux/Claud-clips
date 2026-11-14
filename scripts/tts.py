"""Local narration with Kokoro (English) or Piper (German): one wav per sentence, joined with short gaps, pauses squeezed.

usage: .venv/bin/python scripts/tts.py <SCRIPT.md> <out_dir> [--voice am_fenrir] [--speed 1.25] [--gap 0.05] [--max-pause 0.12]
The defaults are the channel voice: keep them for every short (am_fenrir at 1.25 gives ~3.7 words/s).
Reads the lines under the "## Voice-over" heading of SCRIPT.md.
Writes voice.wav and lines.json (start/end of every line, used to time the shots).
The reference shorts have almost no dead air (pauses over 0.25 s add up to under 1 s per video), so every silence inside
a line is shortened to --max-pause and each line is trimmed to 20 ms of lead-in and tail.
Model files are expected in models/kokoro/ and models/piper/.
A script whose "Format:" line says German/Deutsch is spoken by the channel voice: Arman's own voice, cloned with
Qwen3-TTS (mlx-audio) from voice-ref/meine-stimme.wav + .txt. Run German scripts with ~/claud-clips-local/venv-qwen/bin/python (internal SSD).
Years such as 1943 are written out as words first ("neunzehnhundertdreiundvierzig"). --seed keeps a take reproducible;
--engine piper falls back to Piper (models/piper/de_DE-thorsten-high).
"""
import argparse
import json
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf

ONES = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]
TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"]
TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]


def de_two(n: int) -> str:
    if n < 10:
        return ONES[n] + ("s" if n == 1 else "")
    if n < 20:
        return TEENS[n - 10]
    o, t = n % 10, n // 10
    return (ONES[o] + "und" if o else "") + TENS[t]


def de_years(text: str) -> str:
    """1100-1999 as spoken years; espeak would read 1943 as 'eintausendneunhundert...'"""
    def year(m: re.Match) -> str:
        n = int(m.group(0))
        return de_two(n // 100) + "hundert" + (de_two(n % 100) if n % 100 else "")
    return re.sub(r"\b1[1-9]\d\d\b", year, text)


def pronunciation(path: Path) -> dict[str, str]:
    """'## Pronunciation' lines like 'Lytle = Leitel': spoken spelling only, captions keep the script's spelling"""
    m = re.search(r"^## Pronunciation.*?$(.*?)(?=^## |\Z)", path.read_text(encoding="utf-8"), re.M | re.S)
    pairs = [line.lstrip("- ").split("=", 1) for line in (m.group(1) if m else "").splitlines() if "=" in line]
    return {a.strip(): b.strip() for a, b in pairs}


def respell(text: str, say: dict[str, str]) -> str:
    for word, spoken in say.items():
        text = re.sub(rf"\b{re.escape(word)}\b", spoken, text)
    return text


def is_german(path: Path) -> bool:
    fmt = re.search(r"^Format:.*$", path.read_text(encoding="utf-8"), re.M)
    return bool(fmt and re.search(r"German|Deutsch", fmt.group(0)))


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
    ap.add_argument("--voice", default=None)
    ap.add_argument("--speed", type=float, default=None)
    ap.add_argument("--gap", type=float, default=0.05)
    ap.add_argument("--max-pause", type=float, default=0.12)
    ap.add_argument("--engine", choices=["qwen", "piper"], default="qwen", help="German only")
    ap.add_argument("--ref", type=Path, default=Path("voice-ref/meine-stimme.wav"))
    ap.add_argument("--seed", type=int, default=2)
    ap.add_argument("--redo", type=int, nargs="+", help="only regenerate these line ids, keep the rest of voice.wav")
    args = ap.parse_args()
    say = pronunciation(args.script)

    german = is_german(args.script)
    if german and args.engine == "qwen":
        # model and venv live on the internal SSD: loading 2 GB from the USB T7 stalls for minutes
        os.environ.setdefault("HF_HOME", str(Path.home() / "claud-clips-local/hf"))
        import mlx.core as mx
        from mlx_audio.tts.utils import load_model
        from mlx_audio.utils import load_audio
        qwen = load_model("mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit")
        ref_text = args.ref.with_suffix(".txt").read_text(encoding="utf-8").strip()
        ref_audio = load_audio(str(args.ref), sample_rate=qwen.sample_rate)  # read once; the model caches its codes

        def speak(text: str) -> tuple[np.ndarray, int]:
            mx.random.seed(args.seed)
            parts = list(qwen.generate(text=de_years(respell(text, say)), ref_audio=ref_audio, ref_text=ref_text,
                                       lang_code="german", speed=args.speed or 1.0))
            return np.concatenate([np.array(r.audio) for r in parts]).astype(np.float32), parts[0].sample_rate
    elif german:
        from piper import PiperVoice, SynthesisConfig
        voice = PiperVoice.load(f"models/piper/{args.voice or 'de_DE-thorsten-high'}.onnx")
        config = SynthesisConfig(length_scale=1 / (args.speed or 1.15))

        def speak(text: str) -> tuple[np.ndarray, int]:
            parts = list(voice.synthesize(de_years(respell(text, say)), syn_config=config))
            return np.concatenate([c.audio_float_array for c in parts]), parts[0].sample_rate
    else:
        from kokoro_onnx import Kokoro
        kokoro = Kokoro("models/kokoro/kokoro-v1.0.onnx", "models/kokoro/voices-v1.0.bin")

        def speak(text: str) -> tuple[np.ndarray, int]:
            return kokoro.create(text, voice=args.voice or "am_fenrir", speed=args.speed or 1.25, lang="en-us")
    args.out.mkdir(parents=True, exist_ok=True)

    old = {}
    if args.redo:
        prev, rate = sf.read(args.out / "voice.wav", dtype="float32")
        for m in json.loads((args.out / "lines.json").read_text(encoding="utf-8")):
            old[m["id"]] = (m["text"], prev[round(m["start"] * rate):round(m["end"] * rate)])

    chunks, meta, t, rate = [], [], 0.0, 24000
    for i, line in enumerate(read_lines(args.script)):
        if args.redo and i not in args.redo and old.get(i, ("",))[0] == line:
            audio = old[i][1]
        else:
            audio, rate = speak(line)
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
