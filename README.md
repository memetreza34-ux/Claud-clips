# Claud-Clips

Vertical animated story shorts: 2D characters in a colourful 3D world, rendered with three.js inside Remotion on your own computer. No AI video generator.

Built on the MIT-licensed [claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts), linked as a submodule in `vendor/`.

## Set up on a Mac
Needs Node, Python 3, ffmpeg and Google Chrome (`brew install node python ffmpeg`).

```bash
git clone --recurse-submodules https://github.com/memetreza34-ux/Claud-clips.git
```

```bash
cd Claud-clips
```

```bash
npm ci
```

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install kokoro-onnx soundfile
```

Voice model, only needed to generate the narration:

```bash
mkdir -p models/kokoro && curl -L -o models/kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && curl -L -o models/kokoro/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

Test still of the example short:

```bash
mkdir -p out/test && node scripts/bridge-stills.mjs out/test/bridge_ 400 0.5
```

Set `REMOTION_TMP` to a folder with plenty of space: Remotion bundles pile up in the temp folder.

## Layout
| Path | What it is |
|---|---|
| `projects/pigeon/SCRIPT.md` | Facts, sources and voice-over of the first short |
| `src/videos/bridge/` | The example short from the template, the base for new shorts |
| `scripts/` | Stills, QA helpers and `tts.py` (local narration) |
| `vendor/claude-animated-shorts/` | Upstream skill: `SKILL.md`, style notes, audio templates |

## Status
| Step | State |
|---|---|
| Project setup, test render of the example short | Done |
| Script for "The Pigeons Who Flew a Bomb" (Project Pigeon) | Draft, facts from Wikipedia; read the primary source before publishing |
| Voice | Next. `tts.py` is written but has not run yet; the models are not downloaded |
| Word timings | Open. `npx hyperframes` failed on Windows with `ECOMPROMISED`, try again on the Mac |
| Kenney 3D models in `public/bridge/kenney/` | Not downloaded yet; the example still renders without them |
| Own world, characters, cameras, sound, final render | Open |

Decisions so far: English, local Kokoro voice, own story and characters, one-word captions like the reference format. The upstream skill turns captions off, so they still have to be added.

Render speed on the Windows PC (8 GB RAM, Intel UHD): about 10 s per frame at 1080x1920, so about 6 hours for a 70 s short.
