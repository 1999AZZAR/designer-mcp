/**
 * css-output.ts
 * Generates vanilla CSS, CSS Modules, SCSS, and CSS-variables-only output
 * from the design token system and component styles.
 *
 * Self-contained: all color/token data is inlined to avoid circular deps.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CSSOutputFormat =
  | "vanilla"
  | "css-modules"
  | "scss"
  | "css-variables-only";

export interface CSSOutputFile {
  filename: string;
  content: string;
}

export interface CSSOutputResult {
  format: CSSOutputFormat;
  style: string;
  palette: string;
  files: CSSOutputFile[];
  /** Paste-ready markdown usage instructions */
  usage: string;
}

// ---------------------------------------------------------------------------
// Internal token types
// ---------------------------------------------------------------------------

interface PaletteTokens {
  paper: string;
  paperAlt: string;
  surface: string;
  primary: string;
  primaryFg: string;
  secondary: string;
  secondaryFg: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  focus: string;
  backdropFilter?: string;
  glassBg?: string;
}

interface StyleTokens {
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  fontBody: string;
  fontMono: string;
  borderWidth: string;
}

// ---------------------------------------------------------------------------
// Palette colour lookup
// ---------------------------------------------------------------------------

function getPaletteTokens(palette: string, style: string): PaletteTokens {
  const isNeoBrut = style === "neo-brutalism";
  const isGlass = style === "glass";
  const isNeu = style === "neumorphism";

  switch (palette) {
    case "pastel":
      return {
        paper: "oklch(96% 0.02 85)",
        paperAlt: "oklch(93% 0.025 85)",
        surface: "oklch(98% 0.01 85)",
        primary: "oklch(60% 0.15 250)",
        primaryFg: "oklch(99% 0.005 0)",
        secondary: "oklch(65% 0.12 160)",
        secondaryFg: "oklch(99% 0.005 0)",
        accent: "oklch(70% 0.14 330)",
        text: "oklch(22% 0.02 250)",
        textMuted: "oklch(50% 0.04 250)",
        border: isNeoBrut ? "oklch(10% 0 0)" : "oklch(80% 0.03 250)",
        focus: "oklch(55% 0.20 250)",
        ...(isGlass
          ? {
              backdropFilter: "blur(12px) saturate(1.6)",
              glassBg: "oklch(96% 0.02 85 / 0.55)",
            }
          : {}),
      };

    case "dark":
      return {
        paper: "oklch(10% 0.02 240)",
        paperAlt: "oklch(14% 0.025 240)",
        surface: "oklch(17% 0.02 240)",
        primary: "oklch(55% 0.25 250)",
        primaryFg: "oklch(98% 0.005 0)",
        secondary: "oklch(50% 0.20 160)",
        secondaryFg: "oklch(98% 0.005 0)",
        accent: "oklch(62% 0.22 50)",
        text: "oklch(92% 0.01 250)",
        textMuted: "oklch(65% 0.04 250)",
        border: isNeoBrut ? "oklch(95% 0 0)" : "oklch(28% 0.04 240)",
        focus: "oklch(60% 0.28 250)",
        ...(isGlass
          ? {
              backdropFilter: "blur(16px) saturate(1.8)",
              glassBg: "oklch(14% 0.025 240 / 0.60)",
            }
          : {}),
      };

    case "vibrant":
      return {
        paper: "oklch(98% 0.01 85)",
        paperAlt: "oklch(95% 0.015 85)",
        surface: "oklch(99% 0.005 85)",
        primary: "oklch(50% 0.35 250)",
        primaryFg: "oklch(99% 0.005 0)",
        secondary: "oklch(52% 0.30 160)",
        secondaryFg: "oklch(99% 0.005 0)",
        accent: "oklch(55% 0.38 30)",
        text: "oklch(12% 0.01 250)",
        textMuted: "oklch(40% 0.04 250)",
        border: isNeoBrut ? "oklch(5% 0 0)" : "oklch(82% 0.04 250)",
        focus: "oklch(45% 0.40 250)",
        ...(isGlass
          ? {
              backdropFilter: "blur(10px) saturate(2.0)",
              glassBg: "oklch(98% 0.01 85 / 0.50)",
            }
          : {}),
      };

    case "mono":
    default:
      return {
        paper: "oklch(97% 0.005 0)",
        paperAlt: "oklch(93% 0.005 0)",
        surface: "oklch(99% 0.002 0)",
        primary: "oklch(20% 0.005 0)",
        primaryFg: "oklch(99% 0.002 0)",
        secondary: "oklch(40% 0.005 0)",
        secondaryFg: "oklch(99% 0.002 0)",
        accent: "oklch(30% 0.005 0)",
        text: "oklch(12% 0.005 0)",
        textMuted: "oklch(50% 0.005 0)",
        border: isNeu
          ? "transparent"
          : isNeoBrut
            ? "oklch(5% 0 0)"
            : "oklch(80% 0.005 0)",
        focus: "oklch(15% 0.005 0)",
        ...(isGlass
          ? {
              backdropFilter: "blur(8px) saturate(1.2)",
              glassBg: "oklch(97% 0.005 0 / 0.55)",
            }
          : {}),
      };
  }
}

// ---------------------------------------------------------------------------
// Style structural tokens
// ---------------------------------------------------------------------------

