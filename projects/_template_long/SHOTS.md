# "[Title]" - shot plan v1 (long video, 16:9)

30 fps, timed to `voice/words.json`. One shot per voice-over paragraph (`projects/<name>/shots.json`: lines, place,
light). Run `python3 scripts/new_short.py <name> --shots` after the voice exists to rebuild shots.json.
16:9 rules: faces in the middle band, subtitles sit at the bottom (86 %), wide establishing shots are allowed more often
than in shorts, but every hold still creeps and every named thing is on screen on its word.

## Sets (reuse across chapters)
| Set | Used in shots | Light |
|---|---|---|
| [Place] | [1, 4] | [warm] |

## Chapters and shots
| # | Chapter | Voice | Set, light | Picture and camera | Beats (word) |
|---|---|---|---|---|---|
| 1 | Cold open | [paragraph] | [Place], warm | [what we see] | [word] |
