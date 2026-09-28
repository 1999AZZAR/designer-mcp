import { existsSync, statSync } from "fs";
import { dirname, isAbsolute, join, resolve } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const LOGO_SKILL_PATH =
  process.env['LOGO_DESIGN_SKILL_PATH'] ??
  join(__dirname, "..", "skills", "logo-design");

const SCRIPTS = join(LOGO_SKILL_PATH, "scripts");

/** Upstream scripts: audience-visible renderers vs fast pure-analysis ones. */
const SLOW_SCRIPTS = new Set(["render_png.py", "concept_sheet.py", "presentation_board.py"]);
const DEFAULT_TIMEOUT = 60_000;
const SLOW_TIMEOUT = 180_000;
const MAX_INPUT_FILES = 24;

export interface LogoRunResult {
  script: string;
  argv: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export class LogoSkillError extends Error {}

function scriptPath(script: string): string {
  if (!/^[a-z_]+\.py$/.test(script)) {
    throw new LogoSkillError(`Illegal script name: ${script}`);
  }
  const p = join(SCRIPTS, script);
  if (!existsSync(p)) {
    throw new LogoSkillError(
      `logo-design skill not found at ${LOGO_SKILL_PATH} (missing scripts/${script}). ` +
      `Set LOGO_DESIGN_SKILL_PATH to override.`
    );
  }
  return p;
}

export function logoSkillAvailable(): boolean {
  return existsSync(join(SCRIPTS, "svg_audit.py"));
}

function requireFiles(files: unknown, label: string): string[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new LogoSkillError(`${label} must be a non-empty array of file paths`);
  }
  if (files.length > MAX_INPUT_FILES) {
    throw new LogoSkillError(`${label} accepts at most ${MAX_INPUT_FILES} paths (got ${files.length})`);
  }
  return files.map((f, i) => requireExistingFile(f, `${label}[${i}]`));
}

function requireExistingFile(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new LogoSkillError(`${label} must be a non-empty string path`);
  }
  const p = resolve(value);
  if (!existsSync(p)) throw new LogoSkillError(`${label} does not exist: ${value}`);
  if (!statSync(p).isFile()) throw new LogoSkillError(`${label} is not a file: ${value}`);
  return p;
}

function requireDir(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new LogoSkillError(`${label} must be a non-empty string path`);
  }
  const p = resolve(value);
  if (existsSync(p) && !statSync(p).isDirectory()) {
    throw new LogoSkillError(`${label} is not a directory: ${value}`);
  }
  return p;
}

function positiveInt(value: unknown, label: string, max = 10_000): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > max) {
    throw new LogoSkillError(`${label} must be an integer 1-${max} (got ${value})`);
  }
  return n;
}

function unitFloat(value: unknown, label: string, max = 1): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) {
    throw new LogoSkillError(`${label} must be a number 0-${max} (got ${value})`);
  }
  return n;
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function color(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !HEX.test(value.trim())) {
    throw new LogoSkillError(`${label} must be a hex colour like #111111 or #0f7c80 (got ${value})`);
  }
  return value.trim();
}

function flag(value: unknown, label: string): string[] {
  return value === true ? [label] : [];
}

function runScript(script: string, args: string[]): LogoRunResult {
  const exe = process.env['PYTHON_BIN'] ?? "python3";
  const timeout = SLOW_SCRIPTS.has(script) ? SLOW_TIMEOUT : DEFAULT_TIMEOUT;
  const started = Date.now();
  const res = spawnSync(exe, [scriptPath(script), ...args], {
    encoding: "utf8",
    timeout,
    maxBuffer: 16 * 1024 * 1024,
    cwd: LOGO_SKILL_PATH,
  });
  const result: LogoRunResult = {
    script: `scripts/${script}`,
    argv: args,
    exitCode: res.status ?? -1,
    stdout: (res.stdout ?? "").trim(),
    stderr: (res.stderr ?? "").trim(),
    durationMs: Date.now() - started,
  };
  if (res.error) {
    const kind = (res.error as NodeJS.ErrnoException).code;
    throw new LogoSkillError(
      kind === "ETIMEDOUT"
        ? `${script} timed out after ${timeout / 1000}s`
        : `${script} could not run: ${(res.error as Error).message}`
    );
  }
  if (result.exitCode !== 0) {
    const detail = result.stderr || result.stdout || `exit code ${result.exitCode}`;
    throw new LogoSkillError(`${script} failed: ${detail.slice(0, 1500)}`);
  }
  return result;
}