function getStyleTokens(style: string): StyleTokens {
  const zero = "0px";

  const radiusMap: Record<string, [string, string, string, string]> = {
    fluent: ["4px", "6px", "8px", "12px"],
    ant: ["4px", "6px", "8px", "12px"],
    carbon: [zero, zero, zero, zero],
    atlassian: ["4px", "6px", "8px", "12px"],
    "apple-hig": ["8px", "12px", "16px", "20px"],
    polaris: ["4px", "6px", "8px", "12px"],
    material: ["8px", "12px", "16px", "28px"],
    minimal: ["4px", "6px", "8px", "12px"],
    glass: ["8px", "12px", "16px", "24px"],
    neumorphism: ["12px", "16px", "24px", "32px"],
    "neo-brutalism": [zero, zero, zero, zero],
    claymorphism: ["16px", "24px", "32px", "40px"],
    skeuomorphism: ["4px", "6px", "8px", "12px"],
    swiss: [zero, zero, zero, zero],
    "swiss-archival": ["2px", "4px", "6px", "8px"],
    "m3-pastel": ["12px", "16px", "24px", "28px"],
    "neo-m3": [zero, "4px", "8px", "16px"],
  };

  const shadowMap: Record<string, [string, string, string, string]> = {
    fluent: [
      "0 1px 2px rgba(0,0,0,0.06)",
      "0 2px 4px rgba(0,0,0,0.08)",
      "0 4px 12px rgba(0,0,0,0.12)",
      "0 8px 24px rgba(0,0,0,0.16)",
    ],
    ant: [
      "0 1px 2px rgba(0,0,0,0.05)",
      "0 3px 6px rgba(0,0,0,0.08)",
      "0 6px 16px rgba(0,0,0,0.10)",
      "0 12px 40px rgba(0,0,0,0.12)",
    ],
    carbon: [
      "0 1px 0 rgba(0,0,0,0.16)",
      "0 2px 0 rgba(0,0,0,0.16)",
      "0 4px 0 rgba(0,0,0,0.16)",
      "0 8px 0 rgba(0,0,0,0.16)",
    ],
    atlassian: [
      "0 1px 2px rgba(0,0,0,0.06)",
      "0 2px 8px rgba(0,0,0,0.10)",
      "0 4px 16px rgba(0,0,0,0.14)",
      "0 8px 32px rgba(0,0,0,0.18)",
    ],
    "apple-hig": [
      "0 1px 3px rgba(0,0,0,0.08)",
      "0 2px 8px rgba(0,0,0,0.10)",
      "0 4px 16px rgba(0,0,0,0.12)",
      "0 8px 32px rgba(0,0,0,0.14)",
    ],
    polaris: [
      "0 1px 2px rgba(0,0,0,0.05)",
      "0 3px 6px rgba(0,0,0,0.08)",
      "0 6px 16px rgba(0,0,0,0.10)",
      "0 12px 40px rgba(0,0,0,0.12)",
    ],
    material: [
      "0 1px 3px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.24)",
      "0 3px 6px rgba(0,0,0,0.16),0 3px 6px rgba(0,0,0,0.23)",
      "0 10px 20px rgba(0,0,0,0.19),0 6px 6px rgba(0,0,0,0.23)",
      "0 14px 28px rgba(0,0,0,0.25),0 10px 10px rgba(0,0,0,0.22)",
    ],
    minimal: [
      "0 1px 3px rgba(0,0,0,0.04)",
      "0 2px 8px rgba(0,0,0,0.06)",
      "0 4px 16px rgba(0,0,0,0.08)",
      "0 8px 32px rgba(0,0,0,0.10)",
    ],
    glass: [
      "0 1px 3px rgba(0,0,0,0.10)",
      "0 4px 12px rgba(0,0,0,0.15)",
      "0 8px 24px rgba(0,0,0,0.20)",
      "0 16px 48px rgba(0,0,0,0.25)",
    ],
    neumorphism: [
      "4px 4px 8px rgba(0,0,0,0.15),-4px -4px 8px rgba(255,255,255,0.7)",
      "6px 6px 12px rgba(0,0,0,0.15),-6px -6px 12px rgba(255,255,255,0.7)",
      "8px 8px 16px rgba(0,0,0,0.15),-8px -8px 16px rgba(255,255,255,0.7)",
      "12px 12px 24px rgba(0,0,0,0.15),-12px -12px 24px rgba(255,255,255,0.7)",
    ],
    "neo-brutalism": [
      "2px 2px 0px rgba(0,0,0,1)",
      "4px 4px 0px rgba(0,0,0,1)",
      "6px 6px 0px rgba(0,0,0,1)",
      "8px 8px 0px rgba(0,0,0,1)",
    ],
    claymorphism: [
      "2px 2px 4px rgba(0,0,0,0.08),inset 0 -2px 4px rgba(0,0,0,0.04)",
      "4px 4px 8px rgba(0,0,0,0.10),inset 0 -4px 8px rgba(0,0,0,0.06)",
      "6px 6px 12px rgba(0,0,0,0.12),inset 0 -6px 12px rgba(0,0,0,0.08)",
      "8px 8px 16px rgba(0,0,0,0.14),inset 0 -8px 16px rgba(0,0,0,0.10)",
    ],
    skeuomorphism: [
      "0 1px 2px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.4)",
      "0 2px 6px rgba(0,0,0,0.20),inset 0 1px 0 rgba(255,255,255,0.4)",
      "0 4px 12px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.4)",
      "0 8px 24px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,255,255,0.4)",
    ],
    swiss: ["none", "none", "none", "none"],
    "swiss-archival": [
      "none",
      "0 1px 0 rgba(0,0,0,0.12)",
      "0 2px 0 rgba(0,0,0,0.12)",
      "0 4px 0 rgba(0,0,0,0.12)",
    ],
    "m3-pastel": [
      "0 1px 3px rgba(0,0,0,0.10)",
      "0 2px 8px rgba(0,0,0,0.12)",
      "0 4px 16px rgba(0,0,0,0.14)",
      "0 8px 32px rgba(0,0,0,0.18)",
    ],
    "neo-m3": [
      "0 1px 3px rgba(0,0,0,0.12)",
      "0 2px 8px rgba(0,0,0,0.16),4px 4px 0px rgba(0,0,0,0.08)",
      "0 4px 16px rgba(0,0,0,0.20),6px 6px 0px rgba(0,0,0,0.10)",
      "0 8px 32px rgba(0,0,0,0.24),8px 8px 0px rgba(0,0,0,0.12)",
    ],
  };

  const fontMap: Record<string, [string, string]> = {
    fluent: ['"Segoe UI", system-ui, -apple-system, sans-serif', "monospace"],
    ant: [
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '"SFMono-Regular", Consolas, monospace',
    ],
    carbon: [
      '"IBM Plex Sans", system-ui, sans-serif',
      '"IBM Plex Mono", monospace',
    ],
    atlassian: [
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      "monospace",
    ],
    "apple-hig": [
      '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
      '"SF Mono", monospace',
    ],
    polaris: [
      '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      "monospace",
    ],
    material: [
      '"Roboto", "Google Sans", system-ui, sans-serif',
      '"Roboto Mono", monospace',
    ],
    minimal: [
      '"Inter", "SF Pro Display", system-ui, sans-serif',
      '"JetBrains Mono", monospace',
    ],
    glass: [
      '"Inter", "SF Pro Display", system-ui, sans-serif',
      '"JetBrains Mono", monospace',
    ],
    neumorphism: [
      '"Inter", "SF Pro Display", system-ui, sans-serif',
      '"JetBrains Mono", monospace',
    ],
    "neo-brutalism": [
      '"Space Grotesk", "Inter", system-ui, sans-serif',
      '"JetBrains Mono", monospace',
    ],
    claymorphism: [
      '"Nunito", "Inter", system-ui, sans-serif',
      '"JetBrains Mono", monospace',
    ],
    skeuomorphism: ['"Georgia", "Times New Roman", serif', "monospace"],
    swiss: [
      '"Helvetica Neue", "Helvetica", "Arial", sans-serif',
      '"Courier New", monospace',
    ],
    "swiss-archival": [
      '"IBM Plex Sans", "Helvetica Neue", sans-serif',
      '"IBM Plex Mono", monospace',
    ],
    "m3-pastel": [
      '"Google Sans", "Roboto", system-ui, sans-serif',
      '"Roboto Mono", monospace',
    ],
    "neo-m3": [
      '"Space Grotesk", "Inter", system-ui, sans-serif',
      '"JetBrains Mono", monospace',
    ],
  };

  const r = radiusMap[style] ?? radiusMap["minimal"]!;
  const s = shadowMap[style] ?? shadowMap["minimal"]!;
  const f = fontMap[style] ?? fontMap["minimal"]!;

  return {
    radiusSm: r[0],
    radiusMd: r[1],
    radiusLg: r[2],
    radiusXl: r[3],
    shadowSm: s[0],
    shadowMd: s[1],
    shadowLg: s[2],
    shadowXl: s[3],
    fontBody: f[0],
    fontMono: f[1],
    borderWidth: style === "neo-brutalism" ? "2px" : "1px",
  };
}

