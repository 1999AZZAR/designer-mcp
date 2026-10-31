import {
  stitchGet,
  stitchFind,
  stitchCreate,
  stitchEdit,
  stitchDelete,
  stitchGenerate,
  stitchUrl,
  stitchSyncDesignSystem,
  stitchScreenAudit,
} from "./stitch.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

import {
  STYLES,
  PALETTES,
  ARCHETYPES,
  HYBRIDS,
  CROSS_CUTTING,
  buildSingle,
  buildHybrid,
  buildRulesJson,
} from "./rules.js";
import { fetchPalettes } from "./palette.js";
import { convertPalette, type ConvertTarget } from "./palette-convert.js";
import { generateTailwindConfig } from "./tailwind-config.js";
import { generateTemplate } from "./templates.js";
import {
  getComponent as _getComponent,
  COMPONENT_TYPES,
  OUTPUT_FRAMEWORKS,
  type OutputFramework,
} from "./components.js";
import { generatePaletteVariants } from "./palette-variants.js";
import { exportProject } from "./export.js";
import { evaluateStyle } from "./evaluate.js";
import { scanProject } from "./preflight.js";
import {
  runSlopTest,
  selfCritique,
  type SlopTestResult,
  type QualityScore,
} from "./anti-patterns.js";
import {
  appendWarning,
  textResult,
  errorResult,
  resolveWithinRoot,
} from "./envelope.js";
import { normalizeToolCall } from "./tool-aliases.js";
import {
  generateTokens,
  buildCustomTokens,
  listThemes,
  listGenres,
  detectGenre,
  type GenerateTokensResult,
} from "./tokens.js";
import {
  generate8StateWrapperHtml,
  type ComponentKind,
} from "./components-8state.js";
import {
  generateMotionSnippet,
  MOTION_CATEGORIES,
  type MotionCategory,
} from "./anime-motion.js";
import {
  generateMotionDevSnippet,
  type MotionFramework,
} from "./motion-dev.js";
import { auditA11y } from "./a11y-audit.js";
import { generateCSSOutput, type CSSOutputFormat } from "./css-output.js";
import {
  logoSkillAvailable,
  logoSkillRoot,
  auditLogo,
  searchLogoLibrary,
  renderLogo,
  availableRenderers,
  exportLogoVariants,
  buildConceptSheet,
  buildPreviewSheet,
  buildPresentationBoard,
  type LogoRunResult,
  type LogoRenderInput,
  type LogoExportInput,
  type LogoConceptSheetInput,
  type LogoPreviewSheetInput,
} from "./logoTools.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = join(__dirname, "..");

const SKILL_PATH =
  process.env.THE_DESIGNER_SKILL_PATH ?? join(MCP_ROOT, "skills/ui-designer");

const PALETTE_SKILL_PATH =
  process.env.COLOR_PALETTE_HUNTER_PATH ??
  join(MCP_ROOT, "skills/color-palette-hunter");

function detectInstalledSkills(): Array<{
  name: string;
  path: string;
  description: string;
  tools: string[];
}> {
  const skills: Array<{
    name: string;
    path: string;
    description: string;
    tools: string[];
  }> = [];

  const uiDesignerMd = join(SKILL_PATH, "SKILL.md");
  if (existsSync(uiDesignerMd)) {
    const refDir = join(SKILL_PATH, "references");
    const refCount = existsSync(refDir)
      ? readdirSync(refDir).filter((f: string) => f.endsWith(".md")).length
      : 0;
    skills.push({
      name: "ui-designer",
      path: SKILL_PATH,
      description:
        "Design system selection, theming, brand cloning, component patterns, reference docs",
      tools: [
        `get_reference (${refCount} reference docs available)`,
        "generate_rules",
        "list_options",
        "validate_combo",
        "generate_tailwind_config",
        "generate_template",
        "get_component",
        "export_project",
      ],
    });
  }

  const paletteMd = join(PALETTE_SKILL_PATH, "SKILL.md");
  if (existsSync(paletteMd)) {
    skills.push({
      name: "color-palette-hunter",
      path: PALETTE_SKILL_PATH,
      description:
        "Live palette fetching from Color Hunt, format conversion, standalone shell/Python scripts",
      tools: [
        "palette_fetch (native API)",
        "palette_convert",
        "scripts/fetch-palette.sh (standalone CLI)",
        "scripts/palette-to-design.py (standalone CLI)",
      ],
    });
  }

  const motionMd = join(MCP_ROOT, "skills/motion-designer/SKILL.md");
  if (existsSync(motionMd)) {
    skills.push({
      name: "motion-designer",
      path: join(MCP_ROOT, "skills/motion-designer"),
      description:
        "SOTA animation and physics heuristic guide using motion.dev",
      tools: ["generate_motion_snippet (with engine='motion.dev')"],
    });
  }

  if (logoSkillAvailable()) {
    const root = logoSkillRoot();
    const refCount = existsSync(join(root, "references"))
      ? readdirSync(join(root, "references")).filter((f: string) =>
          f.endsWith(".md"),
        ).length
      : 0;
    const svgCount = existsSync(join(root, "assets", "library", "svg"))
      ? readdirSync(join(root, "assets", "library", "svg")).filter(
          (f: string) => f.endsWith(".svg"),
        ).length
      : 0;
    skills.push({
      name: "logo-design",
      path: root,
      description: `Professional logo and brand-mark design, brief to production files (${refCount} reference docs, ${svgCount}-mark SVG library). Maintained in-tree; originally from kaankiziltug/logo-design-skill (MIT).`,
      tools: [
        "logo_audit",
        "logo_search_library",
        "logo_render",
        "logo_renderers",
        "logo_export_variants",
        "logo_concept_sheet",
        "logo_preview_sheet",
        "logo_presentation_board",
      ],
    });
  }

  return skills;
}

