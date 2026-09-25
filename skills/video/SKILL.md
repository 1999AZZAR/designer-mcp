---
name: video
description: Master programmatic video and motion graphics engine using Hyperframes (v0.8.77) and Brag. Renders video from HTML/CSS/JS compositions using seekable timelines, headless Chromium frame capture, and FFmpeg compilation. Use for product launches (/brag), SaaS promos, technical explainers, PR demo videos, kinetic UI animations, beat-synced music videos, slideshow pitch decks, Remotion ports, captions, and compiling compositions to MP4.
---

# Video Engine (Hyperframes v0.8.77 & Brag)

HyperFrames **renders video from HTML** — a composition is an HTML document whose DOM declares timing with `data-*` attributes (`data-start`, `data-duration`), whose animation runtime is seekable, and whose media playback is owned by the framework.

---

## 1. Project State Detection

Before taking action, evaluate project state in order:

| State | Action |
| :--- | :--- |
| **Port Remotion to HyperFrames** | Read `workflows/remotion-to-hyperframes/SKILL.md` and execute directly. Skip intent layer. |
| **Inspect, Diagnose, Preview, or Render** | Run corresponding CLI command (`npx hyperframes check`, `preview`, `render`). Do not re-run intake. |
| **Edit Existing Project** | Run `npx hyperframes timeline [--json]` to inspect tracks, clips, and timing; perform targeted edit. |
| **`BRIEF.md` Exists** | Read `workflow` and `flow` from brief; execute that workflow immediately. |
| **`hyperframes.json` or `STORYBOARD.md` Exists** | Resume from existing project files and recorded preferences. |
| **Fresh Creation Request** | Run intent intake and route using the Routing Matrix below. |

### CLI Version Management
When resuming an existing project with pinned dependencies in `package.json`:
```bash
npx hyperframes@latest upgrade --project . --check
```
If an update is available and verified, apply with `npx hyperframes@latest upgrade --project .` and run `npx hyperframes check`.

---

## 2. Intent Routing Matrix

Route fresh creation requests to the first matching workflow:

| Priority | Request Type | Target Workflow |
| :--- | :--- | :--- |
| 1 | Explicit port of Remotion code | [`workflows/remotion-to-hyperframes`](workflows/remotion-to-hyperframes/SKILL.md) |
| 2 | Presentation, pitch deck, or interactive slide deck | [`workflows/slideshow`](workflows/slideshow/SKILL.md) |
| 3 | Plain word-timed captions or subtitles on footage | [`workflows/embedded-captions`](workflows/embedded-captions/SKILL.md) |
| 4 | Graphic overlays on talking-head, interview, or podcast | [`workflows/talking-head-recut`](workflows/talking-head-recut/SKILL.md) |
| 5 | Beat-synced motion driven by music track (no speech) | [`workflows/music-to-video`](workflows/music-to-video/SKILL.md) |
| 6 | Short, motion-first kinetic visual (<10s) | [`workflows/motion-graphics`](workflows/motion-graphics/SKILL.md) |
| 7 | GitHub pull request or code change explainer | [`workflows/pr-to-video`](workflows/pr-to-video/SKILL.md) |
| 8 | Product launch, website showcase, SaaS promo, `/brag` | [`workflows/product-launch-video`](workflows/product-launch-video/SKILL.md) (or Mode 1) |
| 9 | Conceptual topic or documentation explainer | [`workflows/faceless-explainer`](workflows/faceless-explainer/SKILL.md) |
| 10 | Any other custom video or multi-track composition | [`workflows/general-video`](workflows/general-video/SKILL.md) |

---

## 3. Operational Modes

### Mode 1: Product Launch & Showcase (`/brag` & `product-launch-video`)

Used for website launches, product showcases, SaaS promos, and `/brag`.

1. **Intake & Inspect**:
   - Parse options: `--tone` (default, polished, yc-parody, chaotic, cinematic, deadpan, app-store in `references/brag/tones.md`), `--format` (16:9, 9:16, 1:1), `--duration` (15–25s).
   - If URL provided, capture live site assets:
     ```bash
     npx hyperframes capture "<URL>" -o ./capture --json
     ```
2. **Design System & Presets**:
   - Pick design preset from `references/creative/frame-presets/` (capsule, cobalt-grid, daisy-days, etc.) and remix brand tokens:
     ```bash
     node workflows/product-launch-video/scripts/build-frame.mjs --preset <preset-name> --hyperframes .
     ```
3. **Storyboard & Audio Mix**:
   - Write `STORYBOARD.md` and `SCRIPT.md`.
   - Audio: Select music bed from `assets/music/` or use `/media-use` to resolve tracks and TTS voiceover (`references/audio/`).
   - Run beat cue analysis: `python3 scripts/analyze_music_cues.py --audio <path> --output audio_cues.json`.