// ---------------------------------------------------------------------------
// Shared root vars block
// ---------------------------------------------------------------------------

function buildRootVars(
  p: PaletteTokens,
  st: StyleTokens,
  style: string,
): string {
  const isGlass = style === "glass";
  const glassPart = isGlass
    ? `\n  /* Glass tokens */\n  --glass-bg: ${p.glassBg ?? "transparent"};\n  --glass-filter: ${p.backdropFilter ?? "none"};`
    : "";

  return `  /* Colors */
  --color-paper: ${p.paper};
  --color-paper-alt: ${p.paperAlt};
  --color-surface: ${p.surface};
  --color-primary: ${p.primary};
  --color-primary-fg: ${p.primaryFg};
  --color-secondary: ${p.secondary};
  --color-secondary-fg: ${p.secondaryFg};
  --color-accent: ${p.accent};
  --color-text: ${p.text};
  --color-text-muted: ${p.textMuted};
  --color-border: ${p.border};
  --color-focus: ${p.focus};
  --color-success: oklch(55% 0.20 145);
  --color-error: oklch(52% 0.25 25);
  --color-warning: oklch(72% 0.18 75);
  --color-info: oklch(60% 0.18 240);${glassPart}

  /* Spacing (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Typography */
  --font-body: ${st.fontBody};
  --font-mono: ${st.fontMono};
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-display: clamp(2.5rem, 6vw, 4.5rem);
  --leading-tight: 1.25;
  --leading-base: 1.5;
  --leading-loose: 1.75;
  --tracking-tight: -0.025em;
  --tracking-base: 0em;
  --tracking-wide: 0.05em;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Border radius */
  --radius-sm: ${st.radiusSm};
  --radius-md: ${st.radiusMd};
  --radius-lg: ${st.radiusLg};
  --radius-xl: ${st.radiusXl};
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: ${st.shadowSm};
  --shadow-md: ${st.shadowMd};
  --shadow-lg: ${st.shadowLg};
  --shadow-xl: ${st.shadowXl};

  /* Borders */
  --border-width: ${st.borderWidth};
  --border: var(--border-width) solid var(--color-border);

  /* Easings */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 0.68, 0.06);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* Durations */
  --dur-fast: 150ms;
  --dur-base: 250ms;
  --dur-slow: 400ms;

  /* Z-index scale */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;`;
}

function buildDarkOverrideVars(palette: string): string {
  if (palette === "dark") {
    return `  --color-paper: oklch(10% 0.02 240);
  --color-paper-alt: oklch(14% 0.025 240);
  --color-surface: oklch(17% 0.02 240);
  --color-text: oklch(92% 0.01 250);
  --color-text-muted: oklch(65% 0.04 250);
  --color-border: oklch(28% 0.04 240);`;
  }

  const darkMap: Record<string, string[]> = {
    pastel: [
      "oklch(12% 0.02 250)",
      "oklch(16% 0.025 250)",
      "oklch(19% 0.02 250)",
      "oklch(88% 0.01 250)",
      "oklch(62% 0.04 250)",
      "oklch(30% 0.04 250)",
    ],
    vibrant: [
      "oklch(8% 0.01 250)",
      "oklch(12% 0.015 250)",
      "oklch(15% 0.01 250)",
      "oklch(90% 0.01 250)",
      "oklch(60% 0.04 250)",
      "oklch(25% 0.04 250)",
    ],
    mono: [
      "oklch(8% 0.003 0)",
      "oklch(12% 0.003 0)",
      "oklch(15% 0.003 0)",
      "oklch(90% 0.003 0)",
      "oklch(60% 0.003 0)",
      "oklch(25% 0.003 0)",
    ],
  };

  const v = darkMap[palette] ?? darkMap["pastel"]!;
  return `  --color-paper: ${v[0]};
  --color-paper-alt: ${v[1]};
  --color-surface: ${v[2]};
  --color-text: ${v[3]};
  --color-text-muted: ${v[4]};
  --color-border: ${v[5]};`;
}

// ---------------------------------------------------------------------------
// Format: vanilla
// ---------------------------------------------------------------------------

