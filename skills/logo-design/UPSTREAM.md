# Upstream

- **Source:** https://github.com/kaankiziltug/logo-design-skill
- **Vendored at:** `78511495c3f8388905141f0634c16472d9e5f30f` (2026-09-28)
- **License:** MIT — © 2026 kaankiziltug (verbatim in `LICENSE`)

Vendored as a copy (not a submodule) so the HeLa-specific overlay in `HELA.md` and the
`logo_*` MCP wrappers in `designer-mcp/src/logoTools.ts` can evolve independently of upstream.

To refresh from upstream, copy the skill directory over this one, re-apply `HELA.md` if it
was touched upstream, and re-run the `logo_*` tool tests — the wrappers depend on the exact
CLI surface of `scripts/*.py` (`--json`, `--format`, `-o`/`--out`, `--out-dir`, `--which`).

The logo library in `assets/library/svg/` contains real third-party brand marks for study
purposes only; see `HELA.md` § Provenance and licensing.
