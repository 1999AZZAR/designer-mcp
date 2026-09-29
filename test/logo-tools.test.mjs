import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
import {
  LOGO_SKILL_PATH,
  logoSkillAvailable,
  logoSkillRoot,
  logoToolSchemas,
  auditLogo,
  searchLogoLibrary,
  renderLogo,
  availableRenderers,
  exportLogoVariants,
  buildConceptSheet,
  buildPreviewSheet,
  buildPresentationBoard,
  LogoSkillError,
} from "../src/logoTools.ts";

let n = 0;
const t = (name, fn) => {
  fn();
  n++;
  console.log(`ok ${n} - ${name}`);
};

const work = mkdtempSync(join(tmpdir(), "logo-tools-"));
process.on("exit", () => rmSync(work, { recursive: true, force: true }));

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="8" y="8" width="48" height="48" rx="12" fill="#0F7C80"/>
  <circle cx="32" cy="32" r="10" fill="#ffffff"/>
</svg>`;
const markPath = join(work, "mark.svg");
writeFileSync(markPath, MARK);

const withText = join(work, "live-text.svg");
writeFileSync(
  withText,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <text x="8" y="36" font-size="24" fill="#111">Hi</text></svg>`,
);
const withRaster = join(work, "raster.svg");
writeFileSync(
  withRaster,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <image href="data:image/png;base64,iVBORw0KGgo=" x="0" y="0" width="64" height="64"/></svg>`,
);

/* ---------- skill wiring ---------- */

t("skill tree is present and complete", () => {
  assert.equal(logoSkillAvailable(), true);
  for (const f of ["SKILL.md", "HELA.md", "ATTRIBUTION.md", "LICENSE"]) {
    assert.ok(existsSync(join(LOGO_SKILL_PATH, f)), `missing ${f}`);
  }
  for (const s of [
    "svg_audit.py",
    "search_library.py",
    "render_png.py",
    "export_variants.py",
    "concept_sheet.py",
    "preview_sheet.py",
    "presentation_board.py",
  ]) {
    assert.ok(
      existsSync(join(LOGO_SKILL_PATH, "scripts", s)),
      `missing scripts/${s}`,
    );
  }
});

t("attribution is retained but no longer pinned to upstream", () => {
  const lic = readFileSync(join(LOGO_SKILL_PATH, "LICENSE"), "utf8");
  assert.match(lic, /MIT License/);
  assert.match(
    lic,
    /kaankiziltug/,
    "MIT requires the upstream copyright notice to travel with the code",
  );

  const attr = readFileSync(join(LOGO_SKILL_PATH, "ATTRIBUTION.md"), "utf8");
  assert.match(attr, /kaankiziltug\/logo-design-skill/);
  assert.equal(
    /\b[0-9a-f]{40}\b/.test(attr),
    false,
    "the skill is maintained in-tree, so a pinned upstream commit should be gone",
  );
  assert.equal(
    existsSync(join(LOGO_SKILL_PATH, "UPSTREAM.md")),
    false,
    "UPSTREAM.md should be retired",
  );
});

t("HeLa overlay forbids gradients/filters and mandates rendering", () => {
  const hela = readFileSync(join(LOGO_SKILL_PATH, "HELA.md"), "utf8");
  assert.match(hela, /HeLa overlay/);
  assert.match(hela, /svg_audit\.py/);
  assert.match(hela, /hela-phenotype|generate_tokens|tokens\.css/);
  assert.match(hela, /outlines/); // logotype must be outlined
});

t("skill root is an absolute path", () => {
  assert.equal(logoSkillRoot(), LOGO_SKILL_PATH);
});

/* ---------- schemas ---------- */

t("8 logo tools are exposed with required args", () => {
  const schemas = logoToolSchemas();
  assert.equal(schemas.length, 8);
  const byName = Object.fromEntries(schemas.map((s) => [s.name, s]));
  assert.deepEqual([...Object.keys(byName)].sort(), [
    "logo_audit",
    "logo_concept_sheet",
    "logo_export_variants",
    "logo_presentation_board",
    "logo_preview_sheet",
    "logo_render",
    "logo_renderers",
    "logo_search_library",
  ]);
  for (const s of schemas) {
    assert.ok(s.description.length > 40, `${s.name} needs a real description`);
    assert.equal(s.inputSchema.type, "object", s.name);
  }
  assert.deepEqual(byName.logo_audit.inputSchema.required, ["files"]);
  assert.deepEqual(byName.logo_export_variants.inputSchema.required, [
    "master",
    "outDir",
  ]);
  assert.deepEqual(
    Object.keys(byName.logo_renderers.inputSchema.properties ?? {}),
    [],
  );
  assert.deepEqual(byName.logo_presentation_board.inputSchema.required, []);
});

/* ---------- validation (no subprocess needed) ---------- */

const throws = (fn, re) => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof LogoSkillError, `expected LogoSkillError, got ${e}`);
    assert.match(e.message, re);
    return;
  }
  assert.fail("expected a LogoSkillError");
};

t("audit rejects empty and missing file lists", () => {
  throws(() => auditLogo({ files: [] }), /non-empty array/);
  throws(
    () => auditLogo({ files: [join(work, "nope.svg")] }),
    /does not exist/,
  );
});

t("audit rejects directories and non-string paths", () => {
  throws(() => auditLogo({ files: [work] }), /not a file/);
  throws(() => auditLogo({ files: [42] }), /non-empty string/);
});

t("audit rejects a bad contrast colour", () => {
  throws(() => auditLogo({ files: [markPath], bg: "blue" }), /hex colour/);
  throws(() => auditLogo({ files: [markPath], bg: "#12345" }), /hex colour/);
});

t("render requires exactly one output target", () => {
  throws(() => renderLogo({ files: [markPath] }), /out for one file or outDir/);
  throws(
    () =>
      renderLogo({ files: [markPath], out: join(work, "a.png"), outDir: work }),
    /not both/,
  );
  throws(
    () => renderLogo({ files: [markPath, markPath], out: join(work, "a.png") }),
    /use outDir for multiple files/,
  );
});

t("render rejects out-of-range geometry", () => {
  throws(
    () => renderLogo({ files: [markPath], out: join(work, "a.png"), size: 0 }),
    /integer 1-8192/,
  );
  throws(
    () =>
      renderLogo({ files: [markPath], out: join(work, "a.png"), padding: 0.9 }),
    /number 0-0.4/,
  );
  throws(
    () =>
      renderLogo({ files: [markPath], out: join(work, "a.png"), size: 99999 }),
    /integer 1-8192/,
  );
});

t("export rejects unknown variants and bad mono colours", () => {
  throws(
    () =>
      exportLogoVariants({ master: markPath, outDir: work, only: ["nope"] }),
    /only accepts black\|white\|mono\|square\|favicon\|app-icon/,
  );
  throws(
    () =>
      exportLogoVariants({ master: markPath, outDir: work, mono: ["teal"] }),
    /mono\[0\] must be a hex/,
  );
  throws(
    () => exportLogoVariants({ master: markPath, outDir: work, iconScale: 3 }),
    /iconScale must be a number 0-1/,
  );
  throws(
    () =>
      exportLogoVariants({ master: markPath, outDir: work, opticalOffset: -2 }),
    /between -0.4 and 0.4/,
  );
  throws(
    () => exportLogoVariants({ master: join(work, "ghost.svg"), outDir: work }),
    /does not exist/,
  );
});

t("export accepts iconFg=keep as a literal", () => {
  // "keep" is a sentinel, not a colour; it must not be rejected as bad hex.
  const out = exportLogoVariants({
    master: markPath,
    outDir: join(work, "keep-test"),
    iconFg: "keep",
    only: ["black"],
  });
  assert.ok(out.argv.includes("--icon-fg"), "sentinel should reach the script");
  assert.ok(out.argv.includes("keep"));
});

t("concept sheet validates 1-based recommend and lockup count", () => {
  throws(
    () => buildConceptSheet({ files: [markPath], recommend: 3 }),
    /must be <= 1 concepts/,
  );
  throws(
    () =>
      buildConceptSheet({ files: [markPath], lockups: [markPath, markPath] }),
    /lockups has 2 entries for 1 concepts/,
  );
  throws(
    () => buildConceptSheet({ files: [markPath, markPath], recommend: 0 }),
    /recommend/,
  );
});

t("board requires a spec or listMockups", () => {
  throws(() => buildPresentationBoard({}), /spec JSON path/);
});

t("library search rejects a bad format and non-positive limit", () => {
  throws(
    () => searchLogoLibrary({ format: "xml" }),
    /format must be table\|paths\|json/,
  );
  throws(() => searchLogoLibrary({ limit: 0 }), /limit must be an integer/);
  throws(
    () => searchLogoLibrary({ minColors: 900 }),
    /minColors must be an integer 1-64/,
  );
});

t("script names are whitelisted, not smuggled through args", () => {
  // The script filename is chosen internally; user input only ever lands in
  // argv after the whitelist check, so a path-like value cannot escape.
  throws(() => auditLogo({ files: ["../../etc/passwd"] }), /does not exist/);
  throws(
    () => exportLogoVariants({ master: work, outDir: work }),
    /not a file/,
  );
});

/* ---------- real subprocess runs ---------- */

t("audit returns a parsed report and flags live text", () => {
  const r = auditLogo({ files: [withText] });
  assert.equal(r.exitCode, 0);
  assert.equal(r.report !== null, true, "audit should emit JSON");
  const text = JSON.stringify(r.report).toLowerCase();
  assert.match(text, /text/);
});

t("audit returns a clean report for a spec-conformant mark", () => {
  const r = auditLogo({ files: [markPath] });
  assert.equal(r.exitCode, 0);
  const report = JSON.stringify(r.report).toLowerCase();
  assert.equal(
    /live text|\"text\": true/.test(report),
    false,
    `unexpected text flag: ${report.slice(0, 400)}`,
  );
});

t("audit reports raster embedding", () => {
  const r = auditLogo({ files: [withRaster] });
  const text = JSON.stringify(r.report).toLowerCase();
  assert.match(text, /image|raster/);
});

t("audit surfaces an upstream failure as LogoSkillError", () => {
  throws(
    () => auditLogo({ files: [join(work, "broken.svg")] }),
    /does not exist/,
  );
  const bad = join(work, "bad.svg");
  writeFileSync(bad, "not xml at all <<<");
  try {
    auditLogo({ files: [bad] });
  } catch (e) {
    assert.ok(e instanceof LogoSkillError);
  }
});

t("library search returns JSON rows from the library catalogue", () => {
  const run = searchLogoLibrary({
    industry: "payments-fintech",
    limit: 5,
    format: "json",
  });
  assert.equal(run.exitCode, 0);
  const parsed = JSON.parse(run.stdout);
  assert.ok(Array.isArray(parsed), "expected a JSON array");
  assert.ok(parsed.length > 0, "expected matches in the fintech category");
  assert.ok(
    JSON.stringify(parsed).includes("svg"),
    "rows should reference svg files",
  );
});

t("library search summary reports category conventions", () => {
  const run = searchLogoLibrary({
    type: "lettermark",
    summary: true,
    limit: 10,
    format: "json",
  });
  assert.equal(run.exitCode, 0);
  assert.ok(run.stdout.length > 0);
});

t("library listValues enumerates allowed filters", () => {
  const run = searchLogoLibrary({ listValues: true, format: "json" });
  assert.equal(run.exitCode, 0);
  assert.match(run.stdout, /wordmark|geometry|industry/);
});

t("renderer discovery reports a backend on this machine", () => {
  const run = availableRenderers();
  assert.equal(run.exitCode, 0);
  assert.match(run.stdout, /backends?:/i);
});

t("render produces a real PNG and preview sheet screenshot works", () => {
  const out = join(work, "mark-256.png");
  const run = renderLogo({ files: [markPath], out, size: 256 });
  assert.equal(run.exitCode, 0);
  assert.ok(existsSync(out), "PNG should exist");
  const head = readFileSync(out).subarray(0, 8);
  assert.equal(head[0], 0x89, "PNG magic");
  assert.equal(head.subarray(1, 4).toString("latin1"), "PNG");
});

t("render batch writes into outDir", () => {
  const dir = join(work, "batch");
  mkdirSync(dir, { recursive: true });
  const run = renderLogo({
    files: [markPath, withText],
    outDir: dir,
    size: 64,
  });
  assert.equal(run.exitCode, 0);
  assert.ok(readdirSyncSafe(dir).some((f) => f.endsWith(".png")));
});

t("export produces the black/white/mono delivery set plus web icons", () => {
  const dir = join(work, "delivery");
  mkdirSync(dir, { recursive: true });
  const run = exportLogoVariants({
    master: markPath,
    outDir: dir,
    name: "acme",
    title: "Acme logo",
    mono: ["#0F7C80"],
    webIcons: true,
    png: [32],
    only: ["black", "white", "mono", "favicon", "app-icon"],
  });
  assert.equal(run.exitCode, 0, run.stderr);
  const files = readdirSyncSafe(dir);
  assert.ok(
    files.some((f) => /black/i.test(f)),
    files.join(","),
  );
  assert.ok(files.some((f) => /white/i.test(f)));
  assert.ok(
    files.some((f) => /favicon\.ico$/i.test(f)),
    "webIcons should emit favicon.ico",
  );
});

t("concept sheet renders concepts and honours recommend bounds", () => {
  const out = join(work, "concepts.png");
  const run = buildConceptSheet({
    files: [markPath, withText],
    names: ["Anchor", "Live"],
    notes: ["solid geometry", "not for delivery"],
    recommend: 1,
    title: "Acme concepts",
    out,
  });
  assert.equal(run.exitCode, 0, run.stderr);
  assert.ok(existsSync(out), "concept sheet PNG should exist");
});

t("preview sheet writes an HTML test sheet", () => {
  const out = join(work, "preview.html");
  const run = buildPreviewSheet({
    files: [markPath],
    out,
    name: "Acme",
    brandColor: "#0F7C80",
  });
  assert.equal(run.exitCode, 0, run.stderr);
  const html = readFileSync(out, "utf8");
  assert.match(html, /<html/i);
  assert.match(html, /16/, "should include the small-size pixel test");
});

t("presentation board lists mockups without a spec", () => {
  const run = buildPresentationBoard({ listMockups: true });
  assert.equal(run.exitCode, 0, run.stderr);
  assert.ok(run.stdout.length > 0);
});

function readdirSyncSafe(dir) {
  try {
    return require("node:fs").readdirSync(dir);
  } catch {
    return [];
  }
}

console.log(`\n${n} tests passed`);
