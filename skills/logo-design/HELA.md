# HeLa overlay — logo-design

Upstream: https://github.com/kaankiziltug/logo-design-skill (MIT, © 2026 kaankiziltug),
vendored at upstream commit `78511495c3f8388905141f0634c16472d9e5f30f`. See `LICENSE` and
`UPSTREAM.md`. This overlay is what HeLa changes; the upstream workflow stays authoritative
unless a rule below overrides it.

## Provenance and licensing

- Keep the upstream `LICENSE` next to the skill and credit kaankiziltug when redistributing
  or when the skill's work is shown to a third party.
- The logo library under `assets/library/svg/` is reference material from real brands. Use it
  to study conventions and geometry — never copy a mark into a client's identity, and never
  claim a library mark as generated output.

## Same non-negotiables as the rest of the HeLa design stack

- **Look at your work.** After writing or editing any SVG, render it and view the PNG
  (`scripts/render_png.py`) before presenting it. Drawing in SVG code is drawing blind.
- **Concept checkpoint stays.** Design and Redesign runs pause after Phase 6 and show the
  concept sheet with one line per concept and a recommendation. Do not build the production
  kit (Phase 7) until the user picks a direction, unless they explicitly said "don't ask,
  just deliver".
- **Renderers are optional, never blocking.** If cairosvg, rsvg-convert, Inkscape and
  headless Chrome are all unavailable, say the render is unavailable, keep the geometry simple
  and explicit, and hand over the SVG — do not fake a preview.
- **No live assets at design time.** No fetching remote images, no embedding raster art, no
  CDN dependencies. Every deliverable is a self-contained SVG or a locally rendered PNG.

## Colour: bind the palette to HeLa tokens

- Take the brand palette from the `hela-phenotype` design system when one already exists:
  `generate_tokens` / `generate_palette_variants` / `palette_fetch` output, or a project
  `tokens.css`. Do not invent a second, conflicting palette.
- Emit colour as hex values the token system uses, and record the OKLCH coordinates in the
  brief alongside the hex so light/dark variants stay derivable.
- Always produce both modes: a colour mark plus its one-colour (mono) version, and confirm
  the mark reverses on a dark background. `--mono '#0F7C80'` in `export_variants.py` is the
  normal path.
- Never ship a mark whose meaning depends on a gradient or a filter. Filters and rasters are
  audit failures in `svg_audit.py`, not decoration.

## Typography

- Pick the typeface family from the same token system and name it explicitly in the brief.
- A logotype drawn as text must be converted to outlines (or ship with the outlined file)
  before delivery — live text is an audit failure. Keep the source text in a `<title>` or
  `<desc>` so the mark stays accessible and searchable.

## Deliverable checklist (in addition to upstream testing)

Beyond the upstream tests (16 px, one-colour, reversed, shelf test), a HeLa delivery is
complete when:

1. `scripts/svg_audit.py` passes with no live text, rasters, filters, or stray colour.
2. `scripts/preview_sheet.py` has been rendered and inspected in a browser or as a PNG.
3. `scripts/export_variants.py` has produced the black/white/mono, square, favicon and
   app-icon variants, plus `--web-icons` when the mark ships on the web.
4. Presentation uses `scripts/presentation_board.py` with industry-specific mockups — no
   generic placeholder frames.
5. Brand guidelines (`templates/brand-guidelines-template.md`) record the palette, type, clear
   space, minimum size, and misuse examples.

## MCP companions

The same scripts are exposed as `designer-mcp` tools for automation and batch work:
`logo_audit`, `logo_search_library`, `logo_render`, `logo_export_variants`,
`logo_concept_sheet`, `logo_preview_sheet`, `logo_presentation_board`, `logo_renderers`.
The MCP path is for producing and checking assets; the interactive design conversation still
belongs to the skill. Do not skip the checkpoint just because the tools are available.
