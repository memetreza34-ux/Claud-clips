# "[Title]" - shot plan v1

30 fps, timed to `voice/words.json`. Frame numbers are word starts (`s * 30`, rounded).
Rules: every sentence is shown literally; every reaction lands 0-3 frames before its word; 6-8 frame crossfade on place
changes, hard cuts only on jumps and match cuts; every hold creeps; light day -> golden -> night blue for the explanation.
Everything that matters stays inside the 9:16 safe area (`CHECKLIST.md`).

`scripts/script_check.py` reads the shots table: the first word of the "Set" column is the place. Aim for 6+ places,
no place in more than 30 % of the shots, no more than 3 shots in a row in one place. Build every place you plan here.

## Sets
| Set | Used in shots | Light |
|---|---|---|
| [One-word name: what is in it] | [1, 4] | [day] |

## Cast
- **[Name]**: [costume, hand props, expressions]

## Shots
| # | Frames | Voice | Set, light | Picture and camera | Joke prop / effect | Beats (frame -> word) |
|---|---|---|---|---|---|---|
| 1 | 0-[n] | [hook] | [Place], day | [what we see, how the camera moves] | [the prop that carries the joke] | [frame -> word] |
