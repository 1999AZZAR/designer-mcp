export interface NormalizedToolCall {
  name: string;
  args: Record<string, unknown>;
  deprecated?: string;
}

interface ToolAlias {
  name: string;
  action: string;
}

const TOOL_ALIASES: Record<string, ToolAlias> = {
  stitch_get: { name: "stitch_resource", action: "get" },
  stitch_edit: { name: "stitch_resource", action: "edit" },
  stitch_delete: { name: "stitch_resource", action: "delete" },
  stitch_url: { name: "stitch_resource", action: "url" },
  logo_audit: { name: "logo_workflow", action: "audit" },
  logo_search_library: { name: "logo_workflow", action: "search" },
  logo_renderers: { name: "logo_workflow", action: "renderers" },
  logo_render: { name: "logo_workflow", action: "render" },
  logo_export_variants: { name: "logo_workflow", action: "export_variants" },
  logo_concept_sheet: { name: "logo_workflow", action: "concept_sheet" },
  logo_preview_sheet: { name: "logo_workflow", action: "preview_sheet" },
  logo_presentation_board: {
    name: "logo_workflow",
    action: "presentation_board",
  },
  palette_fetch: { name: "palette", action: "fetch" },
  palette_convert: { name: "palette", action: "convert" },
  generate_palette_variants: { name: "palette", action: "variants" },
  audit_accessibility: { name: "design_audit", action: "accessibility" },
  anti_pattern_check: { name: "design_audit", action: "slop" },
  self_critique: { name: "design_audit", action: "critique" },
  pre_flight_scan: { name: "design_audit", action: "preflight" },
  generate_tokens: { name: "design_tokens", action: "theme" },
  build_custom_tokens: { name: "design_tokens", action: "custom" },
  generate_css_output: { name: "design_tokens", action: "css" },
  generate_tailwind_config: { name: "design_tokens", action: "tailwind" },
};

export function normalizeToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
): NormalizedToolCall {
  const alias = TOOL_ALIASES[name];
  if (!alias) {
    return { name, args: args ?? {} };
  }

  return {
    name: alias.name,
    args: { ...(args ?? {}), action: alias.action },
    deprecated:
      `Deprecated tool "${name}" is now ${alias.name} with action="${alias.action}". ` +
      "The legacy alias remains available during the v1.2 transition.",
  };
}
