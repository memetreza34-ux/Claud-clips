# Claud-Clips

Vertical animated story shorts: 2D characters in a colourful 3D world, rendered with three.js inside Remotion on your own computer. No AI video generator.

Built on the MIT-licensed [claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts), linked as a submodule in `vendor/`.

## Set up on a Mac
Needs Node, Python 3.10 to 3.13, ffmpeg, whisper.cpp and Google Chrome (`brew install node python@3.12 ffmpeg whisper-cpp`).

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
python3.12 -m venv .venv
```

```bash
.venv/bin/pip install kokoro-onnx soundfile
```

Voice model, only needed to generate the narration:

```bash
mkdir -p models/kokoro && curl -L -o models/kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && curl -L -o models/kokoro/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

Narration and word timings (`--model` takes any whisper.cpp `ggml-*.bin` model):

```bash
.venv/bin/python scripts/tts.py projects/pigeon/SCRIPT.md projects/pigeon/voice --speed 1.2
```

```bash
.venv/bin/python scripts/words.py projects/pigeon/voice --model /path/to/ggml-medium.bin
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
| `projects/pigeon/voice/` | `voice.wav`, `lines.json` and `words.json` of the first short |
| `scripts/` | Stills, QA helpers, `tts.py` (local narration) and `words.py` (word timings) |
| `vendor/claude-animated-shorts/` | Upstream skill: `SKILL.md`, style notes, audio templates |

## Status
| Step | State |
|---|---|
| Project setup, test still of the example short on the Mac | Done |
| Script for "The Pigeons Who Flew a Bomb" (Project Pigeon) | Draft v2, facts from Wikipedia; read the primary source before publishing |
| Voice | First take, 71 s; pronunciation still to be checked by ear |
| Word timings | First pass from `words.py`; a few words are up to about 0.3 s off and need a hand fix against the shots |
| Kenney 3D models in `public/bridge/kenney/` | Not downloaded yet; the example still renders without them |
| Own world, characters, cameras, sound, final render | Open |

Decisions so far: English, local Kokoro voice, own story and characters, one-word captions like the reference format. The upstream skill turns captions off, so they still have to be added.

Render speed on the Windows PC (8 GB RAM, Intel UHD): about 10 s per frame at 1080x1920, so about 6 hours for a 70 s short.