/* ------------------------------- tools ------------------------------- */

export interface LogoAuditInput {
  files: string[];
  bg?: string;
}

export function auditLogo(input: LogoAuditInput): unknown {
  const files = requireFiles(input.files, "files");
  const argv = [...files, "--json"];
  const bg = color(input.bg, "bg");
  if (bg) argv.push("--bg", bg);
  const run = runScript("svg_audit.py", argv);
  try {
    return { ...run, report: JSON.parse(run.stdout) };
  } catch {
    return { ...run, report: null, note: "audit output was not valid JSON" };
  }
}

const LIBRARY_FILTERS = [
  "type", "symbol-type", "technique", "geometry", "industry", "subject", "query",
  "mood", "color", "primary-color", "aspect", "variant", "type-style", "case",
] as const;

export interface LogoLibrarySearchInput {
  type?: string;
  symbolType?: string;
  technique?: string;
  geometry?: string;
  industry?: string;
  subject?: string;
  query?: string;
  mood?: string;
  color?: string;
  primaryColor?: string;
  aspect?: string;
  variant?: string;
  typeStyle?: string;
  case?: string;
  minColors?: number;
  maxColors?: number;
  noGradient?: boolean;
  exemplary?: boolean;
  limit?: number;
  format?: "table" | "paths" | "json";
  summary?: boolean;
  listValues?: boolean;
}

const FILTER_KEYS: Record<string, string> = {
  type: "--type", symbolType: "--symbol-type", technique: "--technique",
  geometry: "--geometry", industry: "--industry", subject: "--subject",
  query: "--query", mood: "--mood", color: "--color",
  primaryColor: "--primary-color", aspect: "--aspect", variant: "--variant",
  typeStyle: "--type-style", case: "--case",
};

export function searchLogoLibrary(input: LogoLibrarySearchInput): LogoRunResult {
  const argv: string[] = [];
  for (const key of LIBRARY_FILTERS) {
    const value = (input as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) {
      argv.push(FILTER_KEYS[key], String(value));
    }
  }
  const min = positiveInt(input.minColors, "minColors", 64);
  const max = positiveInt(input.maxColors, "maxColors", 64);
  if (min) argv.push("--min-colors", String(min));
  if (max) argv.push("--max-colors", String(max));
  argv.push(...flag(input.noGradient, "--no-gradient"));
  argv.push(...flag(input.exemplary, "--exemplary"));
  argv.push(...flag(input.summary, "--summary"));
  argv.push(...flag(input.listValues, "--list-values"));
  const limit = positiveInt(input.limit, "limit", 500) ?? 25;
  const format = input.format ?? "json";
  if (!["table", "paths", "json"].includes(format)) {
    throw new LogoSkillError(`format must be table|paths|json (got ${format})`);
  }
  argv.push("--limit", String(limit), "--format", format);
  return runScript("search_library.py", argv);
}

export interface LogoRenderInput {
  files: string[];
  out?: string;
  outDir?: string;
  size?: number;
  width?: number;
  height?: number;
  padding?: number;
  bg?: string;
  backend?: string;
  ico?: string;
  icoSizes?: number[];
}

