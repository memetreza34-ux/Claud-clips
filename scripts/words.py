"""Word timings for the narration: whisper-cli on one clip per line, spelled like SCRIPT.md.

usage: .venv/bin/python scripts/words.py <voice_dir> [--model <ggml-model.bin>] [--lang de]
--model defaults to ~/claud-clips-local/whisper/ggml-large-v3-turbo.bin; --lang defaults to de when lines.json has German.
Reads voice.wav and lines.json from voice_dir, writes words.json: [{"w": word, "s": start, "e": end}, ...]
Whole-file transcription was up to 0.66 s off at line starts, so every line is transcribed alone.
Words whisper spells differently ("$25,000") get times by length between their matched neighbours.
"""
import argparse
import difflib
import json
import re
import subprocess
import tempfile
from pathlib import Path


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9'äöüß]", "", word.lower().replace("’", "'"))


def transcribe(wav: Path, start: float, dur: float, model: Path, tmp: Path, lang: str) -> list[tuple[str, float, float]]:
    clip, base = tmp / "clip.wav", tmp / "clip"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ss", str(start), "-t", str(dur),
                    "-ar", "16000", "-ac", "1", str(clip)], check=True)
    subprocess.run(["whisper-cli", "-m", str(model), "-f", str(clip), "-l", lang, "-ml", "1", "-sow", "-oj",
                    "-of", str(base), "-np"], check=True, capture_output=True)
    segs = json.loads(base.with_suffix(".json").read_text(encoding="utf-8"))["transcription"]
    return [(s["text"].strip(), s["offsets"]["from"] / 1000, s["offsets"]["to"] / 1000) for s in segs if norm(s["text"])]


def align(script: list[str], heard: list[tuple[str, float, float]], dur: float) -> tuple[list[dict], int]:
    """Copy times of matched words, spread the rest by word length between the known neighbours."""
    times: list[tuple[float, float] | None] = [None] * len(script)
    matcher = difflib.SequenceMatcher(a=[norm(w) for w in script], b=[norm(h[0]) for h in heard], autojunk=False)
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            _, s, e = heard[block.b + k]
            times[block.a + k] = (s, e)

    i = 0
    while i < len(script):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(script) and times[j] is None:
            j += 1
        a = times[i - 1][1] if i else 0.0
        b = times[j][0] if j < len(script) else dur
        total = sum(len(w) for w in script[i:j])
        t = a
        for k in range(i, j):
            step = (b - a) * len(script[k]) / total
            times[k] = (t, t + step)
            t += step
        i = j

    missed = len(script) - sum(b.size for b in matcher.get_matching_blocks())
    words, prev = [], 0.0
    for word, (s, e) in zip(script, times):
        s = min(max(s, prev), dur)
        e = min(max(e, s), dur)
        words.append({"w": word, "s": s, "e": e})
        prev = e
    return words, missed


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("voice_dir", type=Path)
    ap.add_argument("--model", type=Path, default=Path.home() / "claud-clips-local/whisper/ggml-large-v3-turbo.bin")
    ap.add_argument("--lang", default=None)
    args = ap.parse_args()

    lines = json.loads((args.voice_dir / "lines.json").read_text(encoding="utf-8"))
    lang = args.lang or ("de" if re.search(r"[äöüß]| und | der | die ", " ".join(l["text"] for l in lines)) else "en")
    out, spread = [], 0
    with tempfile.TemporaryDirectory() as d:
        for line in lines:
            dur = line["end"] - line["start"]
            heard = transcribe(args.voice_dir / "voice.wav", line["start"], dur, args.model, Path(d), lang)
            words, missed = align(line["text"].split(), heard, dur)
            spread += missed
            out += [{"w": w["w"], "s": round(line["start"] + w["s"], 3), "e": round(line["start"] + w["e"], 3)} for w in words]
            print(f"{line['id']:2d} {len(words):2d} words, {missed} spread  {line['text'][:60]}", flush=True)

    (args.voice_dir / "words.json").write_text(json.dumps(out, indent=0), encoding="utf-8")
    print(f"total {len(out)} words, {spread} spread by length")


if __name__ == "__main__":
    main()
