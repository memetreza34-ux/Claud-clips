"""Time warp from a new narration back to the timing the picture was authored on.

usage: python3 scripts/warp.py <voice_dir> <shots.json>
Reads voice/words_authoring.json (the timing every frame number in the scenes, cameras and sound cues refers to) and
voice/words.json (the new narration), matches the words (an inserted "You see," just interpolates), and writes
  voice/warp.json         [[new_frame, authoring_frame], ...] anchors at every matched word start
  shots_render.json       the shot plan converted to new frames (for short_qa.py and repair_frames.py)
The composition plays authoring frame warp(new frame), so a new voice re-times the whole short without touching it.
"""
import argparse
import bisect
import difflib
import json
import re
from pathlib import Path

FPS = 30


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("voice_dir", type=Path)
    ap.add_argument("shots", type=Path)
    a = ap.parse_args()

    old = json.loads((a.voice_dir / "words_authoring.json").read_text())
    new = json.loads((a.voice_dir / "words.json").read_text())
    sm = difflib.SequenceMatcher(a=[norm(w["w"]) for w in old], b=[norm(w["w"]) for w in new], autojunk=False)
    pairs = [(0.0, 0.0)]
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            o, n = old[blk.a + k]["s"] * FPS, new[blk.b + k]["s"] * FPS
            if n > pairs[-1][0] + 0.5 and o > pairs[-1][1] + 0.5:
                pairs.append((n, o))
    end_old = old[-1]["e"] * FPS + 12
    end_new = new[-1]["e"] * FPS + 12
    pairs.append((max(end_new, pairs[-1][0] + 1), max(end_old, pairs[-1][1] + 1)))
    (a.voice_dir / "warp.json").write_text(json.dumps([[round(n, 2), round(o, 2)] for n, o in pairs]))

    # inverse: authoring frame -> new frame, for the render-side shot plan
    ns, os_ = [p[0] for p in pairs], [p[1] for p in pairs]
    def inv(f: float) -> int:
        i = min(max(1, bisect.bisect_left(os_, f)), len(os_) - 1)
        u = (f - os_[i - 1]) / max(1e-6, os_[i] - os_[i - 1])
        return round(ns[i - 1] + u * (ns[i] - ns[i - 1]))
    plan = json.loads(a.shots.read_text())
    out = {"shots": [{"id": s["id"], "a": inv(s["a"]), "b": inv(s["b"])} for s in plan["shots"]],
           "flash": [inv(x) for x in plan.get("flash", [])],
           "xfade": [[inv(x0), inv(x1)] for x0, x1 in plan.get("xfade", [])]}
    (a.shots.parent / "shots_render.json").write_text(json.dumps(out, indent=1))
    matched = sum(b.size for b in sm.get_matching_blocks())
    print(f"{matched}/{len(new)} words matched, {len(pairs)} anchors; {end_old / FPS:.1f} s authored -> {end_new / FPS:.1f} s now")


if __name__ == "__main__":
    main()