export function renderLogo(input: LogoRenderInput): LogoRunResult {
  const files = requireFiles(input.files, "files");
  if (input.out && input.outDir) {
    throw new LogoSkillError("Use either out (single file) or outDir (batch), not both");
  }
  if (input.out && files.length > 1) {
    throw new LogoSkillError("out writes a single PNG; use outDir for multiple files");
  }
  if (!input.out && !input.outDir) {
    throw new LogoSkillError("An output path is required: set out for one file or outDir for a batch");
  }
  const argv = [...files];
  if (input.out) argv.push("-o", resolve(input.out));
  if (input.outDir) argv.push("--out-dir", requireDir(input.outDir, "outDir"));
  const size = positiveInt(input.size, "size", 8192);
  if (size) argv.push("--size", String(size));
  const width = positiveInt(input.width, "width", 16_384);
  if (width) argv.push("--width", String(width));
  const height = positiveInt(input.height, "height", 16_384);
  if (height) argv.push("--height", String(height));
  const padding = unitFloat(input.padding, "padding", 0.4);
  if (padding !== undefined) argv.push("--padding", String(padding));
  const bg = color(input.bg, "bg");
  if (bg) argv.push("--bg", bg);
  if (input.backend) argv.push("--backend", String(input.backend));
  const ico = input.ico ? resolve(requireExistingFile(input.ico, "ico")) : undefined;
  if (ico) argv.push("--ico", ico);
  if (input.icoSizes) {
    for (const s of input.icoSizes) argv.push("--ico-sizes", String(positiveInt(s, "icoSizes entry", 256)));
  }
  return runScript("render_png.py", argv);
}

export function availableRenderers(): LogoRunResult {
  return runScript("render_png.py", ["--which"]);
}

export interface LogoExportInput {
  master: string;
  outDir: string;
  name?: string;
  title?: string;
  mono?: string[];
  iconBg?: string;
  iconFg?: string;
  iconScale?: number;
  opticalOffset?: number;
  faviconSource?: string;
  keepWhite?: boolean;
  only?: string[];
  png?: number[];
  webIcons?: boolean;
}

const ONLY_VARIANTS = ["black", "white", "mono", "square", "favicon", "app-icon"];

export function exportLogoVariants(input: LogoExportInput): LogoRunResult {
  const master = requireExistingFile(input.master, "master");
  const argv = [master, "--out-dir", requireDir(input.outDir, "outDir")];
  if (input.name !== undefined) argv.push("--name", input.name);
  if (input.title !== undefined) argv.push("--title", input.title);
  for (const [i, m] of (input.mono ?? []).entries()) argv.push("--mono", color(m, `mono[${i}]`)!);
  const iconBg = color(input.iconBg, "iconBg");
  if (iconBg) argv.push("--icon-bg", iconBg);
  const iconFg = input.iconFg === "keep" ? "keep" : color(input.iconFg, "iconFg");
  if (iconFg) argv.push("--icon-fg", iconFg);
  const scale = unitFloat(input.iconScale, "iconScale", 1);
  if (scale !== undefined) argv.push("--icon-scale", String(scale));
  const offset = input.opticalOffset === undefined
    ? undefined
    : Number(input.opticalOffset);
  if (offset !== undefined) {
    if (!Number.isFinite(offset) || Math.abs(offset) > 0.4) {
      throw new LogoSkillError(`opticalOffset must be between -0.4 and 0.4 (got ${input.opticalOffset})`);
    }
    argv.push("--optical-offset", String(offset));
  }
  if (input.faviconSource) {
    argv.push("--favicon-source", requireExistingFile(input.faviconSource, "faviconSource"));
  }
  argv.push(...flag(input.keepWhite, "--keep-white"));
  if (input.only) {
    const bad = input.only.filter((v) => !ONLY_VARIANTS.includes(v));
    if (bad.length) {
      throw new LogoSkillError(`only accepts ${ONLY_VARIANTS.join("|")} (got ${bad.join(", ")})`);
    }
    if (input.only.length) argv.push("--only", ...input.only);
  }
  if (input.png) {
    for (const s of input.png) argv.push("--png", String(positiveInt(s, "png entry", 4096)));
  }
  argv.push(...flag(input.webIcons, "--web-icons"));
  return runScript("export_variants.py", argv);
}

export interface LogoConceptSheetInput {
  files: string[];
  lockups?: string[];
  names?: string[];
  notes?: string[];
  title?: string;
  subtitle?: string;
  recommend?: number;
  greyscale?: boolean;
  out?: string;
}