function buildVanillaTokensCSS(
  p: PaletteTokens,
  st: StyleTokens,
  style: string,
  palette: string,
): string {
  const label =
    style.charAt(0).toUpperCase() + style.slice(1).replace(/-/g, " ");
  return `/**
 * tokens.css — Design tokens for ${label} x ${palette}
 * Generated by the-designer · vanilla format
 */

:root {
${buildRootVars(p, st, style)}
}
`;
}

function buildVanillaBaseCSS(style: string): string {
  const isNeoBrut = style === "neo-brutalism";
  const isNeu = style === "neumorphism";

  const btnBorderRule = isNeoBrut
    ? "  border: var(--border-width) solid var(--color-text);\n  box-shadow: var(--shadow-md);"
    : isNeu
      ? "  box-shadow: var(--shadow-md);\n  border: none;"
      : "  border: var(--border);";

  return `/**
 * base.css — Base styles and utility component classes
 * Generated by the-designer · vanilla format
 */

@import './tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-base);
  color: var(--color-text);
  background-color: var(--color-paper);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--color-primary);
  text-decoration-color: var(--color-primary);
  transition: opacity var(--dur-fast) var(--ease-out);
}
a:hover { opacity: 0.8; }
a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

img, video { display: block; max-width: 100%; }
code, pre { font-family: var(--font-mono); font-size: var(--text-sm); }

/* --- .btn ---------------------------------------------------------------- */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-tight);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    opacity var(--dur-fast) var(--ease-out);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
${btnBorderRule}
}

.btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.btn:disabled, .btn[aria-disabled="true"] { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

.btn-primary   { background-color: var(--color-primary); color: var(--color-primary-fg); border-color: var(--color-primary); }
.btn-primary:hover { filter: brightness(0.92); }
.btn-secondary { background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
.btn-secondary:hover { background-color: var(--color-paper-alt); }
.btn-outline   { background-color: transparent; color: var(--color-primary); border: var(--border-width) solid var(--color-primary); }
.btn-outline:hover { background-color: var(--color-primary); color: var(--color-primary-fg); }
.btn-ghost     { background-color: transparent; color: var(--color-text); border: none; }
.btn-ghost:hover { background-color: var(--color-paper-alt); }

/* --- .card --------------------------------------------------------------- */

.card { background-color: var(--color-surface); border: var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-header { padding: var(--space-4) var(--space-6); border-bottom: var(--border); font-weight: var(--font-weight-semibold); }
.card-body   { padding: var(--space-6); }
.card-footer { padding: var(--space-4) var(--space-6); border-top: var(--border); background-color: var(--color-paper-alt); }

/* --- .input -------------------------------------------------------------- */

.input {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-base);
  color: var(--color-text);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
  appearance: none;
}
.input:focus { outline: none; border-color: var(--color-focus); box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-focus) 20%, transparent); }
.input:disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--color-paper-alt); }
.input--error   { border-color: var(--color-error); }
.input--success { border-color: var(--color-success); }

/* --- .badge -------------------------------------------------------------- */

.badge { display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-2); font-size: var(--text-xs); font-weight: var(--font-weight-medium); border-radius: var(--radius-full); background-color: var(--color-paper-alt); color: var(--color-text-muted); border: var(--border-width) solid var(--color-border); }
.badge-primary { background-color: var(--color-primary); color: var(--color-primary-fg); border-color: var(--color-primary); }
.badge-success { background-color: oklch(90% 0.10 145); color: oklch(30% 0.20 145); border-color: oklch(75% 0.15 145); }
.badge-error   { background-color: oklch(92% 0.10 25);  color: oklch(35% 0.25 25);  border-color: oklch(78% 0.15 25); }
.badge-warning { background-color: oklch(94% 0.10 75);  color: oklch(40% 0.18 75);  border-color: oklch(80% 0.14 75); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;
}

function buildVanillaComponentsCSS(): string {
  return `/**
 * components.css — Layout component styles
 * Generated by the-designer · vanilla format
 * All values reference var(--*) tokens from tokens.css.
 */

/* --- .navbar ------------------------------------------------------------- */

.navbar {
  position: sticky; top: 0; z-index: var(--z-sticky);
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
  height: 56px; padding: 0 var(--space-6);
  background-color: var(--color-surface); border-bottom: var(--border); box-shadow: var(--shadow-sm);
}
.navbar-brand { font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: var(--color-text); text-decoration: none; }
.navbar-nav   { display: flex; align-items: center; gap: var(--space-1); list-style: none; }
.navbar-link  { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); color: var(--color-text-muted); text-decoration: none; border-radius: var(--radius-md); transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out); }
.navbar-link:hover, .navbar-link[aria-current="page"] { background-color: var(--color-paper-alt); color: var(--color-text); }

/* --- .sidebar ------------------------------------------------------------ */

.sidebar {
  position: fixed; inset-block: 0; inset-inline-start: 0; z-index: var(--z-raised);
  display: flex; flex-direction: column; width: 256px;
  background-color: var(--color-surface); border-inline-end: var(--border); overflow-y: auto;
}
.sidebar-header { padding: var(--space-6); border-bottom: var(--border); }
.sidebar-nav    { flex: 1; padding: var(--space-4); list-style: none; display: flex; flex-direction: column; gap: var(--space-1); }
.sidebar-link   { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); font-size: var(--text-sm); color: var(--color-text-muted); text-decoration: none; border-radius: var(--radius-md); transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out); }
.sidebar-link:hover, .sidebar-link[aria-current="page"] { background-color: var(--color-paper-alt); color: var(--color-text); }
.sidebar-link[aria-current="page"] { font-weight: var(--font-weight-medium); }

/* --- .modal -------------------------------------------------------------- */

