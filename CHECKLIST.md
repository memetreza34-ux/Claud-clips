# Checklist for the next short

Lessons from "The Pigeons Who Flew a Bomb" (measured against the 20 reference shorts of the template, 2026-11-11).

## Fixed for every short
- **Format:** vertical 9:16, 1080x1920 (final optionally 1440x2560). It is a Short / Reel / TikTok.
- **Safe area:** everything important (faces, the joke prop, captions) inside the centre ~900x1400 px of 1080x1920, with extra room at the bottom (app title and description, up to ~340 px) and on the right (like / comment buttons, ~120-150 px). Captions sit at 64 % of the height. Check stills with `python3 scripts/safezone.py <video> <sheet.jpg>`. The platforms publish no official box; verify on a real phone before posting.
- **Voice:** always Kokoro `am_fenrir`, `--speed 1.25 --max-pause 0.12` (the defaults of `scripts/tts.py`): ~3.7 words/s, no pause over 0.25 s.

## Before building
0. **Topic and folder:** take the best-scored topic from `IDEAS.md` and copy `projects/_template/` to `projects/<name>/` (script, shot plan, results).
1. **Facts first:** check the key facts against a primary source before the script is locked, then tick the box in `SCRIPT.md`.
2. **Pick a story for the picture:** one new place or prop for almost every sentence (the reference changes place constantly; ours reused one lab table in ~7 shots).
3. **Script formula:** paradox hook in sentence 1 (10-16 words), setting, 3-6 escalating beats, a "Wait, ...?" mystery, the "You see," pivot with an everyday analogy, a short ironic payoff as the last words.
   Pigeon lessons: before the pivot every line raises the stakes instead of explaining (pigeon lines 6-8 explained the nose cone, and the picture stood still at one table); 2+ short quoted lines from doubters and the hero (pigeon had 1); one climax scene the picture can show big (pigeon ended on dates); at most one number per sentence.
   Run `python3 scripts/script_check.py projects/<name>` until every rule says ok, then make the voice.
4. **Decide on text in the picture:** the reference uses a lot of diegetic text (signs, lists, gauges); the template forbids it.
5. **Shot plan:** per sentence the place, the prop that carries the joke, the light (day -> golden -> night blue for the explanation), the camera move, the character pose and at least one 2D effect.
   Build every place the plan names: pigeon planned 7 places and built 4 (the airfield, the bomb nose and the award stage became the lab and the office).
6. **Posting text:** title, description with the source, hashtags under `## Posting` in `SCRIPT.md`.

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

## After posting
15. Fill `projects/<name>/RESULTS.md` after 48 hours and after 7 days. Find the line at each drop with `python3 scripts/script_check.py projects/<name> --at <seconds>`, and write the lesson into this checklist.

## Look (Ricks Clips study, 2026-11-20: 3 YouTube tutorial transcripts + style bible)
- **No AI image plates.** Everything is built in code: a real 3D world (three.js, the pigeon engine: ink outlines,
  painted canvas textures, lens blur, bloom, grade) with flat 2D characters standing in it. Painted AI plates looked
  too realistic (whale v1); the first copies of the style failed as "flat drawings in an empty 3D room".
- **Rich places, simple people.** Every set full of detail (ribs, rivets, props, light beams); the characters stay simple
  (white round heads, bean bodies, stick limbs), identity from hats and clothes.
- **Colour:** very saturated, warm key light against blue/purple shadows, never pure black; light changes with the story.
- **Show it on the word:** when the voice names a thing, it is on screen on that word (reference: 96 %).
- **Camera:** one long shot per place: fly, land, rest, fly again; push in fast (< 0.5 s) on named things; change place
  by flying through something instead of a cut. A new shot about every 2-3 s overall, a sound on every move.
- **Motion:** wind-up, strike, hit, settle; never a frozen pose.
- **Workflow:** storyboard (one still per shot) and check sheets before the full render; every fix becomes a rule here.
- **Script:** "laugh at a genius": weird action, people laugh, it seems to fail, clue, payoff, science; last line that
  loops or makes people argue in the comments.

## Fast workflow (Google Flow keyframes, from 2026-11-20)
Fastest good path: our script/voice/timing/captions/mix pipeline + one Google Flow still per shot (Nano Banana, 0 credits)
in the look above, moved by our Remotion camera with our 2D effects on top (`src/videos/whale/flowshots.tsx`).
- Prompt per shot: subject and action, shot size, place, then the fixed STYLE block ("stylized cartoon animation still,
  a colourful lit 3D toy-like diorama world ... characters are flat 2D cartoon drawings (round plain white heads, dot eyes
  under heavy lids, bean bodies, stick legs) ... Not photorealistic. Warm low sun, blue-purple shadows").
- Keep people on-model: make one good still per character first and pass it as `reference_images` in every shot.
- Where something changes on a word (car crushed), make two stills and switch on that word.
- Real video clips (Omni 1.1 Flash, ~7 credits / 4 s) only for 1-3 climax shots.
- Flow runs one job at a time: send all shots in one `flow_generate` call; agent batches and parallel character calls failed.
- Topic choice (tutorial "Stickman Shorts with free tools", measured on the channel): true stories where one person
  looks like an idiot and real physics proves them right average ~16 M views, "what if" stories ~4 M. Prefer them.
- Cut: one sentence per shot, 4-6 s each, one place and one clear action per shot.

## Lessons from the code-built whale test (2026-11-21, shot-judge 5.0 -> round 2)
- Effects that matter to the story are 3D, not cards: blubber chunks as inked low-poly pieces (skin, fat, flesh) on
  ballistic paths to chosen landing spots; 2D chunk cards with a coloured cap read as faces.
- Dust and smoke clouds: opaque low-poly puffs with ink, rising as a column; translucent cards show the world's ink lines
  through them. Let them leave the frame upward instead of shrinking into floating balls.
- The payoff object stays: after the blast the whale lies there with a hole, wound caps, crater and burnt planks.
- Light: warm low key from the side (`warm` preset in whalecode/room.ts: az 70, el 24) with violet shade; a backlit
  big object turns into a flat purple slab.
- Big props (a 14 m whale) need to sit diagonally in depth so their silhouette reads in a 9:16 frame.
- Heads are white (#fbf8f2), never skin tone.

## Lessons from the first full code-built short (whale, 2026-11-21)
- Speed: work on the Mac, not the T7 (a still took 73 s from the T7, 13 s on the Mac, 4 s with the cached bundle).
  Drafts skip the glitch repair (15 of 40 minutes). Move results to the T7 at the end.
- Agents: 7 set agents on Opus with 4 still rounds used ~2 M tokens and hit the 5-hour limit. Now Sonnet, 2 rounds,
  at most 4 at once; small fixes are done directly instead of by an agent.
- The warm key is fixed per shot from the shot's first camera; when it lights the back of the subject (whale, back
  wall) seed the shot's sun from the front-right (az ~125, el ~30) via RoomWorld's sunCache, as office.ts and beach.ts do.
- A 14 m prop seen from close fills the frame as one flat colour: frame it from higher and further away.