export function buildConceptSheet(input: LogoConceptSheetInput): LogoRunResult {
  const files = requireFiles(input.files, "files");
  if (input.lockups && input.lockups.length > files.length) {
    throw new LogoSkillError(`lockups has ${input.lockups.length} entries for ${files.length} concepts`);
  }
  const argv = [...files];
  const lockups = input.lockups ? requireFiles(input.lockups, "lockups") : [];
  if (lockups.length) argv.push("--lockups", ...lockups);
  (input.names ?? []).forEach((n, i) => argv.push("--names", String(n ?? `Concept ${i + 1}`)));
  (input.notes ?? []).forEach((n) => argv.push("--notes", String(n)));
  if (input.title) argv.push("--title", input.title);
  if (input.subtitle) argv.push("--subtitle", input.subtitle);
  if (input.recommend !== undefined) {
    const n = positiveInt(input.recommend, "recommend", 999)!;
    if (n > files.length) {
      throw new LogoSkillError(`recommend is 1-based and must be <= ${files.length} concepts (got ${n})`);
    }
    argv.push("--recommend", String(n));
  }
  argv.push(...flag(input.greyscale, "--greyscale"));
  const out = input.out ? resolve(input.out) : join(process.cwd(), "concepts.png");
  argv.push("-o", out);
  return runScript("concept_sheet.py", argv);
}

export interface LogoPreviewSheetInput {
  files: string[];
  out?: string;
  name?: string;
  names?: string[];
  brandColor?: string;
  refs?: string[];
  refsIndustry?: string;
  refsCount?: number;
  compareOnly?: boolean;
}

export function buildPreviewSheet(input: LogoPreviewSheetInput): LogoRunResult {
  const files = requireFiles(input.files, "files");
  const argv = [...files];
  argv.push("-o", input.out ? resolve(input.out) : join(process.cwd(), "logo-preview.html"));
  if (input.name) argv.push("--name", input.name);
  for (const n of input.names ?? []) argv.push("--names", n);
  const brandColor = color(input.brandColor, "brandColor");
  if (brandColor) argv.push("--brand-color", brandColor);
  const refs = input.refs ? requireFiles(input.refs, "refs") : [];
  if (refs.length) argv.push("--refs", ...refs);
  if (input.refsIndustry) argv.push("--refs-industry", input.refsIndustry);
  const refsCount = positiveInt(input.refsCount, "refsCount", 100);
  if (refsCount) argv.push("--refs-count", String(refsCount));
  argv.push(...flag(input.compareOnly, "--compare-only"));
  return runScript("preview_sheet.py", argv);
}

export interface LogoBoardInput {
  spec?: string;
  out?: string;
  listMockups?: boolean;
  pngDir?: string;
}

export function buildPresentationBoard(input: LogoBoardInput): LogoRunResult {
  const argv: string[] = [];
  if (input.spec) argv.push(requireExistingFile(input.spec, "spec"));
  if (input.out) argv.push("-o", resolve(input.out));
  argv.push(...flag(input.listMockups, "--list-mockups"));
  if (input.pngDir) argv.push("--png-dir", requireDir(input.pngDir, "pngDir"));
  if (argv.length === 0) {
    throw new LogoSkillError("Provide a spec JSON path, or set listMockups to inspect the available mockups");
  }
  return runScript("presentation_board.py", argv);
}

export function logoSkillRoot(): string {
  return isAbsolute(LOGO_SKILL_PATH) ? LOGO_SKILL_PATH : resolve(LOGO_SKILL_PATH);
}

const filesSchema = (desc: string) => ({
  type: "array",
  items: { type: "string" },
  description: desc,
});

