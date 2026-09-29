import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = join(__dirname, "..");

interface FontStack {
  detected: boolean;
  fonts: string[];
  sources: string[];
}

interface PaletteInfo {
  detected: boolean;
  tokens: string[];
  source: string;
  format: "tailwind" | "css-custom" | "dtcg" | "unknown";
}

interface MicrointeractionStance {
  motionOn: boolean;
  libraries: string[];
}

interface PreFlightResult {
  framework: string | null;
  fontStack: FontStack;
  palette: PaletteInfo;
  motionStance: MicrointeractionStance;
  spacingScale: string | null;
  hasDesignMd: boolean;
  findings: string[];
  preserved: string[];
  introduced: string[];
}

export function scanProject(projectPath?: string): PreFlightResult {
  const root = projectPath ?? MCP_ROOT;

  const result: PreFlightResult = {
    framework: null,
    fontStack: { detected: false, fonts: [], sources: [] },
    palette: { detected: false, tokens: [], source: "", format: "unknown" },
    motionStance: { motionOn: false, libraries: [] },
    spacingScale: null,
    hasDesignMd: false,
    findings: [],
    preserved: [],
    introduced: [],
  };

  const pkgPath = join(root, "package.json");
  const hasPkg = existsSync(pkgPath);
  let pkg: Record<string, any> = {};
  if (hasPkg) {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      /* ignore */
    }
  }

  const deps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
  const depNames = Object.keys(deps);

  // Framework detection
  if (depNames.includes("next")) {
    result.framework = "Next.js";
    if (deps.next) result.framework += ` ${deps.next}`;
  } else if (depNames.includes("astro")) {
    result.framework = "Astro";
  } else if (depNames.includes("vue") || depNames.includes("@vue/cli")) {
    result.framework = "Vue";
  } else if (
    depNames.includes("svelte") ||
    depNames.includes("@sveltejs/kit")
  ) {
    result.framework = "Svelte/SvelteKit";
  } else if (depNames.includes("@remix-run/react")) {
    result.framework = "Remix";
  } else if (depNames.includes("react") || depNames.includes("react-dom")) {
    result.framework = "React";
  }
  result.findings.push(`Framework: ${result.framework ?? "none (vanilla)"}`);

  // Font stack detection
  const fontLibs = [
    "next/font",
    "@fontsource",
    "expo-google-fonts",
    "geist",
    "typeface-",
    "fontsource-",
  ].filter((l) => depNames.some((d) => d.includes(l)));
  if (fontLibs.length > 0) {
    result.fontStack.detected = true;
    result.fontStack.fonts.push(...fontLibs);
    result.fontStack.sources.push("package.json");
    result.findings.push(`Font stack: found via ${fontLibs.join(", ")}`);
  }

  // Look for Google Fonts in HTML/JSX files
  const srcDir = join(root, "src");
  const appDir = join(root, "app");
  for (const dir of [root, srcDir, appDir]) {
    if (!existsSync(dir)) continue;
    try {
      const files = require("fs").readdirSync(dir);
      for (const f of files) {
        if (!f.endsWith(".html") && !f.endsWith(".tsx") && !f.endsWith(".jsx"))
          continue;
        const content = readFileSync(join(dir, f), "utf8");
        const gfMatch = content.match(
          /fonts\.googleapis\.com\/css2?\?family=([^"']+)/,
        );
        if (gfMatch) {
          result.fontStack.detected = true;
          const families = gfMatch[1]
            .split("&")[0]
            .split("|")
            .map((s) => s.replace(/:[^:]*$/, ""));
          result.fontStack.fonts.push(...families);
          result.fontStack.sources.push(`${dir}/${f}`);
        }
      }
    } catch {
      /* ignore */
    }
  }

  // Palette detection
  const cssFiles: string[] = [];
  for (const dir of [root, join(root, "src"), join(root, "app")]) {
    if (!existsSync(dir)) continue;
    try {
      const entries = require("fs").readdirSync(dir, {
        recursive: true,
      }) as string[];
      cssFiles.push(
        ...entries
          .filter((e: string) => e.endsWith(".css"))
          .map((e: string) => join(dir, e)),
      );
    } catch {
      /* ignore */
    }
  }

  for (const cssPath of cssFiles) {
    try {
      const content = readFileSync(cssPath, "utf8");
      const oklchColors = content.match(/--[\w-]+:\s*oklch\([^;]+\)/g);
      if (oklchColors && oklchColors.length > 0) {
        result.palette.detected = true;
        result.palette.tokens.push(...oklchColors.map((c) => c.trim()));
        result.palette.source = cssPath;
        result.palette.format = "css-custom";
      }

      const hexVars = content.match(/--[\w-]+:\s*#[0-9a-fA-F]{3,8}/g);
      if (hexVars && hexVars.length > 0) {
        result.palette.detected = true;
        result.palette.tokens.push(...hexVars.map((c) => c.trim()));
        result.palette.source = cssPath;
        result.palette.format =
          result.palette.format === "css-custom" ? "css-custom" : "css-custom";
      }
    } catch {
      /* ignore */
    }
  }

  // Tailwind config
  const twConfigFiles = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
  ];
  for (const tw of twConfigFiles) {
    const twPath = join(root, tw);
    if (existsSync(twPath)) {
      const content = readFileSync(twPath, "utf8");
      const colorMatch = content.match(/colors:\s*\{([^}]+)\}/);
      if (colorMatch) {
        result.palette.detected = true;
        result.palette.source = twPath;
        result.palette.format = "tailwind";
        result.palette.tokens.push(`tailwind colors found in ${tw}`);
      }
    }
  }

  // DTCG tokens
  const dtcgPaths = ["tokens.json", "tokens.yaml", "design-tokens.json"];
  for (const dt of dtcgPaths) {
    if (existsSync(join(root, dt))) {
      result.palette.detected = true;
      result.palette.source = join(root, dt);
      result.palette.format = "dtcg";
      result.palette.tokens.push(`DTCG tokens: ${dt}`);
    }
  }

  if (result.palette.detected) {
    result.findings.push(
      `Palette: ${result.palette.format} tokens (${result.palette.source})`,
    );
  } else {
    result.findings.push("Palette: none detected");
  }

  // Microinteraction stance
  const motionLibs = [
    "framer-motion",
    "gsap",
    "motion",
    "lenis",
    "lottie-react",
    "@react-spring/web",
    "@react-spring/three",
    "auto-animate",
  ];
  for (const ml of motionLibs) {
    if (depNames.includes(ml)) {
      result.motionStance.motionOn = true;
      result.motionStance.libraries.push(ml);
    }
  }

  if (result.motionStance.motionOn) {
    result.findings.push(`Motion: ${result.motionStance.libraries.join(", ")}`);
  } else {
    result.findings.push("Motion: motion-cut (no animation library)");
  }

  // Spacing scale
  const twConfigPath = [
    join(root, "tailwind.config.js"),
    join(root, "tailwind.config.ts"),
  ].find(existsSync);
  if (twConfigPath) {
    const content = readFileSync(twConfigPath, "utf8");
    if (content.includes("spacing")) {
      result.spacingScale = "tailwind extend.spacing";
      result.findings.push("Spacing: Tailwind spacing (custom)");
    } else {
      result.spacingScale = "tailwind default";
      result.findings.push("Spacing: Tailwind default");
    }
  }

  // design.md
  result.hasDesignMd =
    existsSync(join(root, "design.md")) || existsSync(join(root, "DESIGN.md"));
  if (result.hasDesignMd) {
    result.findings.push("design.md detected — system-managed project");
  }

  // Determine what's preserved vs introduced
  if (result.fontStack.detected) result.preserved.push("font stack");
  if (result.palette.detected) result.preserved.push("palette/tokens");
  if (result.framework) result.preserved.push("framework structure");
  if (result.motionStance.motionOn)
    result.preserved.push("motion library stance");

  result.introduced.push("macrostructure & section rhythm");
  result.introduced.push("microinteraction discipline");
  result.introduced.push("design-token references");
  result.introduced.push("quality gates (anti-pattern check)");

  return result;
}