const BRAND_CATALOG: Record<string, string[]> = {
  "productivity-saas": [
    "notion",
    "airtable",
    "cal",
    "superhuman",
    "miro",
    "intercom",
    "zapier",
    "linear.app",
  ],
  "developer-tools": [
    "vercel",
    "supabase",
    "cursor",
    "raycast",
    "warp",
    "posthog",
    "sentry",
    "hashicorp",
    "expo",
    "sanity",
    "mintlify",
    "framer",
    "figma",
    "webflow",
    "clickhouse",
    "mongodb",
    "ibm",
    "opencode.ai",
  ],
  "ai-ml": [
    "claude",
    "cohere",
    "mistral.ai",
    "x.ai",
    "minimax",
    "replicate",
    "runwayml",
    "elevenlabs",
    "together.ai",
    "ollama",
    "composio",
  ],
  fintech: [
    "stripe",
    "coinbase",
    "binance",
    "kraken",
    "revolut",
    "wise",
    "mastercard",
  ],
  "design-creative": [
    "figma",
    "framer",
    "clay",
    "lovable",
    "webflow",
    "linear.app",
  ],
  ecommerce: ["shopify", "nike", "starbucks"],
  "media-consumer": [
    "spotify",
    "discord",
    "slack",
    "pinterest",
    "theverge",
    "wired",
  ],
  "automotive-luxury": [
    "tesla",
    "spacex",
    "ferrari",
    "bugatti",
    "lamborghini",
    "bmw",
    "bmw-m",
    "renault",
    "vodafone",
  ],
  "legacy-archival": ["apple", "dell-1996", "hp", "nintendo-2001"],
};

function runCommand(cmd: string, args: string[], cwd?: string): string {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    timeout: 60000,
    cwd,
  });
  if (result.status !== 0) {
    throw new Error(
      result.stderr || `${cmd} exited with code ${result.status}`,
    );
  }
  return result.stdout;
}

