# Claud-Clips: instructions for coding agents (Claude Code, Codex, Antigravity)

Animated story clips for YouTube, TikTok and Instagram, built entirely in code: three.js sets inside Remotion with flat
2D cartoon characters, Arman's cloned German voice, one-word captions, our own music and effects. Vertical shorts
(~60 s, 1080x1920) and long videos (6-12 min, 1920x1080).

## Rules
- Talk to Arman in German, short and direct. No filler.
- The look is the Ricks Clips style: white-headed 2D cartoon people in a rich, lit 3D toy world. Everything in code:
  never AI-generated images or video (no Z-Image plates, no Google Flow).
- Work on the Mac in `~/claud-clips-work/Claud-clips` (temp: `~/claud-clips-work/tmp`, models: `~/claud-clips-work`);
  when a clip is finished, `python3 scripts/to_t7.py <name>` moves the results to the external SSD T7. Do not work
  from the T7 (exFAT over USB: ~5x slower; macOS `._` files break git there).
- Facts first: every story is true and checked against a source before the voice is made.
- Ask before deleting files, pushing, posting or spending money.

## How to make a clip
Follow the skill `.agents/skills/neuer-clip/SKILL.md` (Claude: `/neuer-clip`, Codex: `$neuer-clip`, Antigravity:
the `/neuer-clip` workflow). Roles for helpers: `.agents/skills/neuer-clip/roles/`. Reusable places:
`.agents/skills/neuer-clip/SETS.md`. Lessons from every clip: `CHECKLIST.md`.

## Commands
| What | Command |
|---|---|
| New clip | `python3 scripts/new_short.py <name> --title "..."` (`--long` for 16:9) |
| Check the script | `python3 scripts/script_check.py projects/<name>` |
| Voice, word timings, shots | `~/claud-clips-work/venv-qwen/bin/python scripts/tts.py projects/<name>/SCRIPT.md projects/<name>/voice`, `python3 scripts/words.py projects/<name>/voice`, `python3 scripts/new_short.py <name> --shots` |
| Stills (bundle cached) | `WITH_PUBLIC=1 node scripts/stills.mjs <Comp> out/<name>_test/sb_ <frames> 0.3` |
| Sound | `~/claud-clips-work/venv-qwen/bin/python scripts/mix_audio.py <name>` |
| Draft / final | `python3 scripts/render_short.py v1 --short <name> --draft` / `... final --short <name> --detach` (long: `--chunk 3000`) |
| Types | `npx tsc --noEmit -p .` |
| To the T7 | `python3 scripts/to_t7.py <name>` (then `--clean` after asking) |

## Code map
- `src/lib/`: shared engine for new clips: `room.ts` (sets, cameras, light, cards), `CodeShort.tsx` (composition),
  `timing.ts` (shots from the voice), `Captions.tsx` (short: one word; long: subtitle line).
- `src/videos/<name>/`: one clip: `shots.ts`, `sets.ts`, one file per place, the composition.
- `src/videos/pigeon/`: render engine (ink lines, lens blur, grade, painted textures, Pen characters in `toon.ts`).
- `src/videos/whalefull/`: the finished whale short, the set library. `src/videos/whale/draw.ts`: its cast and props.
- `projects/<name>/`: SCRIPT.md, SHOTS.md, shots.json, cues.json, voice/, audio/. Templates: `projects/_template`,
  `projects/_template_long`.
- `scripts/`: the pipeline (above). `vendor/claude-animated-shorts/`: reference study and audio templates.
