"""Check a short's script and shot plan against the story formula, before the voice is made.

usage: python3 scripts/script_check.py projects/<name> [--at 12.5 31 ...]
Reads projects/<name>/SCRIPT.md (the lines under "## Voice-over", the same lines tts.py speaks) and, if it exists,
SHOTS.md (the shots table; the first word of its "Set" column is the place). Prints one row per rule with the
measured value and the target, then the questions a script cannot answer. Exit code 1 when a rule is missed.
--at prints the voice-over line spoken at those seconds (voice/lines.json): map retention drops to lines.
Targets: the template's study of 20 reference shorts (vendor/claude-animated-shorts/references/STYLE_BIBLE.md)
and the lessons of the pigeon short (CHECKLIST.md).
"""
import argparse
import json
import re
import statistics
import sys
from pathlib import Path

WPS = {"en": 3.7, "de": 3.1}
WEAK_OPENER = re.compile(r"^(in \d|once upon|today|this is|have you|did you know|so,|hi\b|hey\b"
                         r"|im jahr \d|es war einmal|heute|das ist|wusstest du|hallo\b)", re.I)
ANALOGY = re.compile(r"^(ever|imagine|picture|think|it's like|like"
                     r"|kennst du|stell dir|schon mal|hast du|das ist wie|wie wenn)\b", re.I)
PIVOT = ("you see", "die sache ist", "der trick ist", "das problem ist")
MYSTERY = ("Wait", "Moment")


def language(text: str) -> str:
    fmt = re.search(r"^Format:.*$", text, re.M)
    return "de" if fmt and re.search(r"German|Deutsch", fmt.group(0)) else "en"
QUOTE = re.compile(r'"[^"]+"|“[^”]+”|„[^“”]+[“”]')
NUMBER = re.compile(r"\b\d[\d,.]*\b")


def voice_lines(text: str) -> list[str]:
    body = text.split("## Voice-over", 1)[1] if "## Voice-over" in text else ""
    return [line.strip() for line in body.splitlines() if line.strip() and not line.startswith("#")]


def section(text: str, name: str) -> str:
    m = re.search(rf"^## {name}.*?$(.*?)(?=^## |\Z)", text, re.M | re.S)
    return m.group(1) if m else ""


def short(s: str, n: int = 44) -> str:
    return s if len(s) <= n else s[: n - 3] + "..."


def script_rules(text: str) -> list[tuple[str, bool, str, str]]:
    lines = voice_lines(text)
    if not lines:
        return [("voice-over", False, "no lines under '## Voice-over'", "the narration, one sentence per line")]
    sents = [s for line in lines for s in re.split(r"(?<=[.?!])\s+(?=[A-ZÄÖÜ\"“„])", line) if s]
    words = [len(s.split()) for s in sents]
    total = sum(words)
    wps = WPS[language(text)]
    lo, hi = round(51 * wps), round(70 * wps)
    rules = [("length", lo <= total <= hi, f"{total} words = {total / wps:.0f} s", f"{lo}-{hi} words (51-70 s)")]

    hook = sents[0]
    rules.append(("hook", 10 <= words[0] <= 16 and not WEAK_OPENER.match(hook),
                  f"{words[0]} words: {short(hook, 34)}", "paradox as a fact, 10-16 words, no setup"))

    pivot = next((i for i, s in enumerate(sents) if s.lower().startswith(PIVOT)), None)
    if pivot is None:
        rules.append(("pivot", False, "no 'You see,'", "'You see,' at 45-80 % of the words"))
    else:
        at = sum(words[:pivot]) / total
        rules.append(("pivot", 0.45 <= at <= 0.80, f"'You see' at {at:.0%}", "'You see,' at 45-80 % of the words"))

    before = sents[1:pivot] if pivot is not None else sents[1:]
    mystery = next((s for s in before if s.startswith(MYSTERY) or s.endswith("?")), None)
    rules.append(("mystery", mystery is not None, short(mystery or "none"), "a 'Wait, ...?' question before the pivot"))

    after = sents[pivot + 1: pivot + 4] if pivot is not None else []
    analogy = next((s for s in after if ANALOGY.match(s)), None)
    rules.append(("analogy", analogy is not None, short(analogy or "none"), "'Ever ...?' / 'Imagine ...' after the pivot"))

    quotes = sum(len(QUOTE.findall(line)) for line in lines)
    rules.append(("dialogue", quotes >= 2, f"{quotes} quoted line(s)", "2+ short in-character lines (doubters, hero)"))

    rules.append(("payoff", words[-1] <= 10, f"{words[-1]} words: {short(sents[-1], 34)}", "last sentence 10 words or less"))

    long = [w for w in words if w > 24]
    med = statistics.median(words)
    rules.append(("sentences", 9 <= med <= 16 and not long, f"median {med:g} words, {len(long)} over 24",
                  "median 9-16 words (reference 13.5), none over 24"))

    dense = [s for s in sents if len(NUMBER.findall(s)) >= 2]
    rules.append(("numbers", not dense, short(dense[0]) if dense else "one per sentence", "at most one number per sentence"))

    holes = [line for line in lines if "[" in line]
    rules.append(("placeholders", not holes, short(holes[0]) if holes else "none", "no [placeholders] left"))

    facts = section(text, "Facts")
    checked = re.search(r"- \[x\].*primary", facts, re.I)
    rules.append(("facts", "http" in facts and bool(checked),
                  "checked against a primary source" if checked else "primary source not ticked",
                  "sources in '## Facts', '- [x] ... primary source'"))

    title = re.search(r"^Title:\s*(\S.*)$", section(text, "Posting"), re.M)
    rules.append(("posting", bool(title), short(title.group(1)) if title else "no 'Title:' under '## Posting'",
                  "title, description and hashtags written"))
    return rules