.modal-backdrop { position: fixed; inset: 0; z-index: var(--z-overlay); background-color: oklch(0% 0 0 / 0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal          { position: relative; z-index: var(--z-modal); width: 100%; max-width: 560px; max-height: calc(100vh - var(--space-8)); display: flex; flex-direction: column; background-color: var(--color-surface); border: var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); overflow: hidden; }
.modal-header   { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: var(--border); font-weight: var(--font-weight-semibold); }
.modal-body     { flex: 1; padding: var(--space-6); overflow-y: auto; }
.modal-footer   { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: var(--border); background-color: var(--color-paper-alt); }

/* --- .hero --------------------------------------------------------------- */

.hero            { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--space-24) var(--space-6); background-color: var(--color-paper); }
.hero-eyebrow    { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--color-primary); margin-bottom: var(--space-4); }
.hero-headline   { font-size: var(--text-display); font-weight: var(--font-weight-bold); line-height: var(--leading-tight); letter-spacing: var(--tracking-tight); color: var(--color-text); max-width: 18ch; margin-bottom: var(--space-6); }
.hero-subheadline{ font-size: var(--text-xl); line-height: var(--leading-base); color: var(--color-text-muted); max-width: 46ch; margin-bottom: var(--space-8); }
.hero-actions    { display: flex; flex-wrap: wrap; gap: var(--space-3); justify-content: center; }

/* --- .footer ------------------------------------------------------------- */

.footer         { background-color: var(--color-paper-alt); border-top: var(--border); padding: var(--space-12) var(--space-6); }
.footer-grid    { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--space-8); max-width: 1280px; margin: 0 auto; }
.footer-heading { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--color-text); margin-bottom: var(--space-4); }
.footer-nav     { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); }
.footer-link    { font-size: var(--text-sm); color: var(--color-text-muted); text-decoration: none; transition: color var(--dur-fast) var(--ease-out); }
.footer-link:hover { color: var(--color-text); }
.footer-bottom  { max-width: 1280px; margin: var(--space-8) auto 0; padding-top: var(--space-6); border-top: var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .navbar  { padding: 0 var(--space-4); }
  .modal   { max-width: 100%; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .modal-backdrop { align-items: flex-end; padding: 0; }
}
`;
}

// ---------------------------------------------------------------------------
// Format: css-modules
// ---------------------------------------------------------------------------

function buildButtonModuleCSS(style: string): string {
  const isNeoBrut = style === "neo-brutalism";
  const isNeu = style === "neumorphism";
  const baseExtras = isNeoBrut
    ? "  border: 2px solid var(--color-text);\n  box-shadow: var(--shadow-md);"
    : isNeu
      ? "  box-shadow: var(--shadow-md);\n  border: none;"
      : "  border: var(--border-width) solid var(--color-border);";

  return `/**
 * Button.module.css — CSS Module for Button component (8 states)
 * Generated by the-designer · css-modules format
 */

.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-tight);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    opacity var(--dur-fast) var(--ease-out),
    filter var(--dur-fast) var(--ease-out);
${baseExtras}
}

.root:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

/* State: primary */
.primary { composes: root; background-color: var(--color-primary); color: var(--color-primary-fg); border-color: var(--color-primary); }
.primary:hover:not(:disabled) { filter: brightness(0.92); }
.primary:active:not(:disabled) { filter: brightness(0.85); }

/* State: secondary */
.secondary { composes: root; background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
.secondary:hover:not(:disabled) { background-color: var(--color-paper-alt); }

/* State: outline */
.outline { composes: root; background-color: transparent; color: var(--color-primary); border-color: var(--color-primary); }
.outline:hover:not(:disabled) { background-color: var(--color-primary); color: var(--color-primary-fg); }

/* State: ghost */
.ghost { composes: root; background-color: transparent; color: var(--color-text); border-color: transparent; }
.ghost:hover:not(:disabled) { background-color: var(--color-paper-alt); }

/* State: disabled */
.disabled { composes: root; opacity: 0.4; cursor: not-allowed; pointer-events: none; }

/* State: loading */
.loading { composes: root; opacity: 0.7; cursor: progress; pointer-events: none; }
.loading::before {
  content: '';
  display: block;
  width: 1em; height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin var(--dur-slow) linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .loading::before { animation: none; } }

/* State: error */
.error { composes: root; background-color: var(--color-error); color: var(--color-primary-fg); border-color: var(--color-error); }
.error:hover:not(:disabled) { filter: brightness(0.90); }

/* State: success */
.success { composes: root; background-color: var(--color-success); color: var(--color-primary-fg); border-color: var(--color-success); }
.success:hover:not(:disabled) { filter: brightness(0.90); }
`;
}

function buildCardModuleCSS(): string {
  return `/**
 * Card.module.css — CSS Module for Card component
 * Generated by the-designer · css-modules format
 */

.root {
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--dur-base) var(--ease-out);
}

.elevated { composes: root; box-shadow: var(--shadow-md); }
.elevated:hover { box-shadow: var(--shadow-lg); }

.flat { composes: root; box-shadow: none; }

.header {
  padding: var(--space-4) var(--space-6);
  border-bottom: var(--border-width) solid var(--color-border);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-base);
  color: var(--color-text);
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
}

.body { padding: var(--space-6); color: var(--color-text); }

.footer {
  padding: var(--space-4) var(--space-6);
  border-top: var(--border-width) solid var(--color-border);
  background-color: var(--color-paper-alt);
  display: flex; align-items: center; gap: var(--space-3);
}
`;
}

function buildInputModuleCSS(): string {
  return `/**
 * Input.module.css — CSS Module for Input component
 * Generated by the-designer · css-modules format
 */

.root { display: flex; flex-direction: column; gap: var(--space-1); width: 100%; }

.label { font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text); line-height: var(--leading-tight); }

.field {
  display: block; width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body); font-size: var(--text-sm); line-height: var(--leading-base);
  color: var(--color-text); background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
  appearance: none;
}
.field:focus { outline: none; border-color: var(--color-focus); box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-focus) 20%, transparent); }
.field::placeholder { color: var(--color-text-muted); }

.error .field   { border-color: var(--color-error); }
.error .field:focus { box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-error) 20%, transparent); }

.success .field   { border-color: var(--color-success); }
.success .field:focus { box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-success) 20%, transparent); }

.disabled .field { opacity: 0.5; cursor: not-allowed; background-color: var(--color-paper-alt); }
.disabled .label { opacity: 0.5; }