const server = new Server(
  { name: "the-designer", version: "3.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_rules",
      description:
        "Generate design rules for a style + palette + optional archetype/hybrid. IMPORTANT: Run evaluate_style first to determine the best style for your product context. Only use this tool after evaluation confirms the style choice.",
      inputSchema: {
        type: "object",
        properties: {
          style: {
            type: "string",
            description:
              "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3",
          },
          palette: {
            type: "string",
            description: "Color palette: pastel|dark|vibrant|mono",
          },
          archetype: {
            type: "string",
            description:
              "Optional page archetype: dashboard|settings|table-detail|marketing-hero|editorial-landing",
          },
          hybrid: {
            type: "string",
            description: "Optional secondary system for hybrid mode",
          },
          tailwind: {
            type: "boolean",
            description: "Include Tailwind CSS rules",
          },
        },
        required: ["style", "palette"],
      },
    },
    {
      name: "list_options",
      description:
        "List all available design systems, palettes, archetypes, and valid hybrid combinations.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "validate_combo",
      description:
        "Validate a style + palette + optional hybrid combination before generating rules.",
      inputSchema: {
        type: "object",
        properties: {
          style: { type: "string" },
          palette: { type: "string" },
          hybrid: { type: "string" },
        },
        required: ["style", "palette"],
      },
    },
    {
      name: "get_reference",
      description:
        "Return the full content of a reference document by name (e.g. 'ant-design', 'accessibility', 'design-tokens', 'getdesign-md').",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Reference file name without .md extension",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "palette",
      description:
        "Fetch live palettes from Color Hunt, convert palette JSON into CSS/Tailwind/SCSS/Figma/Android/Swift, or generate light/dark/high-contrast/muted/vivid variants. Select action: fetch, convert, or variants.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["fetch", "convert", "variants"],
            description: "Palette operation",
          },
          mode: {
            type: "string",
            enum: ["trending", "popular", "random", "theme", "query"],
            description: "Fetch mode (required for fetch)",
          },
          theme: {
            type: "string",
            description: "Theme name (when mode=theme)",
          },
          query: {
            type: "string",
            description: "Search query (when mode=query)",
          },
          limit: {
            type: "number",
            description: "Number of palettes (default 5)",
          },
          format: {
            type: "string",
            enum: ["json", "css", "tailwind"],
            description: "Fetch output format (default json)",
          },
          palettes: {
            type: "array",
            description: "Palette array required for convert",
          },
          target: {
            type: "string",
            enum: ["css", "tailwind", "scss", "figma", "android", "swift"],
            description: "Conversion target (required for convert)",
          },
          colors: {
            type: "array",
            items: { type: "string" },
            description: 'Hex colors required for variants, e.g. ["#3b82f6"]',
          },
        },
        required: ["action"],
      },
    },
    {
      name: "brand_fetch_design_md",
      description:
        "Download and return the DESIGN.md for a real brand (stripe, vercel, linear, notion, claude, tesla, etc.).",
      inputSchema: {
        type: "object",
        properties: {
          brand: {
            type: "string",
            description:
              "Brand slug, e.g. 'stripe', 'vercel', 'linear.app', 'claude'",
          },
        },
        required: ["brand"],
      },
    },
    {
      name: "design_tokens",
      description:
        "Generate design tokens. Select action: theme (named theme or genre), custom (OKLCH paper/accent + fonts), css (vanilla/CSS Modules/SCSS/variables-only), or tailwind (complete tailwind.config.js).",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["theme", "custom", "css", "tailwind"],
            description: "Token generation mode",
          },
          theme_name: {
            type: "string",
            description:
              "Named theme for theme action: Specimen|Atelier|Newsprint|Studio|Manifesto|Brutal|Terminal|Midnight|Bloom|Aurora|Cobalt|Coral|Hum|Garden|Sport|Carnival",
          },
          genre: {
            type: "string",
            enum: ["editorial", "modern-minimal", "atmospheric", "playful"],
            description: "Genre for theme action (ignored if theme_name is set)",
          },
          last_theme: {
            type: "string",
            description: "Previous theme name for diversification",
          },
          last_accent: {
            type: "string",
            description: "Previous accent hue for diversification",
          },
          paper_l: { type: "number", description: "Custom paper lightness (0-100)" },
          paper_c: { type: "number", description: "Custom paper chroma (0-50)" },
          paper_h: { type: "number", description: "Custom paper hue (0-360)" },
          accent_l: { type: "number", description: "Custom accent lightness (0-100)" },
          accent_c: { type: "number", description: "Custom accent chroma (0-50)" },
          accent_h: { type: "number", description: "Custom accent hue (0-360)" },
          font_display: {
            type: "string",
            description: "Display font stack for custom action",
          },
          font_body: {
            type: "string",
            description: "Body font stack for custom action",
          },
          font_mono: {
            type: "string",
            description: "Optional mono font stack for custom action",
          },
          style: {
            type: "string",
            description:
              "Design system slug for css/tailwind actions (e.g. glass, minimal, material)",
          },
          palette: {
            type: "string",
            enum: ["pastel", "dark", "vibrant", "mono"],
            description: "Color palette for css/tailwind actions",
          },
          format: {
            type: "string",
            enum: ["vanilla", "css-modules", "scss", "css-variables-only"],
            description: "Output format for css action",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "generate_template",
      description:
        "Generate a full HTML starter page for a style + palette + archetype combination. IMPORTANT: Run evaluate_style first to determine the best style/palette/archetype for your product context.",
      inputSchema: {
        type: "object",
        properties: {
          style: {
            type: "string",
            description:
              "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3",
          },
          palette: {
            type: "string",
            description: "Color palette: pastel|dark|vibrant|mono",
          },
          archetype: {
            type: "string",
            description:
              "Page archetype: dashboard|settings|table-detail|marketing-hero|editorial-landing",
          },
        },
        required: ["style", "palette", "archetype"],
      },
    },
    {
      name: "get_component",
      description:
        "Get a production-ready component snippet styled for a specific design system. Supports HTML (Tailwind), React (TSX functional component with typed props), and Vue 3 (SFC with script setup). IMPORTANT: Run evaluate_style first to confirm the style choice.",
      inputSchema: {
        type: "object",
        properties: {
          component: {
            type: "string",
            enum: [
              "button",
              "card",
              "navbar",
              "hero",
              "form-input",
              "badge",
              "modal",
              "sidebar",
              "table",
              "footer",
              "chart",
            ],
            description: "Component type",
          },
          style: {
            type: "string",
            description:
              "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3",
          },
          framework: {
            type: "string",
            enum: ["html", "react", "vue"],
            description:
              "Output framework (default: html). 'react' returns a TypeScript FC with typed props. 'vue' returns a Vue 3 SFC with script setup.",
          },
        },
        required: ["component", "style"],
      },
    },
    {
      name: "design_audit",
      description:
        "Audit design work. Select action: accessibility (25-check WCAG 2.1), slop (35-gate anti-pattern check), critique (6-axis quality score), or preflight (scan an existing project's design tokens and stack).",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["accessibility", "slop", "critique", "preflight"],
            description: "Audit mode",
          },
          html: {
            type: "string",
            description: "Full HTML required for accessibility",
          },
          content: {
            type: "string",
            description: "HTML/CSS required for slop and critique",
          },
          genre: {
            type: "string",
            enum: ["editorial", "modern-minimal", "atmospheric", "playful"],
            default: "editorial",
            description: "Genre for scoped slop gates",
          },
          project_path: {
            type: "string",
            description: "Project root for preflight (defaults to MCP root)",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "get_cross_cutting_rules",
      description:
        "Get standalone cross-cutting design rules by category. Categories: icons, accessibility, motion, tokens, responsive, tailwind. Returns the rules as a formatted string.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "icons",
              "accessibility",
              "motion",
              "tokens",
              "responsive",
              "tailwind",
            ],
            description: "Cross-cutting rule category",
          },
        },
        required: ["category"],
      },
    },
    {
      name: "export_project",
      description:
        "Export a complete project scaffold: tailwind.config.js, index.html, input.css, package.json, and component files. Returns all files as a structured manifest ready to write to disk.",
      inputSchema: {
        type: "object",
        properties: {
          style: {
            type: "string",
            description:
              "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3",
          },
          palette: {
            type: "string",
            description: "Color palette: pastel|dark|vibrant|mono",
          },
          archetype: {
            type: "string",
            description:
              "Page archetype: dashboard|settings|table-detail|marketing-hero|editorial-landing",
          },
          projectName: {
            type: "string",
            description: "Project name (default: my-project)",
          },
        },
        required: ["style", "palette", "archetype"],
      },
    },
    {
      name: "list_installed_skills",
      description:
        "Detect and list all installed skill submodules alongside this MCP. Shows which skills are available for standalone use and what capabilities they provide.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "evaluate_style",
      description:
        "Evaluates a product description against all design systems and returns ranked style recommendations with scoring. USE THIS FIRST before generate_rules. Takes a product context (e.g. 'automotive gaming mouse', 'enterprise dashboard', 'luxury ecommerce') and returns the best-matching style, palette, archetype, and a step-by-step workflow.",
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description:
              "Product description or context (e.g. 'automotive gaming mouse', 'enterprise admin dashboard', 'luxury fashion ecommerce')",
          },
        },
        required: ["description"],
      },
    },
    {
      name: "brand_list",
      description:
        "List the curated local brand catalog (62 brands across 7 categories) grouped by category. For DESIGN.md retrieval beyond this list, use brand_fetch_design_md, which resolves the full 328+ brand getdesign catalog.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "Optional category filter: productivity-saas|developer-tools|ai-ml|fintech|design-creative|ecommerce|media-consumer|automotive-luxury|legacy-archival",
          },
        },
      },
    },
    {
      name: "list_themes",
      description:
        "List all available named themes, optionally filtered by genre. Each theme includes paper/accent OKLCH values, font pairing, and axis metadata for diversification.",
      inputSchema: {
        type: "object",
        properties: {
          genre: {
            type: "string",
            enum: ["editorial", "modern-minimal", "atmospheric", "playful"],
            description: "Optional genre filter",
          },
        },
      },
    },
    {
      name: "detect_genre",
      description:
        "Detect the most appropriate design genre from a product description or brief. Returns one of: editorial, modern-minimal, atmospheric, playful.",
      inputSchema: {
        type: "object",
        properties: {
          brief: {
            type: "string",
            description: "Product description, brief, or design request text",
          },
        },
        required: ["brief"],
      },
    },
    {
      name: "generate_8state_component",
      description:
        "Generate a complete 8-state component demo page (default, hover, focus, active, disabled, loading, error, success) for a given component kind. Returns a standalone HTML preview file with all states rendered.",
      inputSchema: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["button", "input", "toggle", "chip", "select"],
            description: "Component kind",
          },
        },
        required: ["kind"],
      },
    },
    {
      name: "list_ellis_ui_designs",
      description:
        "List all 24 bespoke Ellis UI component design templates with their specific aesthetic focus.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_ellis_ui_template",
      description:
        "Fetch the HTML structure and CSS logic of a specific Ellis UI design system (e.g., 'backup_dossier' or 'backup_gameboy'). Returns both the design.md guidelines and the root index.html template.",
      inputSchema: {
        type: "object",
        properties: {
          design_name: {
            type: "string",
            description:
              "The folder name of the design (e.g. backup_nutrition, backup_gameboy, backup_swiss_archival)",
          },
        },
        required: ["design_name"],
      },
    },
    {
      name: "logo_workflow",
      description:
        "Logo-design workflow. Select action: audit, search, renderers, render, export_variants, concept_sheet, preview_sheet, or presentation_board. Search queries the 1,400+ mark library; render/export/board actions write files.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "audit",
              "search",
              "renderers",
              "render",
              "export_variants",
              "concept_sheet",
              "preview_sheet",
              "presentation_board",
            ],
            description: "Logo workflow step",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "SVG file paths for audit, render, concept, or preview",
          },
          bg: { type: "string", description: "Background colour for audit/render" },
          type: { type: "string", description: "Search mark type" },
          symbolType: { type: "string", description: "Search symbol type" },
          technique: { type: "string", description: "Search technique" },
          geometry: { type: "string", description: "Search geometry" },
          industry: { type: "string", description: "Search industry" },
          subject: { type: "string", description: "Search visual subject" },
          query: { type: "string", description: "Free-text library query" },
          mood: { type: "string", description: "Search mood adjective" },
          color: { type: "string", description: "Search colour family" },
          primaryColor: { type: "string", description: "Dominant colour family" },
          aspect: { type: "string", description: "Search aspect ratio" },
          variant: { type: "string", description: "main|icon" },
          typeStyle: { type: "string", description: "Search type style" },
          case: { type: "string", description: "Search letter case" },
          minColors: { type: "number", description: "Minimum distinct colours" },
          maxColors: { type: "number", description: "Maximum distinct colours" },
          noGradient: { type: "boolean", description: "Exclude gradients" },
          exemplary: { type: "boolean", description: "Only teaching examples" },
          limit: { type: "number", description: "Max search results (default 25)" },
          format: {
            type: "string",
            enum: ["table", "paths", "json"],
            description: "Search output shape",
          },
          summary: { type: "boolean", description: "Aggregate library view" },
          listValues: { type: "boolean", description: "Print filter values" },
          out: { type: "string", description: "Output PNG/HTML path" },
          outDir: { type: "string", description: "Output directory" },
          size: { type: "number", description: "Square PNG size" },
          width: { type: "number", description: "PNG width" },
          height: { type: "number", description: "PNG height" },
          padding: { type: "number", description: "Padding fraction (0-0.4)" },
          backend: { type: "string", description: "Renderer backend" },
          ico: { type: "string", description: "Favicon .ico output path" },
          icoSizes: {
            type: "array",
            items: { type: "number" },
            description: "ICO sizes, e.g. [16,32,48]",
          },
          master: { type: "string", description: "Master SVG for export_variants" },
          name: { type: "string", description: "Brand/output base name" },
          title: { type: "string", description: "Accessible output title" },
          mono: {
            type: "array",
            items: { type: "string" },
            description: "Extra one-colour hex variants",
          },
          iconBg: { type: "string", description: "App-icon tile colour" },
          iconFg: { type: "string", description: "Mark colour on app-icon tile" },
          iconScale: { type: "number", description: "Mark size on app-icon tile" },
          opticalOffset: { type: "number", description: "Vertical square-output nudge" },
          faviconSource: { type: "string", description: "Simplified favicon SVG" },
          keepWhite: { type: "boolean", description: "Keep pure white in mono variants" },
          only: {
            type: "array",
            items: { type: "string" },
            description: "Variant subset: black, white, mono, square, favicon, app-icon",
          },
          png: {
            type: "array",
            items: { type: "number" },
            description: "PNG sizes for export variants",
          },
          webIcons: { type: "boolean", description: "Emit favicon/web icon set" },
          lockups: {
            type: "array",
            items: { type: "string" },
            description: "Lockup SVG per concept",
          },
          names: {
            type: "array",
            items: { type: "string" },
            description: "Concept labels",
          },
          notes: {
            type: "array",
            items: { type: "string" },
            description: "One-line concept ideas",
          },
          subtitle: { type: "string", description: "Sheet subtitle" },
          recommend: { type: "number", description: "1-based recommended concept" },
          greyscale: { type: "boolean", description: "Render concepts in greyscale" },
          brandColor: { type: "string", description: "Preview brand colour" },
          refs: {
            type: "array",
            items: { type: "string" },
            description: "Reference SVGs for shelf test",
          },
          refsIndustry: { type: "string", description: "Shelf reference industry" },
          refsCount: { type: "number", description: "Shelf reference count" },
          compareOnly: { type: "boolean", description: "Preview side-by-side only" },
          spec: { type: "string", description: "Presentation spec JSON path" },
          pngDir: { type: "string", description: "Presentation slide PNG directory" },
          listMockups: { type: "boolean", description: "List presentation mockups" },
        },
        required: ["action"],
      },
    },

    {
      name: "generate_motion_snippet",
      description:
        "Generate a ready-to-paste anime.js v3 animation snippet for a given motion category and design style. Returns CDN link, code snippet, usage hint, and reduced-motion note. Categories: entrance, micro, stagger, scroll, loader, transition, counter, typewriter. All snippets include prefers-reduced-motion guards.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "entrance",
              "micro",
              "stagger",
              "scroll",
              "loader",
              "transition",
              "counter",
              "typewriter",
            ],
            description:
              "Animation category: entrance=page load, micro=button/chip interactions, stagger=list/grid reveal, scroll=IntersectionObserver-triggered, loader=spinner, transition=page transitions, counter=number counters, typewriter=text reveal",
          },
          style: {
            type: "string",
            description:
              "Design system (e.g. glass, neo-brutalism, claymorphism, material, minimal, etc.). Adjusts easing and duration to match the system's motion character.",
          },
          engine: {
            type: "string",
            enum: ["animejs", "motion.dev"],
            description: "Animation engine to use. Defaults to motion.dev.",
          },
          framework: {
            type: "string",
            enum: ["html", "react", "vue"],
            description:
              "Target framework (used by motion.dev engine). Defaults to react.",
          },
        },
        required: ["category", "style"],
      },
    },
    // === Stitch Canvas & Workflow Integration ===
    {
      name: "stitch_resource",
      description:
        "Read, edit, or delete one Stitch resource, or print its canonical canvas URL. Select action: get, edit, delete, or url.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["get", "edit", "delete", "url"],
            description: "Stitch resource operation",
          },
          resource: {
            type: "string",
            enum: [
              "projects",
              "project",
              "screens",
              "screen",
              "design-systems",
              "design-system",
              "status",
            ],
            description: "Resource type (get/edit/delete; url uses project|screen)",
          },
          id: {
            type: "string",
            description: "Resource ID (omit only for status)",
          },
          project: {
            type: "string",
            description: "Stitch Canvas project ID",
          },
          workspace: {
            type: "string",
            description: "Workspace ID override",
          },
          body: {
            type: "object",
            description: "Fields to update for edit",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "stitch_find",
      description:
        "Lists Stitch resources of a given type (projects, screens, design-systems). Mirrors 'stitch find <resource>'. Returns items list, count, and pagination info.",
      inputSchema: {
        type: "object",
        properties: {
          resource: {
            type: "string",
            enum: [
              "projects",
              "project",
              "screens",
              "screen",
              "design-systems",
              "design-system",
            ],
            description: "Resource type to list",
          },
          project: {
            type: "string",
            description: "Stitch Canvas project ID",
          },
          workspace: {
            type: "string",
            description: "Workspace ID override",
          },
          limit: {
            type: "integer",
            description: "Maximum number of items to return",
          },
          filter: {
            type: "string",
            description: "AIP-160 filter expression",
          },
          criteria: {
            type: "object",
            description: "Resource-specific filter criteria",
          },
        },
        required: ["resource"],
      },
    },
    {
      name: "stitch_create",
      description:
        "Creates one Stitch resource (project, screen, design-system). Mirrors 'stitch create <resource>'. Returns created resource metadata.",
      inputSchema: {
        type: "object",
        properties: {
          resource: {
            type: "string",
            enum: ["project", "screen", "design-system"],
            description: "Resource type to create",
          },
          body: {
            type: "object",
            description:
              "Resource payload. Required: project={title}, screen={prompt}, design-system={designSystem={displayName, theme}}.",
          },
          project: {
            type: "string",
            description: "Stitch Canvas project ID",
          },
          workspace: {
            type: "string",
            description: "Workspace ID override",
          },
          dryRun: {
            type: "boolean",
            description: "Validate payload and preview without making API calls",
          },
        },
        required: ["resource", "body"],
      },
    },
    {
      name: "stitch_generate",
      description:
        "Triggers a backend generative creation job for Stitch screens or variants. Mirrors 'stitch generate <resource>'.",
      inputSchema: {
        type: "object",
        properties: {
          resource: {
            type: "string",
            enum: ["screens", "screen", "variants", "variant"],
            description: "Resource type to generate",
          },
          project: {
            type: "string",
            description: "Stitch Canvas project ID",
          },
          prompt: {
            type: "string",
            description: "Text prompt for screen or variant generation",
          },
          aspects: {
            type: "array",
            items: { type: "string" },
            description: "Target aspects for variants (LAYOUT, COLOR_SCHEME, TEXT_FONT)",
          },
          count: {
            type: "integer",
            description: "Number of variants to generate (1-5)",
          },
          creativeRange: {
            type: "string",
            description: "Creative range: REFINE, EXPLORE, or REIMAGINE",
          },
          device: {
            type: "string",
            description: "Device type: MOBILE, DESKTOP, TABLET, or AGNOSTIC",
          },
          dryRun: {
            type: "boolean",
            description: "Validate arguments and preview without starting job",
          },
        },
        required: ["resource"],
      },
    },
    {
      name: "stitch_sync_design_system",
      description:
        "Export the current or chosen OKLCH theme and design rules into a Stitch-compliant DESIGN.md and .stitch/design-system.json for automated visual canvas synchronization.",
      inputSchema: {
        type: "object",
        properties: {
          themeName: {
            type: "string",
            description: "Theme name (e.g. 'Obsidian Kinetic', 'Manifesto', 'Studio')",
          },
          style: {
            type: "string",
            description: "Design style (e.g. 'awwwards', 'minimal', 'glass')",
          },
          targetDir: {
            type: "string",
            description: "Target repository directory (defaults to current working directory)",
          },
        },
      },
    },
    {
      name: "stitch_screen_audit",
      description:
        "Run a unified audit on a Stitch-captured HTML screen or file. Executes 25-check WCAG 2.1 static analysis, 35+ gate anti-slop checks, and 6-axis craft critique.",
      inputSchema: {
        type: "object",
        properties: {
          screenHtml: {
            type: "string",
            description: "Full HTML content of the captured screen",
          },
          filePath: {
            type: "string",
            description: "Path to a captured HTML file (e.g. .stitch/captured-dom.html)",
          },
          genre: {
            type: "string",
            description: "Design genre for scoped anti-slop checks (default: avant-garde)",
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const normalized = normalizeToolCall(
    request.params.name,
    request.params.arguments as Record<string, unknown> | undefined,
  );
  const { name, args, deprecated } = normalized;

  try {
    const result = await (async () => {
      switch (name) {
      case "generate_rules": {
        const { style, palette, archetype, hybrid, tailwind } = args as {
          style: string;
          palette: string;
          archetype?: string;
          hybrid?: string;
          tailwind?: boolean;
        };
        const content = hybrid
          ? buildHybrid(style, hybrid, palette, archetype)
          : buildSingle(style, palette, archetype, tailwind);
        const result = buildRulesJson({
          style,
          palette,
          archetype,
          hybrid: hybrid ? `${style}+${hybrid}` : undefined,
          content,
        });
        return textResult(name, JSON.stringify(result, null, 2));
      }

      case "list_options": {
        const result = buildRulesJson({});
        return textResult(name, JSON.stringify(result, null, 2));
      }

      case "validate_combo": {
        const { style, palette, hybrid } = args as {
          style: string;
          palette: string;
          hybrid?: string;
        };
        const styleOk = style in STYLES;
        const paletteOk = palette in PALETTES;
        const hybridOk = hybrid ? `${style}+${hybrid}` in HYBRIDS : true;
        const valid = styleOk && paletteOk && hybridOk;
        return textResult(
          name,
          JSON.stringify({
            valid,
            style: styleOk ? style : `unknown: ${style}`,
            palette: paletteOk ? palette : `unknown: ${palette}`,
            hybrid: hybrid
              ? hybridOk
                ? `${style}+${hybrid}`
                : `unknown combo: ${style}+${hybrid}`
              : null,
          }),
        );
      }

      case "list_ellis_ui_designs": {
        const ellisPath = join(
          dirname(fileURLToPath(import.meta.url)),
          "..",
          "examples",
          "ellis-ui",
        );
        if (!existsSync(ellisPath)) {
          throw new Error(
            `Ellis UI examples directory not found at ${ellisPath}`,
          );
        }
        const dirs = readdirSync(ellisPath, { withFileTypes: true })
          .filter(
            (dirent) =>
              dirent.isDirectory() && dirent.name.startsWith("backup_"),
          )
          .map((dirent) => dirent.name);

        let output = "Available Ellis UI Templates:\\n";
        for (const d of dirs) {
          const mdPath = join(ellisPath, d, "design.md");
          if (existsSync(mdPath)) {
            const lines = readFileSync(mdPath, "utf-8").split("\\n");
            const titleLine = lines.find((l) =>
              l.startsWith("# Design System:"),
            );
            const title = titleLine
              ? titleLine.replace("# Design System: ", "")
              : d;
            output += `- ${d}: ${title}\\n`;
          } else {
            output += `- ${d}\\n`;
          }
        }
        return textResult(name, output);
      }

      case "get_ellis_ui_template": {
        const { design_name } = args as { design_name: string };
        // Same CWE-22 rule as get_reference: a design folder name, not a path.
        const designPath = resolveWithinRoot(
          join(
            dirname(fileURLToPath(import.meta.url)),
            "..",
            "examples",
            "ellis-ui",
          ),
          design_name,
          { label: "design_name", kind: "dir" },
        );
        if (!existsSync(designPath)) {
          throw new Error(
            `Design ${design_name} not found in Ellis UI examples.`,
          );
        }
        const mdPath = join(designPath, "design.md");
        const htmlPath = join(designPath, "index.html");
        let output = "";
        if (existsSync(mdPath)) {
          output += `--- DESIGN GUIDELINES ---\\n${readFileSync(mdPath, "utf-8")}\\n\\n`;
        }
        if (existsSync(htmlPath)) {
          output += `--- HTML TEMPLATE ---\\n${readFileSync(htmlPath, "utf-8")}\\n`;
        }
        return textResult(name, output);
      }

      case "get_reference": {
        const { name: refName } = args as { name: string };
        // CWE-22: the argument is a bare reference name, never a path.
        const refPath = resolveWithinRoot(
          join(SKILL_PATH, "references"),
          refName,
          {
            label: "name",
            extension: ".md",
          },
        );
        if (!existsSync(refPath)) {
          throw new Error(
            `Reference not found: ${refName}. Available references are in ${SKILL_PATH}/references/`,
          );
        }
        const content = readFileSync(refPath, "utf8");
        return textResult(name, content);
      }

      case "palette": {
        const { action } = args as { action: string };
        if (action === "fetch") {
          const {
            mode,
            theme,
            query,
            limit = 5,
            format = "json",
          } = args as {
            mode: string;
            theme?: string;
            query?: string;
            limit?: number;
            format?: string;
          };
          const paletteMode =
            mode === "theme" ? "theme" : mode === "query" ? "query" : mode;
          const data = await fetchPalettes(paletteMode, {
            theme,
            query,
            limit,
          });
          let output: string;
          if (format === "json") {
            output = JSON.stringify(data, null, 2);
          } else {
            output = convertPalette(data, format as ConvertTarget);
          }
          return textResult(name, output);
        }
        if (action === "convert") {
          const { palettes, target } = args as {
            palettes: unknown[];
            target: string;
          };
          if (!Array.isArray(palettes) || !target) {
            throw new Error(
              'palette convert requires "palettes" (array) and "target"',
            );
          }
          const data = { palettes } as import("./palette.js").PaletteData;
          const output = convertPalette(data, target as ConvertTarget);
          return textResult(name, output);
        }
        if (action === "variants") {
          const { colors } = args as { colors: string[] };
          if (!Array.isArray(colors) || colors.length === 0) {
            throw new Error('palette variants requires a non-empty "colors" array');
          }
          const variants = generatePaletteVariants(colors);
          return textResult(name, JSON.stringify(variants, null, 2));
        }
        throw new Error(`Unsupported palette action: ${action}`);
      }

      case "brand_fetch_design_md": {
        const { brand } = args as { brand: string };
        const tmp = join(tmpdir(), `design-md-${Date.now()}`);
        mkdirSync(tmp, { recursive: true });
        try {
          runCommand("npx", ["getdesign@latest", "add", brand], tmp);
          const designPath = join(tmp, "DESIGN.md");
          if (!existsSync(designPath)) {
            throw new Error(
              `DESIGN.md not found after fetch. Brand '${brand}' may not exist in the catalog.`,
            );
          }
          const content = readFileSync(designPath, "utf8");
          return textResult(name, `# DESIGN.md for ${brand}\n\n${content}`);
        } finally {
          rmSync(tmp, { recursive: true, force: true });
        }
      }

      case "evaluate_style": {
        const { description } = args as { description: string };
        const result = evaluateStyle(description);
        return textResult(name, JSON.stringify(result, null, 2));
      }

      case "list_installed_skills": {
        const skills = detectInstalledSkills();
        return textResult(
          name,
          skills.length
            ? JSON.stringify(
                {
                  message: `${skills.length} skill(s) detected alongside this MCP`,
                  skills,
                  note: "Skills work standalone via their own CLIs. When this MCP is installed, both systems coexist — use MCP tools for programmatic access, skill scripts for standalone CLI usage.",
                },
                null,
                2,
              )
            : JSON.stringify(
                {
                  message:
                    "No skills detected. Install skills as git submodules in skills/ directory.",
                  skills: [],
                },
                null,
                2,
              ),
        );
      }

      case "export_project": {
        const { style, palette, archetype, projectName } = args as {
          style: string;
          palette: string;
          archetype: string;
          projectName?: string;
        };
        if (!(style in STYLES))
          throw new Error(
            `Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`,
          );
        if (!(palette in PALETTES))
          throw new Error(
            `Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`,
          );
        if (!(archetype in ARCHETYPES))
          throw new Error(
            `Unknown archetype: ${archetype}. Available: ${Object.keys(ARCHETYPES).join(", ")}`,
          );
        const result = exportProject(style, palette, archetype, projectName);
        return textResult(name, JSON.stringify(result, null, 2));
      }

      case "get_cross_cutting_rules": {
        const { category } = args as { category: string };
        if (!(category in CROSS_CUTTING))
          throw new Error(
            `Unknown category: ${category}. Available: ${Object.keys(CROSS_CUTTING).join(", ")}`,
          );
        const section = CROSS_CUTTING[category as keyof typeof CROSS_CUTTING];
        const text = `## ${section.label}\n\n${section.rules.map((r) => `- ${r}`).join("\n")}\n`;
        return textResult(name, text);
      }

      case "get_component": {
        const {
          component,
          style,
          framework = "html",
        } = args as { component: string; style: string; framework?: string };
        if (!COMPONENT_TYPES.includes(component as any))
          throw new Error(
            `Unknown component: ${component}. Available: ${COMPONENT_TYPES.join(", ")}`,
          );
        if (!(style in STYLES))
          throw new Error(
            `Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`,
          );
        if (!OUTPUT_FRAMEWORKS.includes(framework as OutputFramework))
          throw new Error(
            `Unknown framework: ${framework}. Available: ${OUTPUT_FRAMEWORKS.join(", ")}`,
          );
        const output = _getComponent(
          component as any,
          style,
          framework as OutputFramework,
        );
        return textResult(name, output);
      }

      case "design_audit": {
        const { action } = args as { action: string };
        if (action === "accessibility") {
          const { html } = args as { html: string };
          if (!html || typeof html !== "string")
            throw new Error("design_audit accessibility requires \"html\"");
          const result = auditA11y(html);
          return textResult(name, JSON.stringify(result, null, 2));
        }
        if (action === "slop") {
          const { content, genre = "editorial" } = args as {
            content: string;
            genre?: string;
          };
          if (!content || typeof content !== "string")
            throw new Error("design_audit slop requires \"content\"");
          const result = runSlopTest(content, genre);
          return textResult(name, JSON.stringify(result, null, 2));
        }
        if (action === "critique") {
          const { content } = args as { content: string };
          if (!content || typeof content !== "string")
            throw new Error("design_audit critique requires \"content\"");
          const result = selfCritique(content);
          return textResult(name, JSON.stringify(result, null, 2));
        }
        if (action === "preflight") {
          const { project_path } = args as { project_path?: string };
          const result = scanProject(project_path);
          return textResult(name, JSON.stringify(result, null, 2));
        }
        throw new Error(`Unsupported design_audit action: ${action}`);
      }

      case "generate_template": {
        const { style, palette, archetype } = args as {
          style: string;
          palette: string;
          archetype: string;
        };
        if (!(style in STYLES))
          throw new Error(
            `Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`,
          );
        if (!(palette in PALETTES))
          throw new Error(
            `Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`,
          );
        if (!(archetype in ARCHETYPES))
          throw new Error(
            `Unknown archetype: ${archetype}. Available: ${Object.keys(ARCHETYPES).join(", ")}`,
          );
        const html = generateTemplate(style, palette, archetype);
        return textResult(name, html);
      }

      case "design_tokens": {
        const { action } = args as { action: string };
        if (action === "theme") {
          const { theme_name, genre, last_theme, last_accent } = args as {
            theme_name?: string;
            genre?: string;
            last_theme?: string;
            last_accent?: string;
          };
          const result = generateTokens(
            theme_name,
            genre,
            last_theme,
            last_accent,
          );
          return textResult(name, JSON.stringify(result, null, 2));
        }
        if (action === "custom") {
          const {
            paper_l,
            paper_c,
            paper_h,
            accent_l,
            accent_c,
            accent_h,
            font_display,
            font_body,
            font_mono,
          } = args as {
            paper_l: number;
            paper_c: number;
            paper_h: number;
            accent_l: number;
            accent_c: number;
            accent_h: number;
            font_display: string;
            font_body: string;
            font_mono?: string;
          };
          const required = [
            paper_l,
            paper_c,
            paper_h,
            accent_l,
            accent_c,
            accent_h,
            font_display,
            font_body,
          ];
          if (required.some((v) => v === undefined || v === null)) {
            throw new Error(
              "design_tokens custom requires paper/accent OKLCH values and fonts",
            );
          }
          const result = buildCustomTokens(
            { l: paper_l, c: paper_c, h: paper_h },
            { l: accent_l, c: accent_c, h: accent_h },
            font_display,
            font_body,
            font_mono,
          );
          return textResult(name, JSON.stringify(result, null, 2));
        }
        if (action === "css") {
          const CSS_FORMATS: CSSOutputFormat[] = [
            "vanilla",
            "css-modules",
            "scss",
            "css-variables-only",
          ];
          const { style, palette, format } = args as {
            style: string;
            palette: string;
            format: string;
          };
          if (!CSS_FORMATS.includes(format as CSSOutputFormat)) {
            throw new Error(
              `Unknown format: ${format}. Available: ${CSS_FORMATS.join(", ")}`,
            );
          }
          const result = generateCSSOutput(
            style,
            palette,
            format as CSSOutputFormat,
          );
          return textResult(name, JSON.stringify(result, null, 2));
        }
        if (action === "tailwind") {
          const { style, palette } = args as {
            style: string;
            palette: string;
          };
          if (!(style in STYLES))
            throw new Error(
              `Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`,
            );
          if (!(palette in PALETTES))
            throw new Error(
              `Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`,
            );
          const result = generateTailwindConfig(style, palette);
          return textResult(name, result.code);
        }
        throw new Error(`Unsupported design_tokens action: ${action}`);
      }

      case "brand_list": {
        const { category } = args as { category?: string };
        const catalog = category
          ? { [category]: BRAND_CATALOG[category] ?? [] }
          : BRAND_CATALOG;
        return textResult(name, JSON.stringify(catalog, null, 2));
      }

      // === New tools ===

      case "list_themes": {
        const { genre } = args as { genre?: string };
        const themes = listThemes(genre);
        return textResult(name, JSON.stringify(themes, null, 2));
      }

      case "detect_genre": {
        const { brief } = args as { brief: string };
        const genre = detectGenre(brief);
        return textResult(
          name,
          JSON.stringify({ brief, detected_genre: genre }, null, 2),
        );
      }

      case "generate_8state_component": {
        const { kind } = args as { kind: string };
        const html = generate8StateWrapperHtml(kind as ComponentKind);
        return textResult(name, html);
      }

      case "generate_motion_snippet": {
        const {
          category,
          style,
          engine = "motion.dev",
          framework = "react",
        } = args as {
          category: string;
          style: string;
          engine?: string;
          framework?: string;
        };
        if (!MOTION_CATEGORIES.includes(category as MotionCategory)) {
          throw new Error(
            `Unknown category: ${category}. Available: ${MOTION_CATEGORIES.join(", ")}`,
          );
        }
        let result;
        if (engine === "animejs") {
          result = generateMotionSnippet(category as MotionCategory, style);
        } else {
          result = generateMotionDevSnippet(
            category as MotionCategory,
            style,
            framework as MotionFramework,
          );
        }
        return textResult(name, JSON.stringify(result, null, 2));
      }

      // === logo-design skill workflow ===

      case "logo_workflow": {
        const { action } = args as { action: string };
        if (action === "audit") {
          const { files, bg } = args as { files: string[]; bg?: string };
          return textResult(
            name,
            JSON.stringify(auditLogo({ files, bg }), null, 2),
          );
        }
        if (action === "search") {
          const run: LogoRunResult = searchLogoLibrary(
            args as Parameters<typeof searchLogoLibrary>[0],
          );
          return textResult(name, run.stdout);
        }
        if (action === "renderers") {
          const run = availableRenderers();
          return textResult(name, run.stdout);
        }
        if (action === "render") {
          const run = renderLogo(args as unknown as LogoRenderInput);
          return textResult(name, JSON.stringify(run, null, 2));
        }
        if (action === "export_variants") {
          const run = exportLogoVariants(args as unknown as LogoExportInput);
          return textResult(name, JSON.stringify(run, null, 2));
        }
        if (action === "concept_sheet") {
          const run = buildConceptSheet(
            args as unknown as LogoConceptSheetInput,
          );
          return textResult(name, JSON.stringify(run, null, 2));
        }
        if (action === "preview_sheet") {
          const run = buildPreviewSheet(
            args as unknown as LogoPreviewSheetInput,
          );
          return textResult(name, JSON.stringify(run, null, 2));
        }
        if (action === "presentation_board") {
          const run = buildPresentationBoard(
            args as Parameters<typeof buildPresentationBoard>[0],
          );
          return textResult(name, JSON.stringify(run, null, 2));
        }
        throw new Error(`Unsupported logo_workflow action: ${action}`);
      }

      // === Stitch Canvas & Workflow Integration ===


      case "stitch_resource": {
        const { action } = args as { action: string };
        if (action === "get") {
          const result = await stitchGet(args as any);
          return textResult(name, result);
        }
        if (action === "edit") {
          const result = await stitchEdit(args as any);
          return textResult(name, result);
        }
        if (action === "delete") {
          const result = await stitchDelete(args as any);
          return textResult(name, result);
        }
        if (action === "url") {
          const result = await stitchUrl(args as any);
          return textResult(name, result);
        }
        throw new Error(`Unsupported stitch_resource action: ${action}`);
      }

      case "stitch_find": {
        const result = await stitchFind(args as any);
        return textResult(name, result);
      }

      case "stitch_create": {
        const result = await stitchCreate(args as any);
        return textResult(name, result);
      }



      case "stitch_generate": {
        const result = await stitchGenerate(args as any);
        return textResult(name, result);
      }


      case "stitch_sync_design_system": {
        const result = stitchSyncDesignSystem(args as any);
        return textResult(name, result);
      }

      case "stitch_screen_audit": {
        const result = stitchScreenAudit(args as any);
        return textResult(name, result);
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
      }
    })();
    return appendWarning(result, deprecated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return appendWarning(errorResult(name, message), deprecated);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
