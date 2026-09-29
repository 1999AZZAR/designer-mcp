# Attribution

This skill is HeLa's own. It began as a copy of
[kaankiziltug/logo-design-skill](https://github.com/kaankiziltug/logo-design-skill)
(MIT, © 2026 kaankiziltug, retained verbatim in `LICENSE`) and is now maintained in-tree
alongside `designer-mcp`, which exposes its scripts as the `logo_*` tools.

There is no upstream pin. Treat the workflow, the eleven scripts, the reference docs and the
SVG library as ordinary HeLa source: edit them, lint them with the repo's pre-commit hooks, and
keep the changes in this repository's history. If a future upstream release is worth pulling in,
diff it against this tree and port the interesting parts — do not overwrite `HELA.md`.

## What is ours to change

- `scripts/*.py` — the toolchain the `logo_*` MCP wrappers call. Its CLI surface is the
  wrappers' contract: `--json`, `--format`, `-o`/`--out`, `--out-dir`, `--which`, `--only`,
  `--web-icons`. Changing a flag means updating `src/logoTools.ts` and `test/logo-tools.test.mjs`
  in the same commit.
- `assets/library/` — the reference marks and the two generated indexes. `catalog.json` and
  `classifications.json` are rebuilt from the SVG sources with `scripts/build_catalog.py`; never
  hand-edit them, and never pretty-print them (pre-commit is configured to leave them alone).
- `HELA.md` — the HeLa overlay: token-bound palettes, outlined logotypes, no gradients or
  filters, render before presenting.
- `templates/`, `references/` — ours to extend.

## What must not change

- `LICENSE` and the attribution in this file. MIT requires the copyright notice and permission
  notice to travel with the software.
- The library's role: real third-party brand marks, for studying conventions and geometry.
  They are reference material — never copy one into a client's identity, and never present a
  library mark as generated output.

## Layout

```text
skills/logo-design/
  SKILL.md      # the workflow: discovery → concepts → mark type → SVG → test → present → deliver
  HELA.md       # HeLa overlay (read this before designing)
  LICENSE       # MIT, upstream copyright
  scripts/      # 7 CLI tools the MCP wraps + svglib.py + maintainer catalog builder
  references/   # 13 design references
  templates/    # brief + brand guidelines + presentation spec
  assets/library/  # ~1,400 reference marks + generated indexes
```