.hint { font-size: var(--text-xs); color: var(--color-text-muted); line-height: var(--leading-base); }
.error .hint   { color: var(--color-error); }
.success .hint { color: var(--color-success); }
`;
}

// ---------------------------------------------------------------------------
// Format: scss
// ---------------------------------------------------------------------------

function buildScssTokens(
  p: PaletteTokens,
  st: StyleTokens,
  palette: string,
  style: string,
): string {
  const isGlass = style === "glass";
  const glassPart = isGlass
    ? `\n// Glass tokens\n$glass-bg:     ${p.glassBg ?? "transparent"};\n$glass-filter: "${p.backdropFilter ?? "none"}";`
    : "";

  return `/**
 * _tokens.scss — SCSS design tokens for ${style} x ${palette}
 * Generated by the-designer · scss format
 */

// Colors
$color-paper:         ${p.paper};
$color-paper-alt:     ${p.paperAlt};
$color-surface:       ${p.surface};
$color-primary:       ${p.primary};
$color-primary-fg:    ${p.primaryFg};
$color-secondary:     ${p.secondary};
$color-secondary-fg:  ${p.secondaryFg};
$color-accent:        ${p.accent};
$color-text:          ${p.text};
$color-text-muted:    ${p.textMuted};
$color-border:        ${p.border};
$color-focus:         ${p.focus};
$color-success:       oklch(55% 0.20 145);
$color-error:         oklch(52% 0.25 25);
$color-warning:       oklch(72% 0.18 75);
$color-info:          oklch(60% 0.18 240);
${glassPart}

$colors: (
  "paper": $color-paper, "paper-alt": $color-paper-alt,
  "surface": $color-surface, "primary": $color-primary,
  "primary-fg": $color-primary-fg, "secondary": $color-secondary,
  "secondary-fg": $color-secondary-fg, "accent": $color-accent,
  "text": $color-text, "text-muted": $color-text-muted,
  "border": $color-border, "focus": $color-focus,
  "success": $color-success, "error": $color-error,
);

// Spacing
$space-1: 4px; $space-2: 8px; $space-3: 12px; $space-4: 16px;
$space-5: 20px; $space-6: 24px; $space-8: 32px; $space-10: 40px;
$space-12: 48px; $space-16: 64px; $space-20: 80px; $space-24: 96px;

$spacing: (
  "1": $space-1, "2": $space-2, "3": $space-3, "4": $space-4,
  "5": $space-5, "6": $space-6, "8": $space-8, "10": $space-10,
  "12": $space-12, "16": $space-16, "20": $space-20, "24": $space-24,
);

// Typography
$font-body:  ${st.fontBody};
$font-mono:  ${st.fontMono};
$font-weight-normal: 400; $font-weight-medium: 500;
$font-weight-semibold: 600; $font-weight-bold: 700;
$text-xs: 0.75rem; $text-sm: 0.875rem; $text-base: 1rem;
$text-lg: 1.125rem; $text-xl: 1.25rem; $text-2xl: 1.5rem;
$text-3xl: 1.875rem; $text-4xl: 2.25rem;
$text-display: clamp(2.5rem, 6vw, 4.5rem);

$typography: (
  "xs": $text-xs, "sm": $text-sm, "base": $text-base,
  "lg": $text-lg, "xl": $text-xl, "2xl": $text-2xl,
  "3xl": $text-3xl, "4xl": $text-4xl, "display": $text-display,
);

// Radii
$radius-sm: ${st.radiusSm}; $radius-md: ${st.radiusMd};
$radius-lg: ${st.radiusLg}; $radius-xl: ${st.radiusXl};
$radius-full: 9999px;

// Shadows
$shadow-sm: ${st.shadowSm};
$shadow-md: ${st.shadowMd};
$shadow-lg: ${st.shadowLg};
$shadow-xl: ${st.shadowXl};

// Borders
$border-width: ${st.borderWidth};
$border: #{$border-width} solid $color-border;

// Easings & durations
$ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
$ease-in:     cubic-bezier(0.4, 0, 0.68, 0.06);
$ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
$dur-fast: 150ms; $dur-base: 250ms; $dur-slow: 400ms;

// Breakpoints
$breakpoints: (
  "sm": 640px, "md": 768px, "lg": 1024px, "xl": 1280px, "2xl": 1536px,
);
`;
}

function buildScssMixins(): string {
  return `/**
 * _mixins.scss — SCSS utility mixins
 * Generated by the-designer · scss format
 */

@use 'tokens' as t;

/// Centre children in both axes
@mixin flex-center($inline: false) {
  @if $inline { display: inline-flex; } @else { display: flex; }
  align-items: center;
  justify-content: center;
}

/// Accessible focus ring
@mixin focus-ring($color: t.$color-focus, $offset: 2px, $width: 2px) {
  &:focus-visible {
    outline: #{$width} solid $color;
    outline-offset: $offset;
  }
}

/// Min-width media query helper
/// Usage: @include responsive('md') { ... }
@mixin responsive($bp) {
  $value: map-get(t.$breakpoints, $bp);
  @if $value == null {
    @error "Unknown breakpoint '#{$bp}'. Available: #{map-keys(t.$breakpoints)}";
  }
  @media screen and (min-width: $value) { @content; }
}

/// Wrap content in prefers-reduced-motion: no-preference
/// Usage: @include motion-safe { transition: opacity 0.2s; }
@mixin motion-safe {
  @media (prefers-reduced-motion: no-preference) { @content; }
}

/// Visually hidden (accessible off-screen)
@mixin visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/// Single-line text truncation
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`;
}

function buildScssMain(): string {
  return `/**
 * main.scss — SCSS entry point
 * Generated by the-designer · scss format
 */

@use 'tokens' as t;
@use 'mixins' as m;

// --- Reset / base ----------------------------------------------------------

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: t.$font-body;
  font-size: t.$text-base;
  line-height: 1.5;
  color: t.$color-text;
  background-color: t.$color-paper;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: t.$color-primary;
  @include m.focus-ring;
  @include m.motion-safe { transition: opacity t.$dur-fast t.$ease-out; }
  &:hover { opacity: 0.8; }
}

img, video { display: block; max-width: 100%; }
code, pre  { font-family: t.$font-mono; font-size: t.$text-sm; }

// --- Container -------------------------------------------------------------

.container {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: t.$space-6;
  @include m.responsive('md') { padding-inline: t.$space-8; }
}

// --- Components ------------------------------------------------------------

@use 'components';
`;
}