/** Tool schemas for the logo_* wrappers, kept next to their implementations. */
export function logoToolSchemas() {
  return [
    {
      name: "logo_audit",
      description: "Audit one or more logo SVGs: live text, rasters, filters, colour count, gradients, strokes, near-miss angles, tiny details, centring, and complexity versus the reference library. Run this before delivering any mark.",
      inputSchema: {
        type: "object",
        properties: {
          files: filesSchema("Paths to the SVG file(s) to audit."),
          bg: { type: "string", description: "Background colour to test contrast against, e.g. '#ffffff'." },
        },
        required: ["files"],
      },
    },
    {
      name: "logo_search_library",
      description: "Search the vendored library of 1,400+ real-world SVG logos by mark type, technique, geometry, subject, industry, colour, mood, type style and more. Use --summary semantics (summary=true) to learn a category's conventions, format='paths' to get files to open.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "wordmark|lettermark|letterform|pictorial|abstract|mascot|emblem|combination" },
          symbolType: { type: "string", description: "Symbol type inside a combination mark" },
          technique: { type: "string", description: "e.g. negative-space, geometric-construction, letter-substitution (comma = AND)" },
          geometry: { type: "string", description: "e.g. circle, hexagon, triangle, organic (comma = AND)" },
          industry: { type: "string", description: "e.g. developer-tools, payments-fintech, database-data" },
          subject: { type: "string", description: "Substring of the visual subject, e.g. bird, shield, cloud" },
          query: { type: "string", description: "Free-text words matched against file name, subject, note, mood" },
          mood: { type: "string", description: "Single mood adjective, e.g. friendly, technical, playful" },
          color: { type: "string", description: "Colour family present anywhere: red|orange|yellow|green|cyan|blue|purple|pink|black|white|gray" },
          primaryColor: { type: "string", description: "Dominant family: a hue, 'multi' or 'mono'" },
          aspect: { type: "string", description: "square|wide|horizontal|extra-wide|tall" },
          variant: { type: "string", description: "main|icon" },
          typeStyle: { type: "string", description: "geometric-sans|grotesque-sans|humanist-sans|rounded-sans|serif|slab|script|display-custom|monospace" },
          case: { type: "string", description: "lowercase|uppercase|titlecase|mixed" },
          minColors: { type: "number", description: "Minimum distinct colour count" },
          maxColors: { type: "number", description: "Maximum distinct colour count" },
          noGradient: { type: "boolean", description: "Only marks with no gradient" },
          exemplary: { type: "boolean", description: "Only strong teaching examples" },
          limit: { type: "number", description: "Max results (default 25)" },
          format: { type: "string", enum: ["table", "paths", "json"], description: "Output shape (default json)" },
          summary: { type: "boolean", description: "Aggregate view: conventions of the matching set" },
          listValues: { type: "boolean", description: "Print allowed values for every filter" },
        },
        required: [],
      },
    },
    {
      name: "logo_renderers",
      description: "List which SVG rendering backends are available on this machine (cairosvg, rsvg-convert, Inkscape, headless Chrome, macOS Quick Look). Use before promising a PNG deliverable.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "logo_render",
      description: "Render logo SVG to transparent PNG at exact sizes, screenshot an HTML sheet, or build a favicon.ico. This is how you look at your own work — render, then view the PNG.",
      inputSchema: {
        type: "object",
        properties: {
          files: filesSchema("SVG files to render, or an HTML sheet to screenshot."),
          out: { type: "string", description: "Output PNG path (single input only)" },
          outDir: { type: "string", description: "Output folder for a batch" },
          size: { type: "number", description: "Square size in px" },
          width: { type: "number", description: "Output width in px" },
          height: { type: "number", description: "Output height in px" },
          padding: { type: "number", description: "Padding as a fraction of the canvas (0-0.4)" },
          bg: { type: "string", description: "Background colour (default transparent)" },
          backend: { type: "string", description: "Force a backend, e.g. chrome" },
          ico: { type: "string", description: "Write a favicon .ico from the first input" },
          icoSizes: { type: "array", items: { type: "number" }, description: "ICO sizes, e.g. [16,32,48]" },
        },
        required: ["files"],
      },
    },
    {
      name: "logo_export_variants",
      description: "From a master logo SVG, produce the delivery set: black, white, one-colour, square, favicon and app-icon variants, optional PNG sizes, and --web-icons (favicon.ico + PNG icon set + webmanifest + <head> snippet).",
      inputSchema: {
        type: "object",
        properties: {
          master: { type: "string", description: "Path to the master logo SVG" },
          outDir: { type: "string", description: "Output directory" },
          name: { type: "string", description: "Base name for outputs (default: master file name)" },
          title: { type: "string", description: "Accessible <title> for every output, e.g. 'Harbor logo'" },
          mono: { type: "array", items: { type: "string" }, description: "Extra one-colour versions as hex, e.g. ['#0F7C80']" },
          iconBg: { type: "string", description: "App-icon / maskable tile colour (default #111111)" },
          iconFg: { type: "string", description: "Mark colour on tiles, or 'keep' for original colours" },
          iconScale: { type: "number", description: "Mark size on the app-icon tile, 0.55-0.7 typical" },
          opticalOffset: { type: "number", description: "Vertical nudge for square outputs, -0.4 to 0.4 (negative = up)" },
          faviconSource: { type: "string", description: "Simplified small-size drawing used for favicon/app-icon/web icons" },
          keepWhite: { type: "boolean", description: "Leave pure-white paint untouched in one-colour versions" },
          only: { type: "array", items: { type: "string" }, description: "Subset: black, white, mono, square, favicon, app-icon" },
          png: { type: "array", items: { type: "number" }, description: "PNG sizes for every SVG variant written" },
          webIcons: { type: "boolean", description: "Also emit favicon.ico + PNG icon set + webmanifest + head snippet" },
        },
        required: ["master", "outDir"],
      },
    },
    {
      name: "logo_concept_sheet",
      description: "One-image concept overview: large mark, lockup, true 64/32/16 px sizes, name, one-line idea and recommendation per concept. This is the artefact to show at the concept checkpoint, before building the production kit.",
      inputSchema: {
        type: "object",
        properties: {
          files: filesSchema("One SVG per concept (usually the symbol)."),
          lockups: { type: "array", items: { type: "string" }, description: "Optional second file per concept (lockup/wordmark)" },
          names: { type: "array", items: { type: "string" }, description: "Name per concept" },
          notes: { type: "array", items: { type: "string" }, description: "One-sentence idea per concept" },
          title: { type: "string", description: "Sheet title" },
          subtitle: { type: "string", description: "Sheet subtitle" },
          recommend: { type: "number", description: "1-based index of the recommended concept" },
          greyscale: { type: "boolean", description: "Show everything in greyscale (first-round rule)" },
          out: { type: "string", description: "Output PNG path (default ./concepts.png)" },
        },
        required: ["files"],
      },
    },
    {
      name: "logo_preview_sheet",
      description: "HTML test sheet for a logo: size ladder, 16/32 px pixel test, backgrounds, one-colour, squint blur, mirror/rotate, favicon/app-icon/header/card contexts, side-by-side, and a shelf test versus category competitors.",
      inputSchema: {
        type: "object",
        properties: {
          files: filesSchema("Logo SVG(s) to test."),
          out: { type: "string", description: "Output HTML path (default ./logo-preview.html)" },
          name: { type: "string", description: "Brand name used in mock contexts" },
          names: { type: "array", items: { type: "string" }, description: "Labels per file" },
          brandColor: { type: "string", description: "Brand colour for background/app-icon tests" },
          refs: { type: "array", items: { type: "string" }, description: "Reference SVGs for the shelf test" },
          refsIndustry: { type: "string", description: "Pull shelf references from the library by industry" },
          refsCount: { type: "number", description: "How many shelf references (default 11)" },
          compareOnly: { type: "boolean", description: "Only the side-by-side section" },
        },
        required: ["files"],
      },
    },
    {
      name: "logo_presentation_board",
      description: "Client presentation from a JSON spec: brief, each concept with rationale and industry-specific mockups, comparison, recommendation. Exports HTML, or every slide as PNG with pngDir.",
      inputSchema: {
        type: "object",
        properties: {
          spec: { type: "string", description: "Path to a presentation spec JSON (see skills/logo-design/templates/presentation-spec.example.json)" },
          out: { type: "string", description: "Output HTML path (default presentation.html)" },
          pngDir: { type: "string", description: "Also export every slide as slide-NN.png (needs Chrome/Chromium)" },
          listMockups: { type: "boolean", description: "List available industry mockups and exit" },
        },
        required: [],
      },
    },
  ];
}
