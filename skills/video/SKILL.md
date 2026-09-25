---
name: video
description: Master programmatic video and motion graphics engine using Hyperframes. Use for creating product launch videos (/brag), technical explainers, PR demo videos, kinetic UI animations, and compiling HTML/CSS/JS compositions to MP4.
---

# Video Engine (Hyperframes & Brag)

Programmatic video creation and motion graphics engine. Renders video from HTML/CSS/JS compositions using seekable timelines, headless Chromium frame capture, and FFmpeg compilation.

---

## Operational Modes

### 1. Launch & Project Showcase Mode (`/brag`)

Use when asked to "brag about this", "make a launch video", "create a promo video", or `/brag`.

#### Workflow:
1. **Parse Options**:
   - `--tone`: `default`, `polished`, `yc-parody`, `chaotic`, `cinematic`, `deadpan`, `app-store` (see `references/brag/tones.md`).
   - `--format`: `landscape` (16:9), `vertical` (9:16), or `square` (1:1).
   - `--duration`: 15–25 seconds.
   - `--voice`: Optional narration using Kokoro TTS.
2. **Inspect Project**: Read project files (package.json, README, main entrypoints) to extract core value and functionality (`references/brag/step-1-inspect.md`).
3. **Plan and Storyboard**: Write `<output-dir>/brag-plan.md` defining scene-by-scene timing, on-screen text, transitions, and audio cues (`references/brag/step-2-plan.md`).
4. **Compose in HTML**: Scaffold the composition under `<output-dir>/composition/` using timing contracts (`references/brag/step-3-compose.md`).
5. **Audio Mixing**: Select music beds from `assets/music/`, map beat cues with `scripts/analyze_music_cues.py`, and apply ducking (`references/audio/`).
6. **Validate & Render**:
   - Run browser audit gate: `npx hyperframes check`.
   - Render final output: `npx hyperframes render --output <output-dir>/brag.mp4`.
   - Extract and bake poster frame 0: `<output-dir>/brag.jpg`.
   - Generate release copy in `<output-dir>/share-copy.txt`.

---

### 2. Explainer & Technical Demo Mode

Use for turning pull requests, release notes, or technical documentation into video explainers.

#### Workflow:
1. **Structure Content**: Break documentation or git diff into 3–5 narrative scenes (problem, architecture, demo, impact).
2. **Scaffold Composition**: Author HTML scenes with code window cards, callout badges, and step progression.
3. **Pacing**: Allocate 4–8 seconds per technical point to ensure readability.
4. **Render & Review**: Run `npx hyperframes check` followed by `npx hyperframes render`.

---

### 3. Motion Graphics & Kinetic Units Mode

Use for standalone motion graphics, animated UI components, or short visual loops (<10 seconds).

#### Available Runtime Adapters (`references/animation/adapters/`):
- **GSAP**: Default for precise easings and multi-property timelines.
- **Three.js**: 3D spatial models, particle systems, and canvas viewports.
- **Lottie**: Vector animation player integration.
- **Anime.js & WAAPI**: Lightweight DOM tweening.
- **CSS Keyframes**: Hardware-accelerated transforms and seek-safe keyframe blocks.

#### Camera Moves & Keyframes (`references/keyframes/`):
- Punch-in zooms, Ken Burns camera pans, and SVG path morphing.

---

## Composition Contracts (`references/core/`)

Hyperframes compositions follow a strict HTML contract:

1. **Timing Declaration**:
   ```html
   <div class="clip" data-start="0s" data-duration="4s">
     <h1 class="title">Headline</h1>
   </div>
   ```
2. **Deterministic Time**: Animation runtimes must be seekable and driven by the composition clock; never use unpaused `setInterval` or real-time `Date.now()` loops.
3. **Track Separation**: Group distinct elements (video, background, text, captions, audio) into isolated tracks.
4. **Media Ownership**: Audio and video playback is managed by the framework runner.

---

## Verification and CLI Gates (`references/cli/`)

Before rendering, always execute the validation gate:

```bash
# Check composition validity, layout safe-zones, and missing assets
npx hyperframes check

# Preview in interactive player
npx hyperframes preview

# Render to MP4
npx hyperframes render --output output.mp4
```