function buildScssComponents(style: string): string {
  const isNeoBrut = style === "neo-brutalism";
  const btnBorder = isNeoBrut
    ? "  border: 2px solid t.$color-text;"
    : "  border: t.$border;";

  return `/**
 * _components.scss — BEM-style component library
 * Generated by the-designer · scss format
 */

@use 'tokens' as t;
@use 'mixins' as m;

// --- .btn ------------------------------------------------------------------

.btn {
  @include m.flex-center($inline: true);
  @include m.focus-ring;
  gap: t.$space-2;
  padding: t.$space-2 t.$space-4;
  font-family: t.$font-body;
  font-size: t.$text-sm;
  font-weight: t.$font-weight-medium;
  line-height: 1.25;
  border-radius: t.$radius-md;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  background-color: t.$color-surface;
  color: t.$color-text;
${btnBorder}
  @include m.motion-safe {
    transition: background-color t.$dur-fast t.$ease-out, box-shadow t.$dur-fast t.$ease-out, filter t.$dur-fast t.$ease-out;
  }

  &:disabled, &[aria-disabled="true"] { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

  &--primary   { background-color: t.$color-primary; color: t.$color-primary-fg; border-color: t.$color-primary; &:hover:not(:disabled) { filter: brightness(0.92); } }
  &--secondary { background-color: t.$color-surface; color: t.$color-text; border-color: t.$color-border; &:hover:not(:disabled) { background-color: t.$color-paper-alt; } }
  &--outline   { background-color: transparent; color: t.$color-primary; border: #{t.$border-width} solid t.$color-primary; &:hover:not(:disabled) { background-color: t.$color-primary; color: t.$color-primary-fg; } }
  &--ghost     { background-color: transparent; border-color: transparent; &:hover:not(:disabled) { background-color: t.$color-paper-alt; } }
  &--sm        { padding: 2px t.$space-3; font-size: t.$text-xs; border-radius: t.$radius-sm; }
  &--lg        { padding: t.$space-3 t.$space-6; font-size: t.$text-base; }
}

// --- .card -----------------------------------------------------------------

.card {
  background-color: t.$color-surface;
  border: t.$border;
  border-radius: t.$radius-lg;
  overflow: hidden;

  &--elevated {
    box-shadow: t.$shadow-md;
    @include m.motion-safe { transition: box-shadow t.$dur-base t.$ease-out; }
    &:hover { box-shadow: t.$shadow-lg; }
  }

  &--flat { box-shadow: none; }

  &__header { padding: t.$space-4 t.$space-6; border-bottom: t.$border; font-weight: t.$font-weight-semibold; }
  &__body   { padding: t.$space-6; }
  &__footer { padding: t.$space-4 t.$space-6; border-top: t.$border; background-color: t.$color-paper-alt; }
}

// --- .input ----------------------------------------------------------------

.input {
  display: flex; flex-direction: column; gap: t.$space-1; width: 100%;

  &__label { font-size: t.$text-sm; font-weight: t.$font-weight-medium; color: t.$color-text; }

  &__field {
    display: block; width: 100%;
    padding: t.$space-2 t.$space-3;
    font-family: t.$font-body; font-size: t.$text-sm;
    color: t.$color-text; background-color: t.$color-surface;
    border: #{t.$border-width} solid t.$color-border;
    border-radius: t.$radius-md;
    appearance: none;
    @include m.motion-safe { transition: border-color t.$dur-fast t.$ease-out, box-shadow t.$dur-fast t.$ease-out; }

    &:focus {
      outline: none;
      border-color: t.$color-focus;
      box-shadow: 0 0 0 3px color-mix(in oklch, t.$color-focus 20%, transparent);
    }
    &::placeholder { color: t.$color-text-muted; }
  }

  &--error &__field   { border-color: t.$color-error; &:focus { box-shadow: 0 0 0 3px color-mix(in oklch, t.$color-error 20%, transparent); } }
  &__hint             { font-size: t.$text-xs; color: t.$color-text-muted; }
  &--error &__hint    { color: t.$color-error; }
}

// --- .badge ----------------------------------------------------------------

.badge {
  display: inline-flex; align-items: center; gap: t.$space-1;
  padding: 2px t.$space-2;
  font-size: t.$text-xs; font-weight: t.$font-weight-medium;
  border-radius: t.$radius-full;
  background-color: t.$color-paper-alt; color: t.$color-text-muted;
  border: #{t.$border-width} solid t.$color-border;

  &--primary { background-color: t.$color-primary; color: t.$color-primary-fg; border-color: t.$color-primary; }
  &--success { background-color: oklch(90% 0.10 145); color: oklch(30% 0.20 145); border-color: oklch(75% 0.15 145); }
  &--error   { background-color: oklch(92% 0.10 25);  color: oklch(35% 0.25 25);  border-color: oklch(78% 0.15 25); }
  &--warning { background-color: oklch(94% 0.10 75);  color: oklch(40% 0.18 75);  border-color: oklch(80% 0.14 75); }
}
`;
}

// ---------------------------------------------------------------------------
// Format: css-variables-only
// ---------------------------------------------------------------------------

function buildCSSVariablesOnly(
  p: PaletteTokens,
  st: StyleTokens,
  style: string,
  palette: string,
): string {
  const label =
    style.charAt(0).toUpperCase() + style.slice(1).replace(/-/g, " ");
  const rootVars = buildRootVars(p, st, style);
  const darkOverride = buildDarkOverrideVars(palette);
  const indentedDark = darkOverride
    .split("\n")
    .map((l) => "  " + l)
    .join("\n");

  return `/**
 * tokens.css — CSS custom properties only
 * Generated by the-designer · css-variables-only format
 *
 * Three override mechanisms:
 *   1. :root                              — default (light) mode
 *   2. @media (prefers-color-scheme: dark) — OS/browser dark mode
 *   3. [data-theme='dark']                 — programmatic dark mode
 *
 * Style: ${label}  |  Palette: ${palette}
 */

:root {
${rootVars}
}

/* OS/browser dark mode ---------------------------------------------------- */

@media (prefers-color-scheme: dark) {
  :root {
${indentedDark}
  }
}

/* Programmatic dark mode: add data-theme="dark" to <html> ----------------- */

[data-theme='dark'] {
${indentedDark}
}
`;
}

// ---------------------------------------------------------------------------
// Usage strings
// ---------------------------------------------------------------------------

