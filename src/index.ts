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

import { STYLES, PALETTES, ARCHETYPES, HYBRIDS, CROSS_CUTTING, buildSingle, buildHybrid, buildRulesJson } from "./rules.js";
import { fetchPalettes } from "./palette.js";
import { convertPalette, type ConvertTarget } from "./palette-convert.js";
import { generateTailwindConfig } from "./tailwind-config.js";
import { generateTemplate } from "./templates.js";
import { getComponent as _getComponent, COMPONENT_TYPES, OUTPUT_FRAMEWORKS, type OutputFramework } from "./components.js";
import { generatePaletteVariants } from "./palette-variants.js";
import { exportProject } from "./export.js";
import { evaluateStyle } from "./evaluate.js";
import { scanProject } from "./preflight.js";
import { runSlopTest, selfCritique, type SlopTestResult, type QualityScore } from "./anti-patterns.js";
import { generateTokens, buildCustomTokens, listThemes, listGenres, detectGenre, type GenerateTokensResult } from "./tokens.js";
import { generate8StateWrapperHtml, type ComponentKind } from "./components-8state.js";
import { generateMotionSnippet, MOTION_CATEGORIES, type MotionCategory } from "./anime-motion.js";
import { generateMotionDevSnippet, type MotionFramework } from "./motion-dev.js";
import { auditA11y } from "./a11y-audit.js";
import { generateCSSOutput, type CSSOutputFormat } from "./css-output.js";


const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = join(__dirname, "..");

const SKILL_PATH =
  process.env.THE_DESIGNER_SKILL_PATH ??
  join(MCP_ROOT, "skills/ui-designer");

const PALETTE_SKILL_PATH =
  process.env.COLOR_PALETTE_HUNTER_PATH ??
  join(MCP_ROOT, "skills/color-palette-hunter");

function detectInstalledSkills(): Array<{ name: string; path: string; description: string; tools: string[] }> {
  const skills: Array<{ name: string; path: string; description: string; tools: string[] }> = [];

  const uiDesignerMd = join(SKILL_PATH, "SKILL.md");
  if (existsSync(uiDesignerMd)) {
    const refDir = join(SKILL_PATH, "references");
    const refCount = existsSync(refDir)
      ? readdirSync(refDir).filter((f: string) => f.endsWith(".md")).length
      : 0;
    skills.push({
      name: "ui-designer",
      path: SKILL_PATH,
      description: "Design system selection, theming, brand cloning, component patterns, reference docs",
      tools: [
        `get_reference (${refCount} reference docs available)`,
        "generate_rules", "list_options", "validate_combo",
        "generate_tailwind_config", "generate_template", "get_component",
        "export_project",
      ],
    });
  }

  const paletteMd = join(PALETTE_SKILL_PATH, "SKILL.md");
  if (existsSync(paletteMd)) {
    skills.push({
      name: "color-palette-hunter",
      path: PALETTE_SKILL_PATH,
      description: "Live palette fetching from Color Hunt, format conversion, standalone shell/Python scripts",
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
      description: "SOTA animation and physics heuristic guide using motion.dev",
      tools: [
        "generate_motion_snippet (with engine='motion.dev')",
      ],
    });
  }

  return skills;
}

const BRAND_CATALOG: Record<string, string[]> = {
  "productivity-saas": ["notion", "airtable", "cal", "superhuman", "miro", "intercom", "zapier", "linear.app"],
  "developer-tools": ["vercel", "supabase", "cursor", "raycast", "warp", "posthog", "sentry", "hashicorp", "expo", "sanity", "mintlify", "framer", "figma", "webflow", "clickhouse", "mongodb", "ibm", "opencode.ai"],
  "ai-ml": ["claude", "cohere", "mistral.ai", "x.ai", "minimax", "replicate", "runwayml", "elevenlabs", "together.ai", "ollama", "composio"],
  "fintech": ["stripe", "coinbase", "binance", "kraken", "revolut", "wise", "mastercard"],
  "design-creative": ["figma", "framer", "clay", "lovable", "webflow", "linear.app"],
  "ecommerce": ["shopify", "nike", "starbucks"],
  "media-consumer": ["spotify", "discord", "slack", "pinterest", "theverge", "wired"],
  "automotive-luxury": ["tesla", "spacex", "ferrari", "bugatti", "lamborghini", "bmw", "bmw-m", "renault", "vodafone"],
  "legacy-archival": ["apple", "dell-1996", "hp", "nintendo-2001"],
};

