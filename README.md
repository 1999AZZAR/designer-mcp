# The Designer MCP

> **Part of the [HeLa MCP Ecosystem](https://github.com/1999AZZAR/hela-mcp-ecosystem)** — This server is **HeLa Phenotype (`hela-phenotype`)** — the _Design_ component of the HeLa cellular architecture. See the [ecosystem docs](https://github.com/1999AZZAR/hela-mcp-ecosystem) for profiles, workflows, and multi-client setup.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

A **Design-Theory-as-a-Service** Model Context Protocol (MCP) server for production-grade UI design. Unlike standard code-retrieval MCPs, `designer-mcp` codifies subjective design principles—perceptual color math (OKLCH), motion physics, typographic scaling, and accessibility—into executable algorithms with strict anti-slop quality gates.

37 tools across 17 design systems: **anti-slop quality gates**, **motion.dev & anime.js integration**, **WCAG 2.1 auditing**, **React/Vue component output**, **framework-agnostic CSS**, and **logo & brand-mark design** backed by a 1,432-mark reference library.

![Blotcat at the design pipeline: scan → evaluate → rules → tokens, 17 systems](assets/blotcat-pipeline.jpg)

## Table of Contents

- [Features](#features)
- [Tools](#tools)
- [Motion Design](#motion-design)
- [Examples](#examples)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Logo design](#logo-design-logo_-tools)
- [Development](#development)
- [Anti-Slop Design Philosophy](#anti-slop-design-philosophy)
- [Configuration](#configuration)
- [Configuring with AI Assistants](#configuring-with-ai-assistants)
- [License](#license)

## Features

- **Anti-Slop Quality Gates** — 35-gate slop test + 6-axis self-critique (P-H-E-S-R-V). Rejects anything < 3.
- **OKLCH Token System** — 16 curated themes with auto dark-mode derivation (`full_css` field ships both `:root` and `@media (prefers-color-scheme: dark)` + `[data-theme="dark"]` overrides).
- **Design Rules Generator** — 17 design systems + 4 palettes + 5 archetypes + hybrid combos.
- **Pre-Flight Scan** — Detect existing project context: framework, font stack, palette tokens, motion libraries.
- **Framework-Native Components** — Every component (`button`, `card`, `navbar`, `hero`, etc.) outputs HTML/Tailwind, React TSX (typed FC with prop interface), or Vue 3 SFC (script setup) via the `framework` param.
- **CSS Output Engine** — Generate vanilla CSS, CSS Modules (Button/Card/Input with all 8 states), SCSS (variables + mixins + BEM), or a single `tokens.css` with auto dark-mode overrides.
- **WCAG 2.1 Accessibility Audit** — 25-check static auditor: alt text, unlabeled inputs, empty buttons/links, heading order, focus-visible removal, skip links, landmark regions, viewport scale lock, and more. Returns 0-100 score + A–F grade + actionable fixes.
- **SOTA Motion System (motion.dev & anime.js)** — Style-aware animation presets baked into components. `generate_motion_snippet` for on-demand snippets with React `<motion.div>` and vanilla physics support (8 categories, all reduced-motion guarded).
- **Color Palette Hunter** — Live palettes from Color Hunt with format conversion.
- **Brand Design References** — `brand_fetch_design_md` resolves DESIGN.md from the full 328+ brand getdesign catalog (Stripe, Vercel, Notion, Claude, Tesla, etc.); `brand_list` returns the 62-brand curated subset shipped locally.
- **Logo & Brand-Mark Design** — the in-tree `logo-design` skill plus 8 `logo_*` tools: SVG audit, a searchable 1,432-mark reference library, PNG/favicon rendering, mono/square/app-icon delivery variants, concept sheets, test sheets, and client presentation boards.

## Tools

![Blotcat balancing the full output stack — tokens.css, components, anime.js, WCAG audit — one prompt in, OKLCH out](assets/blotcat-output.jpg)

### Core Design Flow

| Tool                       | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `evaluate_style`           | Score 17 design systems against product context                        |
| `detect_genre`             | Classify brief into editorial / modern-minimal / atmospheric / playful |
| `pre_flight_scan`          | Scan existing project for framework, fonts, palette, motion libs       |
| `generate_rules`           | Generate design rules for style + palette + archetype/hybrid           |
| `generate_tailwind_config` | Generate ready-to-use tailwind.config.js                               |
| `get_cross_cutting_rules`  | Get standalone rules (a11y, motion, icons, tokens, responsive)         |

### Theme & Token System

| Tool                  | Description                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `generate_tokens`     | Generate complete OKLCH token system. Returns `css` (light `:root`), **`full_css`** (light + dark `@media` + `[data-theme="dark"]` overrides), `dark_css`, `dark_tokens` |
| `list_themes`         | List all 16 themes with OKLCH values, fonts, axis metadata                                                                                                               |
| `build_custom_tokens` | Build custom OKLCH token system from paper/accent/font values — also emits dark mode derivation                                                                          |

### Quality Gates

| Tool                      | Description                                                                                                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anti_pattern_check`      | Run 35-gate slop test on HTML/CSS                                                                                                                                                                                                                                                                         |
| `self_critique`           | Score output on 6 quality axes (P-H-E-S-R-V) — anything < 3 triggers revision                                                                                                                                                                                                                             |
| **`audit_accessibility`** | **25-check WCAG 2.1 static auditor** — alt text, unlabeled inputs/selects/textareas, empty buttons/links, heading order, focus-visible removal, skip links, landmark regions, viewport scale lock, and more. Returns 0–100 score, A–F grade, per-severity counts, fix instructions, and passed-check list |

### Component & Template

| Tool                        | Description                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_template`         | Full HTML starter page — **ships with anime.js v3 animations**                                                                                              |
| **`get_component`**         | Production-ready component. **`framework` param**: `html` (default) \| `react` (TypeScript FC with `motion/react` physics) \| `vue` (SFC with script setup) |
| `generate_8state_component` | Standalone HTML preview with all 8 interactive states — animated via anime.js spring physics                                                                |
| `generate_palette_variants` | Light/dark/high-contrast variants from hex colors                                                                                                           |
| `export_project`            | Full project scaffold (config + HTML + components)                                                                                                          |

### CSS Output

| Tool                      | Description                                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`generate_css_output`** | **Framework-agnostic CSS generation** from style + palette. Formats: `vanilla` (tokens.css + base.css + components.css) \| `css-modules` (Button/Card/Input .module.css with all 8 states) \| `scss` (\_tokens + \_mixins + \_components + main.scss) \| `css-variables-only` (tokens.css with auto dark mode). Returns named files array ready to save. |

### Motion (motion.dev & anime.js)

| Tool                      | Description                                                                                                                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_motion_snippet` | Generate a ready-to-paste **motion.dev** or **anime.js** snippet matched to the current design style's physics and easing. Supports 8 categories: `entrance`, `micro`, `stagger`, `scroll`, `loader`, `transition`, `counter`, `typewriter`. Every snippet includes a `prefers-reduced-motion` guard. |

### Color & Palette

| Tool              | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| `palette_fetch`   | Fetch live palettes from Color Hunt                                     |
| `palette_convert` | Convert palette JSON to CSS / Tailwind / SCSS / Figma / Android / Swift |

### Brand References

| Tool                    | Description                                  |
| ----------------------- | -------------------------------------------- |
| `brand_fetch_design_md` | Download DESIGN.md for a real brand          |
| `brand_list`            | List the 62 curated local brands by category |

### Logo Design (see "Logo design" below)

| Tool                      | Description                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `logo_audit`              | Audit logo SVGs — live text, rasters, filters, colours, gradients, tiny details, centring  |
| `logo_search_library`     | Search 1,432 real-world logo SVGs by type, technique, geometry, industry, colour, mood     |
| `logo_render`             | Render SVG → transparent PNG, screenshot HTML sheets, build favicon.ico                    |
| `logo_renderers`          | Report which rendering backends are installed                                              |
| `logo_export_variants`    | Produce the delivery set: mono, black/white, square, favicon, app-icon, web icons          |
| `logo_concept_sheet`      | One-image concept overview with true 64/32/16 px renderings and a recommendation           |
| `logo_preview_sheet`      | HTML test sheet: size ladder, 16 px test, one-colour, contexts, shelf test vs. competitors |
| `logo_presentation_board` | Client presentation with industry-specific mockups from a JSON spec                        |

### Utility

| Tool                    | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `list_options`          | List all available systems, palettes, archetypes, hybrids |
| `validate_combo`        | Validate style + palette + hybrid combo                   |
| `get_reference`         | Pull full content of any reference doc                    |
| `list_installed_skills` | Detect installed skill submodules                         |

## Motion Design

The MCP provides a dual-engine motion system: **motion.dev** (modern, physics-based, React-native) and **anime.js v3** (lightweight vanilla JS).

When calling `generate_motion_snippet` or `get_component` (for React), the output is automatically calibrated to the design system's character:

| System          | Easing / Physics                        | Duration |
| --------------- | --------------------------------------- | -------- |
| `glass`         | `easeOutQuart` / `[0.16, 1, 0.3, 1]`    | 700ms    |
| `claymorphism`  | `spring(1, 80, 10, 0)` / `bounce: 0.4`  | 600ms    |
| `neo-brutalism` | `easeInOutExpo` / `[0.87, 0, 0.13, 1]`  | 400ms    |
| `material`      | `cubicBezier(0.4, 0, 0.2, 1)`           | 300ms    |
| `apple-hig`     | `spring(1, 100, 18, 0)` / `bounce: 0.2` | 550ms    |
| `swiss`         | `linear`                                | 200ms    |
| `m3-pastel`     | `spring(1, 80, 12, 0)` / `bounce: 0.3`  | 450ms    |

Use `generate_motion_snippet` for standalone snippets targeting specific use cases across React, Vue, and HTML:

```json
{
  "tool": "generate_motion_snippet",
  "arguments": {
    "category": "entrance",
    "style": "glass",
    "engine": "motion.dev",
    "framework": "react"
  }
}
```

Returns `{ cdn, snippet, easing, duration, usage_hint, reduced_motion_note }`.

All snippets respect `prefers-reduced-motion` — animations are skipped entirely when the user has enabled reduced motion.

## Examples

**[🔥 Live Demo: Ellis UI Collection](https://1999AZZAR.github.io/designer-mcp/)**

**Ellis UI (`examples/ellis-ui`)**
A comprehensive, anti-slop component library demonstrating the extreme versatility of `designer-mcp`'s ruleset. The project takes a single romantic letter and renders it across **24 radically different, strictly enforced aesthetic systems** (e.g., Swiss Archival, Vintage Airmail, Brutalist, UNIX Phosphor, 8-Bit Game Boy).

Each design acts as a fully standalone, reusable UI kit utilizing zero JS dependencies—relying entirely on strict structural typography, CSS geometry, and advanced CSS rendering techniques (clip-paths, custom filters, OKLCH gradients). Each of the 24 folders includes a `design.md` detailing the tokens and layout strategy, acting as an advanced template reference for `designer-mcp`.

## Installation

```bash
git clone https://github.com/1999AZZAR/designer-mcp.git
cd designer-mcp
npm install
npm run build
```

**Requirements**: Node.js >= 18. The `logo_*` tools additionally need **Python 3** (no
third-party packages) and at least one SVG renderer — cairosvg, rsvg-convert, Inkscape, or
headless Chrome. Check what is available with the `logo_renderers` tool. The other 29 tools have
no runtime dependency beyond Node.

## Usage

```bash
npm start
```

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Development

```bash
npm run build   # tsc
npm test        # 39 checks across two suites
```

Tests are plain `node` scripts that import the TypeScript sources directly through
`--experimental-strip-types`; there is no test framework dependency. `logo-tools.test.mjs`
runs the real Python scripts in a temp directory rather than mocking them, so a change to a
script's CLI surface fails the suite instead of silently drifting from `src/logoTools.ts`.

### pre-commit

Hooks are configured in `.pre-commit-config.yaml` and cover this repo:

| Hook                                                       | Scope                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `trailing-whitespace`, `end-of-file-fixer`                 | first-party files                                               |
| `check-added-large-files` (500 KB)                         | first-party files; the two generated library indexes are exempt |
| `check-yaml`, `check-merge-conflict`, `detect-private-key` | all files                                                       |
| `prettier`                                                 | JS/TS/CSS/HTML/JSON/Markdown, first-party files                 |

Three trees are kept **byte-stable** and excluded from the reformatting hooks, each for a
stated reason rather than by convenience: `examples/` (demo artifacts must match what was
designed), `skills/video/` (canonical upstream HyperFrames packages), and
`skills/logo-design/assets/library/` (generated indexes plus third-party reference marks).
The list is repeated per hook because pre-commit has no shared exclude — keep the three in sync
when you add a fourth.

`prettier` runs as a **system command** via `scripts/prettier-hook.sh`, not through pre-commit's
nodeenv installer: pre-commit 4.6.x installs node hooks with `npm install --allow-git=root`, which
npm >= 11 rejects for non-root users, so the stock `mirrors-prettier` hook cannot install at all
on this machine. The wrapper prefers `node_modules/.bin/prettier`, falls back to `prettier` on
PATH, and warns instead of blocking when neither exists.

> **Heads-up:** this machine sets a global `core.hooksPath` whose hook is scoped to
> `chaining-mcp`, so these hooks do **not** fire automatically on `git commit` here. Run
> `pre-commit run --all-files` before pushing, or add the repo to that global hook's allowlist.

## Architecture

`designer-mcp` operates on a multi-tier architecture. An MCP server on its own is just an API; by pairing the MCP with four companion AI skills, the AI gets both the tools (the MCP) and the instruction manual (the skills).

- **`ui-designer` skill**: Provides the design intelligence, heuristics, and brand context so the AI knows _what_ to ask the MCP to generate.
- **`color-palette-hunter` skill**: Handles external palette sourcing and feeds them into the OKLCH token engine.
- **`motion-designer` skill**: Defines SOTA animation heuristics, spring physics logic, and `motion.dev` best practices.
- **`logo-design` skill**: Professional logo and brand-mark design, brief to production files, plus a searchable library of 1,432 real-world SVG logos for category research.

```text
src/
  index.ts              # MCP server entry, tool routing (37 tools)
  rules.ts              # 17 design systems, palettes, archetypes, hybrids
  anti-patterns.ts      # 35-gate slop test + 6-axis self-critique
  a11y-audit.ts         # 25-check WCAG 2.1 accessibility auditor (no deps, regex-only)
  tokens.ts             # 16 curated themes, OKLCH token generation, dark mode derivation
  css-output.ts         # vanilla CSS / CSS Modules / SCSS / css-variables-only generator
  anime-motion.ts       # anime.js v3 integration — style-aware presets, CDN helper, snippet generator
  components.ts         # Component library — HTML/React TSX/Vue 3 SFC output
  components-8state.ts  # 8-state component demo generator (anime.js micro-interactions)
  preflight.ts          # Project context scanner (framework, fonts, palette, motion)
  evaluate.ts           # Style scoring engine
  palette.ts            # Color Hunt palette fetcher
  palette-convert.ts    # Format converter
  palette-variants.ts   # Light/dark/high-contrast variant generator
  templates.ts          # HTML template generator (anime.js baked in)
  tailwind-config.ts    # Tailwind config generator
  export.ts             # Project scaffold exporter
  logoTools.ts          # logo-design wrappers: validate, exec, envelope
skills/
  ui-designer/          # Reference docs + genre files (git submodule)
  color-palette-hunter/ # Palette CLI scripts (git submodule)
  motion-designer/      # Motion/physics heuristics (in-tree)
  logo-design/          # Logo/brand-mark design skill (in-tree, origin in ATTRIBUTION.md)
  video/                # Canonical upstream HyperFrames v0.8.77 packages (byte-stable)
test/
  designer-envelope.test.mjs  # envelope shape, side-effect contract
  logo-tools.test.mjs         # 30 checks: validation + real script subprocesses
scripts/
  prettier-hook.sh      # pre-commit formatter entry point
examples/
  ellis-ui/             # 24 design systems showcase (byte-stable, deployed as the demo)
```

Skills live here in two forms. `ui-designer` and `color-palette-hunter` are git submodules
pointing at standalone repos; `motion-designer` and `logo-design` are in-tree because they are
tied to this server's tools. See [Development](#development) for the rules that follow from that.

## Logo design (logo\_\* tools)

The `logo-design` skill lives in-tree at `skills/logo-design/` and is maintained here like any
other source. It began as a copy of
[kaankiziltug/logo-design-skill](https://github.com/kaankiziltug/logo-design-skill) (MIT; upstream
copyright and licence retained, origin and maintenance rules in
`skills/logo-design/ATTRIBUTION.md`). It ships the design workflow (brief → concepts → mark type →
SVG construction → optical refinement → testing → presentation → delivery), nine dependency-free
Python scripts (seven wrapped as tools, plus a shared `svglib` and a maintainer catalog builder),
fourteen reference docs, two templates, and a 1,432-mark SVG library. `skills/logo-design/HELA.md`
is the HeLa overlay: palettes must come from the token engine, logotypes ship as outlines, gradients
and filters are rejected, and rendering before presenting is mandatory.

Eight tools expose the scripts to an agent. All of them are read-only with respect to your source
artwork; the writers create new output files in the directory you name.

| Tool                      | What it does                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logo_audit`              | Audit SVGs: live text, rasters, filters, colour count, gradients, strokes, near-miss angles, tiny details, centring, complexity. JSON report.                                         |
| `logo_search_library`     | Query the 1,432-mark library by type, technique, geometry, subject, industry, colour, mood, type style, aspect. `summary` for category conventions, `format=paths` for files to open. |
| `logo_render`             | SVG → transparent PNG at exact sizes, HTML sheet → screenshot, and favicon.ico. This is how the agent looks at its own work.                                                          |
| `logo_renderers`          | Report which backends are installed (cairosvg, rsvg-convert, Inkscape, headless Chrome, Quick Look) before promising a PNG.                                                           |
| `logo_export_variants`    | Delivery set from a master SVG: black, white, one-colour, square, favicon, app-icon, plus `--web-icons` (favicon.ico + PNG set + webmanifest + `<head>` snippet).                     |
| `logo_concept_sheet`      | One-image concept overview with true 64/32/16 px renderings and a recommendation. Show this at the concept checkpoint, before building the kit.                                       |
| `logo_preview_sheet`      | HTML test sheet: size ladder, 16/32 px pixel test, backgrounds, one-colour, squint test, mirror/rotate, real contexts, and a shelf test against category competitors.                 |
| `logo_presentation_board` | Client-facing presentation from a JSON spec, with industry-specific mockups per concept; optional PNG export per slide.                                                               |

The design conversation itself still belongs to the skill. A typical run: `logo_search_library` to
study the category, then the skill's concept phase, then `logo_concept_sheet` to show three
directions, then — only after the user picks one — `logo_export_variants` for the delivery set,
gated on `logo_audit` and a rendered `logo_preview_sheet`.

```json
{
  "name": "logo_audit",
  "arguments": { "files": ["/tmp/concepts/acme-a.svg"], "bg": "#ffffff" }
}
```

Renderer notes: on a machine with only headless Chrome, `logo_render` still works for PNG output
and HTML screenshots, but favicon assembly and multi-size batches are slower. Run
`logo_renderers` first when a deliverable depends on it.

## Anti-Slop Design Philosophy

![Blotcat stamping the 35-gate checklist — HTML/CSS queued left, rejected crumpled right, score < 3 → revise](assets/blotcat-antislop.jpg)

- **Locked tokens** — every color/font references a named CSS variable, never inline values
- **No fabricated content** — real metrics or labeled placeholders only
- **No re-drawn chrome** — no fake browser bars, phone frames, or code window chrome
- **Typography purity** — headings always roman, no italic display faces
- **Structural variety** — different briefs produce structurally different pages
- **Mobile-responsiveness hard floor** — 320/375/414/768px, `overflow-x: clip`, `minmax(0, 1fr)`, no two-line clickable text
- **OKLCH-first** — all new tokens defined in OKLCH for perceptual uniformity
- **Motion with restraint** — animations are style-calibrated, spring-physics-grounded, and always gated on `prefers-reduced-motion`

## Configuration

| Variable                    | Default                       | Description                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UI_DESIGNER_SKILL_PATH`    | `skills/ui-designer`          | Path to the ui-designer skill references                                                                                                                                                                                                                                                                                                                                                                                |
| `COLOR_PALETTE_HUNTER_PATH` | `skills/color-palette-hunter` | Path to the color palette hunter skill                                                                                                                                                                                                                                                                                                                                                                                  |
| `LOGO_DESIGN_SKILL_PATH`    | `skills/logo-design`          | Path to the logo-design skill (its `scripts/` and `assets/library/` are required for the `logo_*` tools)                                                                                                                                                                                                                                                                                                                |
| `PYTHON_BIN`                | `python3`                     | Interpreter used to run the logo-design scripts                                                                                                                                                                                                                                                                                                                                                                         |
| `HELA_ENVELOPE`             | _unset = off_                 | Set to `true` to wrap tool results in the canonical HeLaResult envelope (`ok/summary/data/artifacts/provenance/warnings/sideEffects/execution`). The 29 design tools are pure reads so their `sideEffects` is empty; the `logo_*` wrappers declare `process:exec`, plus `file:write` for the five that emit deliverables. Off = byte-identical legacy output. Run/step ids propagate from `HELA_RUN_ID`/`HELA_STEP_ID`. |

## Configuring with AI Assistants

```json
{
  "mcpServers": {
    "designer-mcp": {
      "command": "node",
      "args": ["/path/to/designer-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## License

[MIT](LICENSE)