4. **Validation & Output**:
   - Verify layout and timing: `npx hyperframes check`.
   - Compile final video: `npx hyperframes render --output brag.mp4`.
   - Save poster frame 0 to `brag.jpg` and release copy to `share-copy.txt`.

---

### Mode 2: Narrative & Technical Explainers (`faceless-explainer`, `pr-to-video`)

Used for turning code diffs, engineering docs, or complex topics into clear video narratives.

1. **Story Spine**: Follow `references/creative/references/story-spine.md` (hook, problem statement, architecture/solution, impact).
2. **Shot Shapes**: Select blueprints from `references/animation/blueprints-index.md` (code-editor, split-comparison, stat-callout, flow-diagram).
3. **Frame Worker Packets**: Generate bounded sub-agent packets with `workflows/faceless-explainer/scripts/frame-packets.mjs`. Each frame is built in isolation (`compositions/frames/NN-*.html`).
4. **Assembly & Audio**: Link frames into root `index.html`, mix voiceover track with ducking envelopes, and render.

---

### Mode 3: Kinetic Motion Graphics & Runtimes (`motion-graphics`, `music-to-video`)

Used for standalone motion graphics, animated UI components, beat grids, and loops.

1. **Runtime Adapters** (`references/animation/adapters/`):
   - **GSAP**: Precision multi-property tweens and seek-safe timelines.
   - **Three.js**: 3D spatial viewports, particle systems, and models (`references/animation/adapters/three.md`).
   - **Lottie**: Vector animation player (`references/animation/adapters/lottie.md`).
   - **Anime.js / WAAPI**: Compact DOM morphs and keyframes.
   - **CSS Keyframes**: Hardware-accelerated transforms.
2. **Camera Transitions & Morphs** (`references/keyframes/`):
   - Ken Burns pans, punch-in zooms, SVG path morphs, and depth effects.
3. **Registry Blocks & Shaders** (`references/registry/`):
   - Search and install pre-built effect blocks (CRT scanlines, glitch, film grain, shimmer sweep, confetti).

---

### Mode 4: Custom Compositions & Multi-Track Editing (`general-video`, `slideshow`)

Used for interactive pitch decks, multi-track timeline editing, and custom HTML videos.

1. **Studio Conventions** (`references/studio/studio-conventions.md`):
   - Every scene is a sub-composition (`data-composition-src`).
   - One caption track (`data-track-kind="captions"`).
   - One element kind per track (video, graphics, captions, audio).
   - Safe-zone compliance (Premiere title/action safe boxes).
2. **Cross-Domain Creator Recipes**:
   - **Trims & Cuts**: Update `data-start`, `data-duration`, and `data-media-start` (`references/core/tracks-and-clips.md`).
   - **Smooth Zooms**: Animate inner crop wrapper with CSS/GSAP while keeping clip timing steady (`references/keyframes/`).
   - **Audio Gain & Ducking**: Apply volume envelopes and bus compression (`references/audio/`).

---

## 4. Verification & CLI Toolchain

Always run validation gates before delivery:

```bash
# Initialize a new Hyperframes project with workflow scaffold
npx hyperframes init "videos/<project>" --skill=<workflow-name>

# Capture live web assets, screenshots, and brand tokens
npx hyperframes capture "<URL>" -o ./capture --json

# Inspect composition timeline, tracks, and clips
npx hyperframes timeline [--json]

# Validate timing attributes, safe zones, and missing assets
npx hyperframes check

# Launch interactive local player
npx hyperframes preview

# Render final MP4 output
npx hyperframes render --output output.mp4
```

---

## 5. Directory Map

| Path | Purpose |
| :--- | :--- |
| [`workflows/`](workflows/) | All 11 upstream workflows (`product-launch-video`, `faceless-explainer`, `pr-to-video`, `motion-graphics`, etc.) |
| [`engine/`](engine/) | Canonical Hyperframes v0.8.77 upstream package suites |
| [`references/core/`](references/core/) | Timing attributes, determinism rules, track models, sub-compositions |
| [`references/animation/`](references/animation/) | GSAP, Three.js, Lottie, Anime.js, CSS adapters, blueprints, motion blur |
| [`references/keyframes/`](references/keyframes/) | 2D/3D camera transitions, zooms, SVG morphs, depth effects |
| [`references/audio/`](references/audio/) | EQ, ducking, compression, submix bus automation envelopes |
| [`references/creative/`](references/creative/) | Design specs, typography, palettes, frame presets, story-spine |
| [`references/registry/`](references/registry/) | Visual blocks, shader components, installation and wiring |
| [`references/studio/`](references/studio/) | Studio timeline layout, caption tracks, safe zones |
| [`references/brag/`](references/brag/) | Curated `/brag` step-by-step guides, tones, and music cues |
| [`assets/music/`](assets/music/) | Curated music beds across cinematic, hype, indie, calm genres |
| [`scripts/`](scripts/) | `analyze_music_cues.py`, frame packet core, and audio extractors |
