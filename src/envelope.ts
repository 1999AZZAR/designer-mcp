/**
 * C1 provider-side HeLaResult envelope (self-contained mirror of the canonical
 * shape in chaining-mcp/src/agent/hela-result.ts; this repo is a standalone
 * package and must not import across repos).
 *
 * Flag-gated: set HELA_ENVELOPE=true to wrap tool payloads in the canonical
 * HelaResult envelope. Default (unset/anything else) returns the legacy raw
 * payload byte-for-byte identical to before.
 */

export interface HelaArtifactRef {
  uri: string;
  sha256?: string;
  size?: number;
  media_type?: string;
}

export interface HelaProvenanceRef {
  source: string;
  retrieved_at?: string;
  confidence?: number;
  freshness?: string;
}

export interface HelaRedaction {
  applied: boolean;
  fields: string[];
}

export interface HelaExecutionMeta {
  serverName?: string;
  toolName?: string;
  run_id?: string;
  step_id?: string;
  attempt?: number;
  executionTimeMs?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface HelaResult<T = unknown> {
  ok: boolean;
  summary: string;
  /** Canonical payload field. */
  data: T;
  artifacts: HelaArtifactRef[];
  provenance: HelaProvenanceRef[];
  warnings: string[];
  sideEffects: string[];
  execution: HelaExecutionMeta;
  redaction: HelaRedaction;
  error?: string;
}

export const SERVER_NAME = "the-designer";

/**
 * Design tools are pure generation / read-only lookups and declare no side
 * effects. The `logo_*` wrappers are the exception: they shell out to the
 * logo-design skill's Python scripts, which write SVG/PNG/HTML output files,
 * so those declare `file:write` and `process:exec` explicitly.
 */
export const TOOL_SIDE_EFFECTS: Record<string, string[]> = {
  generate_rules: [],
  list_options: [],
  validate_combo: [],
  list_ellis_ui_designs: [],
  get_ellis_ui_template: [],
  get_reference: [],
  palette_fetch: [],
  palette_convert: [],
  brand_fetch_design_md: [],
  evaluate_style: [],
  list_installed_skills: [],
  export_project: [],
  generate_palette_variants: [],
  get_cross_cutting_rules: [],
  get_component: [],
  audit_accessibility: [],
  generate_css_output: [],
  generate_template: [],
  generate_tailwind_config: [],
  brand_list: [],
  pre_flight_scan: [],
  anti_pattern_check: [],
  self_critique: [],
  generate_tokens: [],
  list_themes: [],
  detect_genre: [],
  generate_8state_component: [],
  build_custom_tokens: [],
  generate_motion_snippet: [],
  logo_audit: ["process:exec"],
  logo_search_library: ["process:exec"],
  logo_renderers: ["process:exec"],
  logo_render: ["process:exec", "file:write"],
  logo_export_variants: ["process:exec", "file:write"],
  logo_concept_sheet: ["process:exec", "file:write"],
  logo_preview_sheet: ["process:exec", "file:write"],
  logo_presentation_board: ["process:exec", "file:write"],
};

export function isEnvelopeEnabled(): boolean {
  return process.env["HELA_ENVELOPE"] === "true";
}

function baseExecution(toolName: string): HelaExecutionMeta {
  const runId = process.env["HELA_RUN_ID"];
  const stepId = process.env["HELA_STEP_ID"];
  const meta: HelaExecutionMeta = {
    serverName: SERVER_NAME,
    toolName,
    completedAt: new Date().toISOString(),
  };
  if (runId !== undefined) meta.run_id = runId;
  if (stepId !== undefined) meta.step_id = stepId;
  return meta;
}

export function wrapResult<T>(
  toolName: string,
  data: T,
  summary?: string,
): HelaResult<T> {
  return {
    ok: true,
    summary: summary || `${toolName} ok`,
    data,
    artifacts: [],
    provenance: [],
    warnings: [],
    sideEffects: TOOL_SIDE_EFFECTS[toolName] || [],
    execution: baseExecution(toolName),
    redaction: { applied: false, fields: [] },
  };
}

export function wrapError(toolName: string, message: string): HelaResult<null> {
  return {
    ok: false,
    summary: `${toolName} failed: ${message}`,
    data: null,
    artifacts: [],
    provenance: [],
    warnings: [],
    sideEffects: TOOL_SIDE_EFFECTS[toolName] || [],
    execution: baseExecution(toolName),
    redaction: { applied: false, fields: [] },
    error: message,
  };
}

function textBlock(text: string): {
  content: Array<{ type: string; text: string }>;
} {
  return { content: [{ type: "text", text }] };
}

/**
 * MCP tool-result responder. Envelope off (default): legacy raw text,
 * byte-identical to the pre-C1 call sites.
 */
import { existsSync, realpathSync, statSync } from "fs";
import { isAbsolute, relative, resolve } from "path";

export class PathContainmentError extends Error {
  readonly code = "PATH_NOT_CONTAINED";
}

/**
 * Resolve a caller-supplied name inside a trusted directory, refusing anything
 * that could escape it.
 *
 * Tool arguments that name a file inside a bundled skill (a reference doc, a
 * template) must never be able to walk out of that skill. Three independent
 * checks, because one is not enough:
 *   1. lexical   - no separators, no `..`, not absolute, no NUL
 *   2. realpath  - the root's real path is the base, so a symlinked root
 *                  cannot silently widen the boundary
 *   3. relative  - the resolved path must still sit under that base
 *
 * Tools whose whole purpose is to read a path the caller chose
 * (`pre_flight_scan`, the `logo_*` wrappers) intentionally do not use this: a
 * supplied project directory or artwork file is the feature, not a leak.
 */
export function resolveWithinRoot(
  rootDir: string,
  userInput: string,
  opts: { label: string; extension?: string; kind?: "file" | "dir" } = {
    label: "path",
  },
): string {
  const { label, extension, kind = "file" } = opts;
  if (typeof userInput !== "string" || userInput.trim() === "") {
    throw new PathContainmentError(`${label} must be a non-empty string`);
  }
  const name = userInput.trim();
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new PathContainmentError(
      `${label} must be a bare file name, not a path: ${JSON.stringify(name)}`,
    );
  }
  if (
    isAbsolute(name) ||
    name === "." ||
    name === ".." ||
    name.startsWith("..")
  ) {
    throw new PathContainmentError(
      `${label} must not be an absolute or traversing path: ${JSON.stringify(name)}`,
    );
  }
  if (!existsSync(rootDir)) {
    throw new PathContainmentError(`trusted root is missing: ${rootDir}`);
  }
  const base = realpathSync(rootDir);
  const target = resolve(base, extension ? `${name}${extension}` : name);
  const rel = relative(base, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new PathContainmentError(`${label} escapes the allowed directory`);
  }
  // Final target must not be a symlink pointing outside the root either.
  if (existsSync(target)) {
    const real = realpathSync(target);
    const realRel = relative(base, real);
    if (realRel === "" || realRel.startsWith("..") || isAbsolute(realRel)) {
      throw new PathContainmentError(
        `${label} resolves outside the allowed directory`,
      );
    }
    if (kind === "file" && !statSync(real).isFile()) {
      throw new PathContainmentError(`${label} is not a file: ${userInput}`);
    }
    if (kind === "dir" && !statSync(real).isDirectory()) {
      throw new PathContainmentError(
        `${label} is not a directory: ${userInput}`,
      );
    }
  }
  return target;
}

export function textResult(toolName: string, text: string, summary?: string) {
  if (!isEnvelopeEnabled()) return textBlock(text);
  return textBlock(
    JSON.stringify(wrapResult(toolName, text, summary), null, 2),
  );
}

/**
 * MCP error responder. Envelope off (default): legacy `Error: <msg>` text +
 * isError preserved exactly. Envelope on: proper HelaResult with ok:false.
 */
export function errorResult(toolName: string, message: string) {
  if (!isEnvelopeEnabled()) {
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
  return {
    ...textBlock(JSON.stringify(wrapError(toolName, message), null, 2)),
    isError: true,
  };
}
