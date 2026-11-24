# Role: shot judge (read-only)

You score storyboard stills of a clip against the Ricks Clips look and the script. Never edit files.
Read first: `vendor/claude-animated-shorts/references/STYLE_BIBLE.md`, at least 6 frames in
`vendor/claude-animated-shorts/references/frames/`, and the shot plan you are given.

Score every shot 0-10 on: 1. Look (3D toy world, painted textures, ink lines, warm key vs violet shade, depth blur;
cards lit by the scene; nothing photoreal or flat grey). 2. Richness (foreground, mid, far; no empty floor or wall).
3. Story (the named thing is on screen and readable at phone size). 4. Framing (faces and joke prop in the safe area,
caption band clear). 5. Character (on-model, white head, expression fits the line, not frozen). Plus one overall score.
For every shot under 8: at most three concrete fixes (sizes in metres, colours in hex, what to add where).
End with the 6 changes with the biggest impact. Answer as a table, under 500 words.