function runCommand(cmd: string, args: string[], cwd?: string): string {
  const result = spawnSync(cmd, args, { encoding: "utf8", timeout: 60000, cwd });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${cmd} exited with code ${result.status}`);
  }
  return result.stdout;
}

const server = new Server(
  { name: "the-designer", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_rules",
      description: "Generate design rules for a style + palette + optional archetype/hybrid. IMPORTANT: Run evaluate_style first to determine the best style for your product context. Only use this tool after evaluation confirms the style choice.",
      inputSchema: {
        type: "object",
        properties: {
          style: { type: "string", description: "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3" },
          palette: { type: "string", description: "Color palette: pastel|dark|vibrant|mono" },
          archetype: { type: "string", description: "Optional page archetype: dashboard|settings|table-detail|marketing-hero|editorial-landing" },
          hybrid: { type: "string", description: "Optional secondary system for hybrid mode" },
          tailwind: { type: "boolean", description: "Include Tailwind CSS rules" },
        },
        required: ["style", "palette"],
      },
    },
    {
      name: "list_options",
      description: "List all available design systems, palettes, archetypes, and valid hybrid combinations.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "validate_combo",
      description: "Validate a style + palette + optional hybrid combination before generating rules.",
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
      description: "Return the full content of a reference document by name (e.g. 'ant-design', 'accessibility', 'design-tokens', 'getdesign-md').",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Reference file name without .md extension" },
        },
        required: ["name"],
      },
    },
    {
      name: "palette_fetch",
      description: "Fetch live color palettes from Color Hunt.",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["trending", "popular", "random", "theme", "query"], description: "Fetch mode" },
          theme: { type: "string", description: "Theme name (when mode=theme)" },
          query: { type: "string", description: "Search query (when mode=query)" },
          limit: { type: "number", description: "Number of palettes (default 5)" },
          format: { type: "string", enum: ["json", "css", "tailwind"], description: "Output format (default json)" },
        },
        required: ["mode"],
      },
    },
    {
      name: "palette_convert",
      description: "Convert palette JSON from palette_fetch into CSS, Tailwind, SCSS, Figma tokens, Android XML, or Swift.",
      inputSchema: {
        type: "object",
        properties: {
          palettes: { type: "array", description: "Palette array from palette_fetch JSON output" },
          target: { type: "string", enum: ["css", "tailwind", "scss", "figma", "android", "swift"], description: "Output format" },
        },
        required: ["palettes", "target"],
      },
    },
    {
      name: "brand_fetch_design_md",
      description: "Download and return the DESIGN.md for a real brand (stripe, vercel, linear, notion, claude, tesla, etc.).",
      inputSchema: {
        type: "object",
        properties: {
          brand: { type: "string", description: "Brand slug, e.g. 'stripe', 'vercel', 'linear.app', 'claude'" },
        },
        required: ["brand"],
      },
    },
    {
      name: "generate_tailwind_config",
      description: "Generate a ready-to-use tailwind.config.js for a design style + palette combination. Returns the full config object and module.exports code string.",
      inputSchema: {
        type: "object",
        properties: {
          style: { type: "string", description: "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3" },
          palette: { type: "string", description: "Color palette: pastel|dark|vibrant|mono" },
        },
        required: ["style", "palette"],
      },
    },
    {
      name: "generate_template",
      description: "Generate a full HTML starter page for a style + palette + archetype combination. IMPORTANT: Run evaluate_style first to determine the best style/palette/archetype for your product context.",
      inputSchema: {
        type: "object",
        properties: {
          style: { type: "string", description: "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3" },
          palette: { type: "string", description: "Color palette: pastel|dark|vibrant|mono" },
          archetype: { type: "string", description: "Page archetype: dashboard|settings|table-detail|marketing-hero|editorial-landing" },
        },
        required: ["style", "palette", "archetype"],
      },
    },
    {
      name: "get_component",
      description: "Get a production-ready component snippet styled for a specific design system. Supports HTML (Tailwind), React (TSX functional component with typed props), and Vue 3 (SFC with script setup). IMPORTANT: Run evaluate_style first to confirm the style choice.",
      inputSchema: {
        type: "object",
        properties: {
          component: { type: "string", enum: ["button", "card", "navbar", "hero", "form-input", "badge", "modal", "sidebar", "table", "footer", "chart"], description: "Component type" },
          style: { type: "string", description: "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3" },
          framework: { type: "string", enum: ["html", "react", "vue"], description: "Output framework (default: html). 'react' returns a TypeScript FC with typed props. 'vue' returns a Vue 3 SFC with script setup." },
        },
        required: ["component", "style"],
      },
    },
    {
      name: "audit_accessibility",
      description: "Run a 25-check WCAG 2.1 accessibility audit on HTML content. Covers: missing alt text, unlabeled inputs/selects/textareas, empty buttons/links, missing lang/title, heading order violations, focus-visible removal, positive tabindex, skip links, viewport scale lock, landmark regions, and more. Returns a 0-100 score, A-F grade, per-severity issue counts, actionable fix instructions per issue, and a list of passed checks.",
      inputSchema: {
        type: "object",
        properties: {
          html: { type: "string", description: "Full HTML string to audit" },
        },
        required: ["html"],
      },
    },
    {
      name: "generate_css_output",
      description: "Generate framework-agnostic CSS output from a design style and palette. Supports vanilla CSS (tokens.css + base.css + components.css), CSS Modules (Button/Card/Input .module.css with all 8 states), SCSS (variables + mixins + BEM components), and css-variables-only (tokens with auto dark mode @media and [data-theme='dark']). Returns an array of named files ready to save to disk.",
      inputSchema: {
        type: "object",
        properties: {
          style: { type: "string", description: "Design system slug (e.g. glass, neo-brutalism, minimal, material)" },
          palette: { type: "string", enum: ["pastel", "dark", "vibrant", "mono"], description: "Color palette" },
          format: { type: "string", enum: ["vanilla", "css-modules", "scss", "css-variables-only"], description: "Output format" },
        },
        required: ["style", "palette", "format"],
      },
    },
    {
      name: "get_cross_cutting_rules",
      description: "Get standalone cross-cutting design rules by category. Categories: icons, accessibility, motion, tokens, responsive, tailwind. Returns the rules as a formatted string.",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["icons", "accessibility", "motion", "tokens", "responsive", "tailwind"], description: "Cross-cutting rule category" },
        },
        required: ["category"],
      },
    },
    {
      name: "generate_palette_variants",
      description: "Generate light, dark, high-contrast, muted, and vivid variants from a set of hex colors. Useful for theming and responsive color systems.",
      inputSchema: {
        type: "object",
        properties: {
          colors: { type: "array", items: { type: "string" }, description: "Array of hex color strings, e.g. [\"#3b82f6\", \"#8b5cf6\"]" },
        },
        required: ["colors"],
      },
    },
    {
      name: "export_project",
      description: "Export a complete project scaffold: tailwind.config.js, index.html, input.css, package.json, and component files. Returns all files as a structured manifest ready to write to disk.",
      inputSchema: {
        type: "object",
        properties: {
          style: { type: "string", description: "Design system: ant|carbon|fluent|atlassian|apple-hig|polaris|material|minimal|glass|neumorphism|neo-brutalism|claymorphism|skeuomorphism|swiss|swiss-archival|m3-pastel|neo-m3" },
          palette: { type: "string", description: "Color palette: pastel|dark|vibrant|mono" },
          archetype: { type: "string", description: "Page archetype: dashboard|settings|table-detail|marketing-hero|editorial-landing" },
          projectName: { type: "string", description: "Project name (default: my-project)" },
        },
        required: ["style", "palette", "archetype"],
      },
    },
    {
      name: "list_installed_skills",
      description: "Detect and list all installed skill submodules alongside this MCP. Shows which skills are available for standalone use and what capabilities they provide.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "evaluate_style",
      description: "Evaluates a product description against all design systems and returns ranked style recommendations with scoring. USE THIS FIRST before generate_rules. Takes a product context (e.g. 'automotive gaming mouse', 'enterprise dashboard', 'luxury ecommerce') and returns the best-matching style, palette, archetype, and a step-by-step workflow.",
      inputSchema: {
        type: "object",
        properties: {
          description: { type: "string", description: "Product description or context (e.g. 'automotive gaming mouse', 'enterprise admin dashboard', 'luxury fashion ecommerce')" },
        },
        required: ["description"],
      },
    },
    {
      name: "brand_list",
      description: "List all 328+ supported brands grouped by category.",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", description: "Optional category filter: productivity-saas|developer-tools|ai-ml|fintech|design-creative|ecommerce|media-consumer|automotive-luxury|legacy-archival" },
        },
      },
    },
    {
      name: "pre_flight_scan",
      description: "Scan an existing project directory and detect framework, font stack, palette tokens, motion libraries, and spacing scale before designing. Returns structured pre-flight findings with preservation/introduction recommendations.",
      inputSchema: {
        type: "object",
        properties: {
          project_path: { type: "string", description: "Absolute path to the project root. Defaults to MCP root if omitted." },
        },
      },
    },
    {
      name: "anti_pattern_check",
      description: "Run a 35-gate quality checklist (slop test) against HTML/CSS content. Detects common AI design tells: italic headers, em-in-heading, dummy section tags, fabricated metrics, fake chrome, specimen fall-through, hanging headers, generic CTA, glass on white, missing a11y, and more. Specify genre to scope genre-specific gates.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "HTML or CSS content to check" },
          genre: { type: "string", enum: ["editorial", "modern-minimal", "atmospheric", "playful"], default: "editorial", description: "Genre for scoped gate application" },
        },
        required: ["content"],
      },
    },
    {
      name: "self_critique",
      description: "Score output on 6 quality axes (Philosophy, Hierarchy, Execution, Specificity, Restraint, Variety) before shipping. Returns 1-5 per axis and a summary score. Anything < 3 triggers a revision pass.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "HTML/CSS content to score" },
        },
        required: ["content"],
      },
    },
    {
      name: "generate_tokens",
      description: "Generate a complete design token system (tokens.css) based on a named theme or genre. Returns CSS custom properties for colors (OKLCH), fonts, spacing, text sizes, easings, durations, and radii. Can also output a Tailwind v4 @theme block.",
      inputSchema: {
        type: "object",
        properties: {
          theme_name: { type: "string", description: "Named theme: Specimen|Atelier|Newsprint|Studio|Manifesto|Brutal|Terminal|Midnight|Bloom|Aurora|Cobalt|Coral|Hum|Garden|Sport|Carnival" },
          genre: { type: "string", enum: ["editorial", "modern-minimal", "atmospheric", "playful"], description: "Genre to pick a theme from (ignored if theme_name provided)" },
          last_theme: { type: "string", description: "Previous theme name for diversification" },
          last_accent: { type: "string", description: "Previous accent hue for diversification" },
        },
      },
    },
    {
      name: "list_themes",
      description: "List all available named themes, optionally filtered by genre. Each theme includes paper/accent OKLCH values, font pairing, and axis metadata for diversification.",
      inputSchema: {
        type: "object",
        properties: {
          genre: { type: "string", enum: ["editorial", "modern-minimal", "atmospheric", "playful"], description: "Optional genre filter" },
        },
      },
    },
    {
      name: "detect_genre",
      description: "Detect the most appropriate design genre from a product description or brief. Returns one of: editorial, modern-minimal, atmospheric, playful.",
      inputSchema: {
        type: "object",
        properties: {
          brief: { type: "string", description: "Product description, brief, or design request text" },
        },
        required: ["brief"],
      },
    },
    {
      name: "generate_8state_component",
      description: "Generate a complete 8-state component demo page (default, hover, focus, active, disabled, loading, error, success) for a given component kind. Returns a standalone HTML preview file with all states rendered.",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["button", "input", "toggle", "chip", "select"], description: "Component kind" },
        },
        required: ["kind"],
      },
    },
    {
      name: "build_custom_tokens",
      description: "Build a custom OKLCH token system from scratch with paper color, accent color, and font pairing. Use when a brief signals creative-intent (brand color, multi-vibe aesthetic, explicit custom request). Returns tokens.css + Tailwind v4 @theme block.",
      inputSchema: {
        type: "object",
        properties: {
          paper_l: { type: "number", description: "Paper lightness (0-100)" },
          paper_c: { type: "number", description: "Paper chroma (0-50)" },
          paper_h: { type: "number", description: "Paper hue (0-360)" },
          accent_l: { type: "number", description: "Accent lightness (0-100)" },
          accent_c: { type: "number", description: "Accent chroma (0-50)" },
          accent_h: { type: "number", description: "Accent hue (0-360)" },
          font_display: { type: "string", description: "Display font stack, e.g. 'Instrument Serif', Georgia, serif" },
          font_body: { type: "string", description: "Body font stack, e.g. 'Inter', system-ui, sans-serif" },
          font_mono: { type: "string", description: "Optional mono font stack (default: JetBrains Mono)" },
        },
        required: ["paper_l", "paper_c", "paper_h", "accent_l", "accent_c", "accent_h", "font_display", "font_body"],
      },
    },
    {
      name: "list_ellis_ui_designs",
      description: "List all 24 bespoke Ellis UI component design templates with their specific aesthetic focus.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_ellis_ui_template",
      description: "Fetch the HTML structure and CSS logic of a specific Ellis UI design system (e.g., 'backup_dossier' or 'backup_gameboy'). Returns both the design.md guidelines and the root index.html template.",
      inputSchema: {
        type: "object",
        properties: {
          design_name: { type: "string", description: "The folder name of the design (e.g. backup_nutrition, backup_gameboy, backup_swiss_archival)" },
        },
        required: ["design_name"],
      },
    },
    {
      name: "generate_motion_snippet",
      description: "Generate a ready-to-paste anime.js v4 animation snippet for a given motion category and design style. Returns CDN link, code snippet, usage hint, and reduced-motion note. Categories: entrance, micro, stagger, scroll, loader, transition, counter, typewriter. All snippets include prefers-reduced-motion guards.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["entrance", "micro", "stagger", "scroll", "loader", "transition", "counter", "typewriter"],
            description: "Animation category: entrance=page load, micro=button/chip interactions, stagger=list/grid reveal, scroll=IntersectionObserver-triggered, loader=spinner, transition=page transitions, counter=number counters, typewriter=text reveal",
          },
          style: {
            type: "string",
            description: "Design system (e.g. glass, neo-brutalism, claymorphism, material, minimal, etc.). Adjusts easing and duration to match the system's motion character.",
          },
          engine: {
            type: "string",
            enum: ["animejs", "motion.dev"],
            description: "Animation engine to use. Defaults to motion.dev."
          },
          framework: {
            type: "string",
            enum: ["html", "react", "vue"],
            description: "Target framework (used by motion.dev engine). Defaults to react."
          }
        },
        required: ["category", "style"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_rules": {
        const { style, palette, archetype, hybrid, tailwind } = args as {
          style: string; palette: string; archetype?: string; hybrid?: string; tailwind?: boolean;
        };
        const content = hybrid
          ? buildHybrid(style, hybrid, palette, archetype)
          : buildSingle(style, palette, archetype, tailwind);
        const result = buildRulesJson({
          style, palette, archetype,
          hybrid: hybrid ? `${style}+${hybrid}` : undefined,
          content,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_options": {
        const result = buildRulesJson({});
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "validate_combo": {
        const { style, palette, hybrid } = args as {
          style: string; palette: string; hybrid?: string;
        };
        const styleOk = style in STYLES;
        const paletteOk = palette in PALETTES;
        const hybridOk = hybrid ? `${style}+${hybrid}` in HYBRIDS : true;
        const valid = styleOk && paletteOk && hybridOk;
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              valid,
              style: styleOk ? style : `unknown: ${style}`,
              palette: paletteOk ? palette : `unknown: ${palette}`,
              hybrid: hybrid ? (hybridOk ? `${style}+${hybrid}` : `unknown combo: ${style}+${hybrid}`) : null,
            }),
          }],
        };
      }

      case "list_ellis_ui_designs": {
        const ellisPath = join(dirname(fileURLToPath(import.meta.url)), "..", "examples", "ellis-ui");
        if (!existsSync(ellisPath)) {
          throw new Error(`Ellis UI examples directory not found at ${ellisPath}`);
        }
        const dirs = readdirSync(ellisPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name.startsWith("backup_"))
          .map(dirent => dirent.name);
        
        let output = "Available Ellis UI Templates:\\n";
        for (const d of dirs) {
          const mdPath = join(ellisPath, d, "design.md");
          if (existsSync(mdPath)) {
            const lines = readFileSync(mdPath, "utf-8").split("\\n");
            const titleLine = lines.find(l => l.startsWith("# Design System:"));
            const title = titleLine ? titleLine.replace("# Design System: ", "") : d;
            output += `- ${d}: ${title}\\n`;
          } else {
            output += `- ${d}\\n`;
          }
        }
        return { content: [{ type: "text", text: output }] };
      }

      case "get_ellis_ui_template": {
        const { design_name } = args as { design_name: string };
        const designPath = join(dirname(fileURLToPath(import.meta.url)), "..", "examples", "ellis-ui", design_name);
        if (!existsSync(designPath)) {
          throw new Error(`Design ${design_name} not found in Ellis UI examples.`);
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
        return { content: [{ type: "text", text: output }] };
      }

      case "get_reference": {
        const { name: refName } = args as { name: string };
        const refPath = join(SKILL_PATH, "references", `${refName}.md`);
        if (!existsSync(refPath)) {
          throw new Error(`Reference not found: ${refName}. Available references are in ${SKILL_PATH}/references/`);
        }
        const content = readFileSync(refPath, "utf8");
        return { content: [{ type: "text", text: content }] };
      }

      case "palette_fetch": {
        const { mode, theme, query, limit = 5, format = "json" } = args as {
          mode: string; theme?: string; query?: string; limit?: number; format?: string;
        };
        const paletteMode = mode === "theme" ? "theme" : mode === "query" ? "query" : mode;
        const data = await fetchPalettes(paletteMode, { theme, query, limit });
        let output: string;
        if (format === "json") {
          output = JSON.stringify(data, null, 2);
        } else {
          output = convertPalette(data, format as ConvertTarget);
        }
        return { content: [{ type: "text", text: output }] };
      }

      case "palette_convert": {
        const { palettes, target } = args as { palettes: unknown[]; target: string };
        const data = { palettes } as import("./palette.js").PaletteData;
        const output = convertPalette(data, target as ConvertTarget);
        return { content: [{ type: "text", text: output }] };
      }

      case "brand_fetch_design_md": {
        const { brand } = args as { brand: string };
        const tmp = join(tmpdir(), `design-md-${Date.now()}`);
        mkdirSync(tmp, { recursive: true });
        try {
          runCommand("npx", ["getdesign@latest", "add", brand], tmp);
          const designPath = join(tmp, "DESIGN.md");
          if (!existsSync(designPath)) {
            throw new Error(`DESIGN.md not found after fetch. Brand '${brand}' may not exist in the catalog.`);
          }
          const content = readFileSync(designPath, "utf8");
          return { content: [{ type: "text", text: `# DESIGN.md for ${brand}\n\n${content}` }] };
        } finally {
          rmSync(tmp, { recursive: true, force: true });
        }
      }

      case "evaluate_style": {
        const { description } = args as { description: string };
        const result = evaluateStyle(description);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_installed_skills": {
        const skills = detectInstalledSkills();
        return {
          content: [{
            type: "text",
            text: skills.length
              ? JSON.stringify({
                  message: `${skills.length} skill(s) detected alongside this MCP`,
                  skills,
                  note: "Skills work standalone via their own CLIs. When this MCP is installed, both systems coexist — use MCP tools for programmatic access, skill scripts for standalone CLI usage.",
                }, null, 2)
              : JSON.stringify({ message: "No skills detected. Install skills as git submodules in skills/ directory.", skills: [] }, null, 2),
          }],
        };
      }

      case "export_project": {
        const { style, palette, archetype, projectName } = args as {
          style: string; palette: string; archetype: string; projectName?: string;
        };
        if (!(style in STYLES)) throw new Error(`Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`);
        if (!(palette in PALETTES)) throw new Error(`Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`);
        if (!(archetype in ARCHETYPES)) throw new Error(`Unknown archetype: ${archetype}. Available: ${Object.keys(ARCHETYPES).join(", ")}`);
        const result = exportProject(style, palette, archetype, projectName);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "generate_palette_variants": {
        const { colors } = args as { colors: string[] };
        if (!Array.isArray(colors) || colors.length === 0) throw new Error("colors must be a non-empty array of hex strings");
        const variants = generatePaletteVariants(colors);
        return { content: [{ type: "text", text: JSON.stringify(variants, null, 2) }] };
      }

      case "get_cross_cutting_rules": {
        const { category } = args as { category: string };
        if (!(category in CROSS_CUTTING)) throw new Error(`Unknown category: ${category}. Available: ${Object.keys(CROSS_CUTTING).join(", ")}`);
        const section = CROSS_CUTTING[category as keyof typeof CROSS_CUTTING];
        const text = `## ${section.label}\n\n${section.rules.map((r) => `- ${r}`).join("\n")}\n`;
        return { content: [{ type: "text", text }] };
      }

      case "get_component": {
        const { component, style, framework = "html" } = args as { component: string; style: string; framework?: string };
        if (!COMPONENT_TYPES.includes(component as any)) throw new Error(`Unknown component: ${component}. Available: ${COMPONENT_TYPES.join(", ")}`);
        if (!(style in STYLES)) throw new Error(`Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`);
        if (!OUTPUT_FRAMEWORKS.includes(framework as OutputFramework)) throw new Error(`Unknown framework: ${framework}. Available: ${OUTPUT_FRAMEWORKS.join(", ")}`);
        const output = _getComponent(component as any, style, framework as OutputFramework);
        return { content: [{ type: "text", text: output }] };
      }

      case "audit_accessibility": {
        const { html } = args as { html: string };
        if (!html || typeof html !== "string") throw new Error("html is required and must be a string");
        const result = auditA11y(html);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "generate_css_output": {
        const CSS_FORMATS: CSSOutputFormat[] = ["vanilla", "css-modules", "scss", "css-variables-only"];
        const { style, palette, format } = args as { style: string; palette: string; format: string };
        if (!CSS_FORMATS.includes(format as CSSOutputFormat)) throw new Error(`Unknown format: ${format}. Available: ${CSS_FORMATS.join(", ")}`);
        const result = generateCSSOutput(style, palette, format as CSSOutputFormat);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "generate_template": {
        const { style, palette, archetype } = args as { style: string; palette: string; archetype: string };
        if (!(style in STYLES)) throw new Error(`Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`);
        if (!(palette in PALETTES)) throw new Error(`Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`);
        if (!(archetype in ARCHETYPES)) throw new Error(`Unknown archetype: ${archetype}. Available: ${Object.keys(ARCHETYPES).join(", ")}`);
        const html = generateTemplate(style, palette, archetype);
        return { content: [{ type: "text", text: html }] };
      }

      case "generate_tailwind_config": {
        const { style, palette } = args as { style: string; palette: string };
        if (!(style in STYLES)) throw new Error(`Unknown style: ${style}. Available: ${Object.keys(STYLES).join(", ")}`);
        if (!(palette in PALETTES)) throw new Error(`Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`);
        const result = generateTailwindConfig(style, palette);
        return { content: [{ type: "text", text: result.code }] };
      }

      case "brand_list": {
        const { category } = args as { category?: string };
        const catalog = category ? { [category]: BRAND_CATALOG[category] ?? [] } : BRAND_CATALOG;
        return { content: [{ type: "text", text: JSON.stringify(catalog, null, 2) }] };
      }

      // === New tools ===

      case "pre_flight_scan": {
        const { project_path } = args as { project_path?: string };
        const result = scanProject(project_path);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "anti_pattern_check": {
        const { content, genre = "editorial" } = args as { content: string; genre?: string };
        const result = runSlopTest(content, genre);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "self_critique": {
        const { content } = args as { content: string };
        const result = selfCritique(content);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "generate_tokens": {
        const { theme_name, genre, last_theme, last_accent } = args as {
          theme_name?: string; genre?: string; last_theme?: string; last_accent?: string;
        };
        const result = generateTokens(theme_name, genre, last_theme, last_accent);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_themes": {
        const { genre } = args as { genre?: string };
        const themes = listThemes(genre);
        return { content: [{ type: "text", text: JSON.stringify(themes, null, 2) }] };
      }

      case "detect_genre": {
        const { brief } = args as { brief: string };
        const genre = detectGenre(brief);
        return { content: [{ type: "text", text: JSON.stringify({ brief, detected_genre: genre }, null, 2) }] };
      }

      case "generate_8state_component": {
        const { kind } = args as { kind: string };
        const html = generate8StateWrapperHtml(kind as ComponentKind);
        return { content: [{ type: "text", text: html }] };
      }

      case "build_custom_tokens": {
        const { paper_l, paper_c, paper_h, accent_l, accent_c, accent_h, font_display, font_body, font_mono } = args as {
          paper_l: number; paper_c: number; paper_h: number;
          accent_l: number; accent_c: number; accent_h: number;
          font_display: string; font_body: string; font_mono?: string;
        };
        const result = buildCustomTokens(
          { l: paper_l, c: paper_c, h: paper_h },
          { l: accent_l, c: accent_c, h: accent_h },
          font_display, font_body, font_mono
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "generate_motion_snippet": {
        const { category, style, engine = "motion.dev", framework = "react" } = args as { category: string; style: string; engine?: string; framework?: string };
        if (!MOTION_CATEGORIES.includes(category as MotionCategory)) {
          throw new Error(`Unknown category: ${category}. Available: ${MOTION_CATEGORIES.join(", ")}`);
        }
        let result;
        if (engine === "animejs") {
          result = generateMotionSnippet(category as MotionCategory, style);
        } else {
          result = generateMotionDevSnippet(category as MotionCategory, style, framework as MotionFramework);
        }
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
