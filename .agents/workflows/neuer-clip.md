---
description: Make a new animated story clip (short or long video) in the Ricks Clips look, entirely in code
---
1. Read `AGENTS.md` and `.agents/skills/neuer-clip/SKILL.md`.
2. Ask Arman for the topic (or pitch three true "laugh at a genius" stories) and the format: short (9:16, ~60 s) or long video (16:9, 6-12 min).
3. Run `python3 scripts/new_short.py <name> --title "<title>"` (add `--long` for a long video).
4. Write `projects/<name>/SCRIPT.md` following `.agents/skills/neuer-clip/roles/story-writer.md` and run `python3 scripts/script_check.py projects/<name>` until all rules pass.
5. Make the voice and timings: `~/claud-clips-work/venv-qwen/bin/python scripts/tts.py projects/<name>/SCRIPT.md projects/<name>/voice`, `python3 scripts/words.py projects/<name>/voice`, `python3 scripts/new_short.py <name> --shots`.
6. Plan shots in `projects/<name>/SHOTS.md` and `projects/<name>/shots.json` (place, light, mood, ambience).
7. Build each place following `.agents/skills/neuer-clip/roles/set-builder.md`, starting from `.agents/skills/neuer-clip/SETS.md`; register them in `src/videos/<name>/sets.ts`.
8. Render a storyboard (`WITH_PUBLIC=1 node scripts/stills.mjs <Comp> out/<name>_test/sb_ <frames> 0.3`), judge it with `.agents/skills/neuer-clip/roles/shot-judge.md`, fix shots under 8/10.
9. Write `projects/<name>/cues.json` and run `~/claud-clips-work/venv-qwen/bin/python scripts/mix_audio.py <name>`.
10. Draft: `python3 scripts/render_short.py v1 --short <name> --draft`; show Arman; then final: `python3 scripts/render_short.py final --short <name> --detach` (long: add `--chunk 3000`).
11. Move results to the T7: `python3 scripts/to_t7.py <name>`; add the lesson to `CHECKLIST.md`.