def shot_rules(text: str) -> list[tuple[str, bool, str, str]]:
    rows = [[c.strip() for c in line.strip().strip("|").split("|")] for line in text.splitlines() if line.startswith("|")]
    head = next((r for r in rows if r and r[0] == "#" and any(c.lower().startswith("set") for c in r)), None)
    if head is None:
        return [("places", False, "no shots table with a 'Set' column", "| # | Frames | Voice | Set, light | ...")]
    col = next(i for i, c in enumerate(head) if c.lower().startswith("set"))
    places = [re.split(r"[\s,]", r[col], 1)[0].lower() for r in rows if r and r[0].isdigit() and len(r) > col]
    if not places:
        return [("places", False, "no shot rows", "one row per shot")]
    top = max(set(places), key=places.count)
    run = best = 1
    for a, b in zip(places, places[1:]):
        run = run + 1 if a == b else 1
        best = max(best, run)
    n = len(set(places))
    return [
        ("places", n >= 6, f"{n} places in {len(places)} shots", "6+ places (reference: new place almost every line)"),
        ("place share", places.count(top) / len(places) <= 0.30, f"'{top}' in {places.count(top)} of {len(places)} shots",
         "no place in more than 30 % of the shots"),
        ("place run", best <= 3, f"{best} shots in a row in one place", "3 or fewer"),
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("project", type=Path)
    ap.add_argument("--at", type=float, nargs="+", help="seconds in the final video")
    a = ap.parse_args()

    if a.at:
        lines = json.loads((a.project / "voice" / "lines.json").read_text(encoding="utf-8"))
        for t in a.at:
            hit = next((l for l in lines if l["start"] <= t < l["end"] + 0.05), None)
            print(f"{t:6.1f} s  " + (f"line {hit['id']} ({hit['start']:.1f}-{hit['end']:.1f} s): {hit['text']}" if hit else "no line"))
        return

    rules = script_rules((a.project / "SCRIPT.md").read_text(encoding="utf-8"))
    shots = a.project / "SHOTS.md"
    if shots.exists():
        rules += shot_rules(shots.read_text(encoding="utf-8"))
    for name, ok, value, target in rules:
        print(f"{'ok  ' if ok else 'MISS'}  {name:<12} {value:<46} {target}")
    print("\nCheck by hand:")
    print("- Does every line before 'You see' raise the stakes (doubt, risk, bigger numbers) instead of explaining?")
    print("- Is there one scene where it all comes to a head (a demo, a test, a crash) that the picture can show big?")
    print("- Can every line be drawn literally, with a prop that carries the joke?")
    missed = sum(not ok for _, ok, _, _ in rules)
    print(f"\n{missed} of {len(rules)} rules missed")
    sys.exit(1 if missed else 0)


if __name__ == "__main__":
    main()
