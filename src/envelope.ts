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

export const SERVER_NAME = 'the-designer';

/**
 * All designer tools are pure generation / read-only lookups (no mutation),
 * so every tool declares no side effects.
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
};

export function isEnvelopeEnabled(): boolean {
  return process.env['HELA_ENVELOPE'] === 'true';
}

function baseExecution(toolName: string): HelaExecutionMeta {
  const runId = process.env['HELA_RUN_ID'];
  const stepId = process.env['HELA_STEP_ID'];
  const meta: HelaExecutionMeta = {
    serverName: SERVER_NAME,
    toolName,
    completedAt: new Date().toISOString(),
  };
  if (runId !== undefined) meta.run_id = runId;
  if (stepId !== undefined) meta.step_id = stepId;
  return meta;
}

export function wrapResult<T>(toolName: string, data: T, summary?: string): HelaResult<T> {
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

function textBlock(text: string): { content: Array<{ type: string; text: string }> } {
  return { content: [{ type: 'text', text }] };
}

/**
 * MCP tool-result responder. Envelope off (default): legacy raw text,
 * byte-identical to the pre-C1 call sites.
 */
export function textResult(toolName: string, text: string, summary?: string) {
  if (!isEnvelopeEnabled()) return textBlock(text);
  return textBlock(JSON.stringify(wrapResult(toolName, text, summary), null, 2));
}

/**
 * MCP error responder. Envelope off (default): legacy `Error: <msg>` text +
 * isError preserved exactly. Envelope on: proper HelaResult with ok:false.
 */
export function errorResult(toolName: string, message: string) {
  if (!isEnvelopeEnabled()) {
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
  return {
    ...textBlock(JSON.stringify(wrapError(toolName, message), null, 2)),
    isError: true,
  };
}