function buildUsage(
  format: CSSOutputFormat,
  style: string,
  palette: string,
): string {
  switch (format) {
    case "vanilla":
      return `## Usage — Vanilla CSS (${style} x ${palette})

Import order matters — always load \`tokens.css\` first:

\`\`\`html
<link rel="stylesheet" href="tokens.css" />
<link rel="stylesheet" href="base.css" />
<link rel="stylesheet" href="components.css" />
\`\`\`

Or via CSS \`@import\`:

\`\`\`css
@import './tokens.css';
@import './base.css';
@import './components.css';
\`\`\`

Use tokens anywhere with \`var(--token-name)\`:

\`\`\`css
.my-component {
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-6);
}
\`\`\`

Available classes: \`.btn\`, \`.btn-primary\`, \`.btn-secondary\`, \`.btn-outline\`, \`.btn-ghost\`, \`.card\`, \`.card-header\`, \`.card-body\`, \`.card-footer\`, \`.input\`, \`.badge\`, \`.navbar\`, \`.sidebar\`, \`.modal\`, \`.hero\`, \`.footer\`.
`;

    case "css-modules":
      return `## Usage — CSS Modules (${style} x ${palette})

Load \`tokens.css\` globally, then import component modules:

\`\`\`ts
// entry point (e.g. _app.tsx)
import './tokens.css';

// component files
import styles from './Button.module.css';
import cardStyles from './Card.module.css';
import inputStyles from './Input.module.css';
\`\`\`

Apply states via the \`styles\` object:

\`\`\`tsx
<button className={styles.primary}>Save</button>
<button className={styles.secondary}>Cancel</button>
<button className={styles.outline}>Learn more</button>
<button className={styles.ghost}>Skip</button>
<button className={styles.disabled} disabled>Unavailable</button>
<button className={styles.loading} aria-busy="true">Loading…</button>
<button className={styles.error}>Retry</button>
<button className={styles.success}>Done</button>

<div className={cardStyles.elevated}>
  <div className={cardStyles.header}>Title</div>
  <div className={cardStyles.body}>Content</div>
  <div className={cardStyles.footer}>Actions</div>
</div>

<div className={inputStyles.root}>
  <label className={inputStyles.label}>Email</label>
  <input className={inputStyles.field} type="email" />
  <span className={inputStyles.hint}>Optional helper text.</span>
</div>
\`\`\`
`;

    case "scss":
      return `## Usage — SCSS (${style} x ${palette})

Set up your entry point:

\`\`\`scss
// main.scss
@use 'tokens' as t;
@use 'mixins' as m;
@use 'components';
\`\`\`

Use variables and mixins in your own partials:

\`\`\`scss
.my-section {
  background: t.$color-paper;
  color: t.$color-text;
  padding: t.$space-6;

  @include m.responsive('md') { padding: t.$space-8; }
  @include m.motion-safe { transition: background-color t.$dur-base t.$ease-out; }
}
\`\`\`

BEM classes: \`.btn\`, \`.btn--primary\`, \`.btn--secondary\`, \`.btn--outline\`, \`.btn--ghost\`, \`.btn--sm\`, \`.btn--lg\`, \`.card\`, \`.card--elevated\`, \`.card--flat\`, \`.card__header\`, \`.card__body\`, \`.card__footer\`, \`.input\`, \`.input__label\`, \`.input__field\`, \`.input--error\`, \`.input__hint\`, \`.badge\`, \`.badge--primary\`, \`.badge--success\`, \`.badge--error\`, \`.badge--warning\`.
`;

    case "css-variables-only":
      return `## Usage — CSS Variables Only (${style} x ${palette})

Link the single file globally:

\`\`\`html
<link rel="stylesheet" href="tokens.css" />
\`\`\`

Dark mode is automatic via \`prefers-color-scheme\`. For programmatic toggling:

\`\`\`js
// Enable dark mode
document.documentElement.setAttribute('data-theme', 'dark');
// Revert to light
document.documentElement.removeAttribute('data-theme');
\`\`\`

Use in any CSS:

\`\`\`css
.card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  color: var(--color-text);
  font-family: var(--font-body);
}
\`\`\`

All tokens are documented in the \`:root\` block inside \`tokens.css\`.
`;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generates CSS output files for the given design-system style, palette, and
 * output format.
 *
 * @param style   - A style key from STYLES (e.g. "minimal", "neo-brutalism")
 * @param palette - A palette key: "pastel" | "dark" | "vibrant" | "mono"
 * @param format  - Target output format
 * @returns       CSSOutputResult with files[] ready to write and paste-ready usage markdown
 */
export function generateCSSOutput(
  style: string,
  palette: string,
  format: CSSOutputFormat,
): CSSOutputResult {
  const p = getPaletteTokens(palette, style);
  const st = getStyleTokens(style);

  let files: CSSOutputFile[];

  switch (format) {
    case "vanilla":
      files = [
        {
          filename: "tokens.css",
          content: buildVanillaTokensCSS(p, st, style, palette),
        },
        { filename: "base.css", content: buildVanillaBaseCSS(style) },
        { filename: "components.css", content: buildVanillaComponentsCSS() },
      ];
      break;

    case "css-modules":
      files = [
        {
          filename: "tokens.css",
          content: buildVanillaTokensCSS(p, st, style, palette),
        },
        { filename: "Button.module.css", content: buildButtonModuleCSS(style) },
        { filename: "Card.module.css", content: buildCardModuleCSS() },
        { filename: "Input.module.css", content: buildInputModuleCSS() },
      ];
      break;

    case "scss":
      files = [
        {
          filename: "_tokens.scss",
          content: buildScssTokens(p, st, palette, style),
        },
        { filename: "_mixins.scss", content: buildScssMixins() },
        { filename: "main.scss", content: buildScssMain() },
        { filename: "_components.scss", content: buildScssComponents(style) },
      ];
      break;

    case "css-variables-only":
      files = [
        {
          filename: "tokens.css",
          content: buildCSSVariablesOnly(p, st, style, palette),
        },
      ];
      break;

    default: {
      const _exhaustive: never = format;
      throw new Error(`Unknown CSS output format: ${_exhaustive}`);
    }
  }

  return {
    format,
    style,
    palette,
    files,
    usage: buildUsage(format, style, palette),
  };
}
