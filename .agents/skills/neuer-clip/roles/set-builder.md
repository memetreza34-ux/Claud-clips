# Role: set builder (one place of a clip, in three.js code)

You build ONE place of a clip in the Ricks Clips look, entirely in code. Read first: `../SKILL.md`, `../SETS.md`,
`CHECKLIST.md` (Look and the lessons), and the reference reports that matter for your place in
`vendor/claude-animated-shorts/references/reports/` (textures.md, lighting.md, depth.md).

You get: the clip name, the place, the shots that use it (frames, the spoken line, the beats on words, the light), and
the file you own: `src/videos/<name>/<place>.ts`.

Rules
- Edit only your file. Shared files (`src/lib/*`, `sets.ts`, the composition) are not yours; say in your report what you
  would need there. Registering your class in `sets.ts` under the place name is the one exception if the brief says so.
- Your class extends `RoomWorld` from `../../lib/room` with `super(<place>Cam, PSHOTS)`; cameras `camOf(CAMS, PSHOTS)`,
  depth of field `dofOf(CAMS)`; frames and beats from `./shots` (`A(id)`, `beat(id, "word")`).
- Start from a finished set in `../SETS.md` when the place is similar; redress it. Otherwise build from geometry
  (Batch + boxGeo / extrude / lathe), painted canvas textures (`ctex`), materials (`lam`), Kenney furniture (`placeProp`).
- Fill the frame: foreground framing objects, mid props, a far layer, sky or back wall. Saturated colours, never pure
  black. Heads white. Faces and the joke prop in the upper 60 % of a short (captions at 64 %) / middle band of a long video.
- Story-critical effects in 3D (chunks, clouds, flying things), small ones as cards. If the key light falls on the back of
  your subject, `this.seedSun(id, 125, 30)`.
- Check yourself: at most two rounds of stills, all frames of a round in ONE call, scale 0.3:
  `WITH_PUBLIC=1 node scripts/stills.mjs <Comp> out/<name>_test/<place>_ <frames> 0.3` and look at every still.
- Report in under 150 words: the file, the shots it covers, the still paths, anything not fixed.
