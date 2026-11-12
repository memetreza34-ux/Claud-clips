# Checklist for the next short

Lessons from "The Pigeons Who Flew a Bomb" (measured against the 20 reference shorts of the template, 2026-11-11).

## Fixed for every short
- **Format:** vertical 9:16, 1080x1920 (final optionally 1440x2560). It is a Short / Reel / TikTok.
- **Safe area:** everything important (faces, the joke prop, captions) inside the centre ~900x1400 px of 1080x1920, with extra room at the bottom (app title and description, up to ~340 px) and on the right (like / comment buttons, ~120-150 px). Captions sit at 64 % of the height. Check stills with `python3 scripts/safezone.py <video> <sheet.jpg>`. The platforms publish no official box; verify on a real phone before posting.
- **Voice:** always Kokoro `am_fenrir`, `--speed 1.25 --max-pause 0.12` (the defaults of `scripts/tts.py`): ~3.7 words/s, no pause over 0.25 s.

## Before building
1. **Facts first:** check the key facts against a primary source before the script is locked.
2. **Pick a story for the picture:** one new place or prop for almost every sentence (the reference changes place constantly; ours reused one lab table in ~7 shots).
3. **Script formula:** paradox hook in sentence 1 (10-16 words), setting, 3-6 escalating beats, a "Wait, ...?" mystery, the "You see," pivot with an everyday analogy, a short ironic payoff as the last words.
4. **Decide on text in the picture:** the reference uses a lot of diegetic text (signs, lists, gauges); the template forbids it.
5. **Shot plan:** per sentence the place, the prop that carries the joke, the light (day -> golden -> night blue for the explanation), the camera move, the character pose and at least one 2D effect.

## Building
6. **Detail:** start from CC0 kits (Kenney, KayKit, Quaternius) plus painted textures; fill every frame with props. Measured gap: detail 17.9 % vs 27.5 %, sharpness 21 vs 30.
7. **Characters:** costumes and hand props per story, poses from `toon.ts` (`arms`), walk cycles instead of appearing.
8. **Camera:** no hard cuts (reference: 0-1 per short); follow objects, push through things, short ease-out pushes; slow push-ins on holds.
9. **Light:** lift the darkest tones, no pure black (2 % mark: reference 0.08, ours 0.04).
10. **Effects:** glows, light shafts, sparkles, dust, splashes; something always moves.

## Sound
11. Recorded CC0 effects (Kenney audio packs on the T7) plus the template instruments for the music; music ~7 LU under the voice, mix ~-14 LUFS.

## Workflow
12. Iterate with drafts: `python3 scripts/render_short.py <name> --draft` (~5 min). Final: `python3 scripts/render_short.py <name>`.
13. After each draft, measure against the references (luma, saturation, detail, frozen frames, cuts, pace) and look at a contact sheet with the safe area drawn in.
14. Do not run other renders at the same time; keep big files on the T7.
