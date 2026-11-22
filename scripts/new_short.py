"""Scaffold a new clip built entirely in code: a vertical short (1080x1920) or a 16:9 long video (1920x1080).

usage:
  python3 scripts/new_short.py lighthouse --title "Der Leuchtturm, der zu hell war"          # short
  python3 scripts/new_short.py roman_roads --long --title "Warum Rom Straßen baute"          # long video

Creates (and never overwrites an existing file):
  projects/<name>/SCRIPT.md, SHOTS.md, RESULTS.md     from projects/_template (short) or projects/_template_long
  projects/<name>/short.json                           composition id, output folder, format (render_short.py reads it)
  projects/<name>/shots.json                           shots: which voice lines each shot covers, its place and light
  projects/<name>/voice/lines.json, words.json         a one-line placeholder until tts.py and words.py replace them
  projects/<name>/audio/mix.wav                        1 s of silence until scripts/mix_audio.py writes the real mix
  src/videos/<name>/shots.ts                           timeline from the voice + shots.json (beat(id, word), A, B)
  src/videos/<name>/sets.ts                            which set plays each shot (all on the placeholder set at first)
  src/videos/<name>/stage.ts                           placeholder set: a lit floor, so every shot renders from day one
  src/videos/<name>/<Comp>.tsx                         the composition (src/lib/CodeShort.tsx)
and registers the composition in src/Root.tsx. After the voice exists: `python3 scripts/new_short.py <name> --shots`
rewrites shots.json with one shot per voice line (short) or per paragraph of lines (long, blank-line separated in the
voice-over), keeping places and lights already set for shots that still exist.
Output folders live in out/<name> on the Mac while working; scripts/to_t7.py moves them to the T7 when finished.
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def pascal(name: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in re.split(r"[_\-\s]+", name) if p)


def write(path: Path, text: str) -> None:
    if path.exists():
        print(f"  keep   {path.relative_to(ROOT)}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    print(f"  create {path.relative_to(ROOT)}")


def voice_paragraphs(script: Path) -> list[list[int]]:
    """voice-over lines grouped by blank lines (long videos: one shot per paragraph)"""
    body = script.read_text(encoding="utf-8").split("## Voice-over", 1)[-1]
    groups, cur, i = [], [], 0
    for line in body.splitlines():
        s = line.strip()
        if s.startswith("#"):
            continue
        if not s:
            if cur:
                groups.append(cur); cur = []
            continue
        cur.append(i); i += 1
    if cur:
        groups.append(cur)
    return groups


def make_shots(name: str, long: bool) -> None:
    proj = ROOT / "projects" / name
    lines = json.loads((proj / "voice/lines.json").read_text())
    old = json.loads((proj / "shots.json").read_text()) if (proj / "shots.json").exists() else {"shots": []}
    groups = voice_paragraphs(proj / "SCRIPT.md") if long else [[l["id"]] for l in lines]
    if sum(len(g) for g in groups) != len(lines):
        groups = [[l["id"]] for l in lines]  # paragraphs do not match the spoken lines: one shot per line
    shots = []
    for i, g in enumerate(groups):
        prev = old["shots"][i] if i < len(old["shots"]) else {}
        shots.append({"lines": g, "place": prev.get("place", "stage"), "light": prev.get("light", "warm")})
    (proj / "shots.json").write_text(json.dumps({"shots": shots}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"  shots.json: {len(shots)} shots from {len(lines)} voice lines")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("name", help="folder name, lower case with underscores")
    ap.add_argument("--long", action="store_true", help="16:9 long video instead of a vertical short")
    ap.add_argument("--title", default="")
    ap.add_argument("--shots", action="store_true", help="only rebuild shots.json from the voice")
    a = ap.parse_args()
    name = a.name
    if not re.fullmatch(r"[a-z][a-z0-9_]*", name):
        sys.exit("name: lower case letters, digits and underscores, starting with a letter")
    proj, src = ROOT / "projects" / name, ROOT / "src/videos" / name
    meta_path = proj / "short.json"
    if a.shots:
        meta = json.loads(meta_path.read_text())
        make_shots(name, meta["format"] == "long")
        return

    comp = pascal(name) + ("Long" if a.long else "Short")
    fmt = "long" if a.long else "short"
    w, h = (1920, 1080) if a.long else (1080, 1920)
    print(f"{comp} ({fmt}, {w}x{h})")

    tpl = ROOT / "projects" / ("_template_long" if a.long else "_template")
    for f in ("SCRIPT.md", "SHOTS.md", "RESULTS.md"):
        write(proj / f, (tpl / f).read_text(encoding="utf-8").replace("[Title]", a.title or name))
    write(meta_path, json.dumps({"comp": comp, "out": f"out/{name}", "shots": f"projects/{name}/shots_render.json",
                                 "format": fmt, "width": w, "height": h}, indent=1))
    write(proj / "voice/lines.json", json.dumps([{"id": 0, "text": "(placeholder)", "start": 0.0, "end": 3.0}], indent=1))
    write(proj / "voice/words.json", json.dumps([{"w": "(placeholder)", "s": 0.0, "e": 3.0}], indent=1))
    write(proj / "shots.json", json.dumps({"shots": [{"lines": [0], "place": "stage", "light": "warm"}]}, indent=1))
    write(proj / "shots_render.json", json.dumps({"shots": []}))
    mix = proj / "audio/mix.wav"
    if not mix.exists():
        mix.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "1", str(mix)], check=True)
        print(f"  create {mix.relative_to(ROOT)}")

    write(src / "shots.ts", f'''// Timeline of "{a.title or name}": voice lines (projects/{name}/voice) grouped into shots by projects/{name}/shots.json.
import lines from "../../../projects/{name}/voice/lines.json";
import words from "../../../projects/{name}/voice/words.json";
import plan from "../../../projects/{name}/shots.json";
import {{ makeTiming }} from "../../lib/timing";
import {{ ShotRow }} from "../../lib/room";

export const T = makeTiming(lines, words, plan.shots.map((s) => s.lines));
export const {{ TOTAL, SHOTS, beat, A, B }} = T;
export const PSHOTS: ShotRow[] = SHOTS.map((s, i) => ({{ ...s, light: (plan.shots[i]?.light ?? "warm") as ShotRow["light"] }}));
export const PLACES = plan.shots.map((s) => s.place);
export {{ words }};
''')
    write(src / "stage.ts", f'''// Placeholder set: a lit floor and a sky, so every shot renders before its real place exists. Replace shot by shot
// with real sets (start from a fitting set in src/videos/whalefull/, see .agents/skills/clip-pipeline/SETS.md).
import * as THREE from "three";
import {{ Batch, Kit, lam }} from "../pigeon/build";
import {{ RoomWorld, ShotCam, Stage, camOf, dofOf }} from "../../lib/room";
import {{ PSHOTS }} from "./shots";

const CAMS: Record<number, ShotCam> = Object.fromEntries(PSHOTS.map((s) => [s.id, {{
  keys: [{{ f: s.a, pos: [0, 1.6, 5], look: [0, 1.3, 0], fov: 40 }}], creep: 0.001, cInf: [6] }}]));
export const stageCam = camOf(CAMS, PSHOTS);
export const stageDof = dofOf(CAMS);

export class StageWorld extends RoomWorld {{
  constructor(_kit: Kit) {{
    super(stageCam, PSHOTS);
    const b = new Batch();
    const fl = new THREE.PlaneGeometry(40, 40); fl.rotateX(-Math.PI / 2);
    b.add(fl, lam("stage{pascal(name)}", () => ({{ color: "#e6c189" }})));
    b.build(this.root, false);
  }}
  protected stage(_id: number, _f: number, _light: number): Stage {{ return {{ places: [], fx: [] }}; }}
}}
''')
    write(src / "sets.ts", f'''// Which set plays each shot of "{a.title or name}". Add a set: import its World and Dof, add it to MAKE under the
// place name used in projects/{name}/shots.json ("place"). Shots whose place has no set yet play the placeholder.
import {{ OwnSet }} from "../../lib/CodeShort";
import {{ PSHOTS, PLACES }} from "./shots";
import {{ StageWorld, stageDof }} from "./stage";

const MAKE: Record<string, OwnSet> = {{
  stage: {{ key: "stage", make: (k) => new StageWorld(k), dof: stageDof }},
}};
export const SETS: Record<number, OwnSet> = Object.fromEntries(PSHOTS.map((s, i) => [s.id, MAKE[PLACES[i]] ?? MAKE.stage]));
/** shots that crossfade in: every change of place */
export const XF = new Set(PSHOTS.filter((s, i) => i > 0 && PLACES[i] !== PLACES[i - 1]).map((s) => s.id));
''')
    write(src / f"{comp}.tsx", f'''// "{a.title or name}" ({fmt}, {w}x{h}), built entirely in code on src/lib/CodeShort.tsx.
import React from "react";
import mix from "../../../projects/{name}/audio/mix.wav";
import {{ CodeShort }} from "../../lib/CodeShort";
import {{ PSHOTS, TOTAL, words }} from "./shots";
import {{ SETS, XF }} from "./sets";

export const {comp.upper()}_FRAMES = TOTAL;
/** frames of white flashes (big hits) and of the orange afterglow; fill in from the shot plan */
const FLASHES: number[] = [];
export const {comp}: React.FC = () => (
  <CodeShort shots={{PSHOTS}} sets={{SETS}} xf={{XF}} audio={{mix}} words={{words}} captions="{fmt}" flashes={{FLASHES}} />
);
''')

    root = ROOT / "src/Root.tsx"
    t = root.read_text(encoding="utf-8")
    if comp not in t:
        imp = f'import {{ {comp}, {comp.upper()}_FRAMES }} from "./videos/{name}/{comp}";\n'
        last_import = list(re.finditer(r"^import .*;\n", t, re.M))[-1]
        t = t[:last_import.end()] + imp + t[last_import.end():]
        tag = f'    <Composition id="{comp}" component={{{comp}}} durationInFrames={{{comp.upper()}_FRAMES}} fps={{30}} width={{{w}}} height={{{h}}} />\n'
        t = t.replace("  </>\n);", tag + "  </>\n);")
        root.write_text(t, encoding="utf-8")
        print(f"  register {comp} in src/Root.tsx")
    print(f"\nnext: write projects/{name}/SCRIPT.md, then follow .agents/skills/clip-pipeline/SKILL.md")


if __name__ == "__main__":
    main()
