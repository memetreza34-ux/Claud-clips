---
name: neuer-clip
description: Make a new animated story clip in the Ricks Clips look, built entirely in code (three.js sets in Remotion, flat 2D Pen characters, our own voice, captions and mix). Covers vertical shorts (60 s, 9:16) and long videos (6-12 min, 16:9). Use when Arman asks for a new clip, short, long video, test animation or a new set, or to fix the look of one. Never use AI image or video generators.
---

# Neuer Clip: short or long video, all in code

Works the same in Claude Code, Codex and Antigravity: every step is a script or a file edit, run from the project root.
Answer Arman in German, short and direct.

## The look (never change without being asked)
Flat 2D cartoon people (round WHITE heads #fbf8f2, dot eyes under heavy lids, bean bodies, stick limbs, plum outline)
standing in a RICH, lit 3D toy world: painted canvas textures, saturated colours, thin dark ink lines on the geometry,
warm key light against blue-violet shade, depth blur, bloom, grade. Simple people, rich places; an empty set with a card
in it is the classic failed copy. No AI pictures, no photos, no Google Flow.
Measured rules: `vendor/claude-animated-shorts/references/reports/*.md` and `STYLE_BIBLE.md`. Lessons: `CHECKLIST.md`.

## Where to work
On the Mac in `~/claud-clips-work/Claud-clips` (fast). Temp files in `~/claud-clips-work/tmp`, voice model and whisper
in `~/claud-clips-work/{venv-qwen,hf,whisper}` (`CLIPS_HOME`). When the clip is finished: `python3 scripts/to_t7.py <name>`
moves renders and audio to the external SSD T7 and copies the code to the T7 project; `--clean` then deletes the Mac
copies (ask Arman first). Never work from the T7 itself: every bundle is ~5x slower there.

## Steps (short and long)
1. **Scaffold**: `python3 scripts/new_short.py <name> --title "..."` (short) or `... --long` (16:9 long video).
   It creates the project, timeline, set registry, a placeholder set, the composition and registers it; it renders at once.
2. **Story** (role `roles/story-writer.md`): a TRUE story of the "laugh at a genius" kind (looks stupid, people laugh,
   it seems to fail, physics proves it right): these average ~4x the views of "what if" stories. Fill
   `projects/<name>/SCRIPT.md` (template explains the formula; long videos: chapters, cold open, re-hook every 60-90 s,
   one blank-line paragraph per shot). `python3 scripts/script_check.py projects/<name>` until every rule says ok.
3. **Voice**: `$CLIPS_HOME/venv-qwen/bin/python scripts/tts.py projects/<name>/SCRIPT.md projects/<name>/voice`, then
   `python3 scripts/words.py projects/<name>/voice`, then `python3 scripts/new_short.py <name> --shots`.
4. **Shot plan**: `projects/<name>/SHOTS.md` (what we see per shot, beats on words) and `projects/<name>/shots.json`
   (per shot: "place", "light" warm|day|golden|night, "mood" hook|groove|escalate|suspense|action|night|deadpan|silent,
   "ambience" beach|wind|room|crowd|rain|none). One place per few shots, the named thing on screen ON its word.
5. **Sets** (role `roles/set-builder.md`, one agent per place, at most 4 at once on 16 GB): each place is one file
   `src/videos/<name>/<place>.ts` with a class extending `RoomWorld` from `src/lib/room.ts`
   (`super(cam, PSHOTS)`, `camOf(CAMS, PSHOTS)`), registered in `src/videos/<name>/sets.ts` under its place name.
   Start from a finished set in `SETS.md` when one fits and redress it; build new ones only for new places.
6. **Storyboard**: one still per shot, all in ONE call (the bundle is cached):
   `WITH_PUBLIC=1 node scripts/stills.mjs <Comp> out/<name>_test/sb_ <frame,frame,...> 0.3`. Then role
   `roles/shot-judge.md` scores them; fix every shot under 8/10. Small fixes directly, not by an agent.
7. **Sound**: cues in `projects/<name>/cues.json` (a sound on every hit and move, see the header of
   `scripts/mix_audio.py`), then `$CLIPS_HOME/venv-qwen/bin/python scripts/mix_audio.py <name>`.
8. **Draft**: `python3 scripts/render_short.py v1 --short <name> --draft` (half size, no repair), look at a contact sheet
   (`ffmpeg -i out/<name>/<name>_v1.mp4 -vf "select='not(mod(n\,60))',scale=180:-1,tile=10x3" -frames:v 1 sheet.jpg`).
9. **Final**: `python3 scripts/render_short.py final --short <name> --detach` (survives the session ending; log and
   .done marker in `../tmp`). Long videos add `--chunk 3000` (resumes after a crash). Check the QA lines in the log.
10. **To the T7**: `python3 scripts/to_t7.py <name>`; write the lesson of this clip into `CHECKLIST.md`.

## Camera and motion
One long shot per place: glide in (ease-out, ~10-23 f), rest with a slow creep, push in fast (< 0.5 s) on the named
thing, kick the camera on impacts, change place by crossfade or fly-through, almost never a hard cut. Characters:
wind-up, strike, hit, settle; never frozen (breathing and sway are built in). When the default key lights the back of
the subject, call `this.seedSun(id, 125, 30)` in the set's constructor (front-right key).

## Cost and speed
Set agents on a cheaper model (Sonnet in Claude, a small model elsewhere), two still rounds, scale 0.3. A 63 s short
renders in about 9 minutes final on the Mac. Long videos: reuse sets across chapters and keep shots 2-8 s.
