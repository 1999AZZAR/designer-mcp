import { STYLES, PALETTES, CROSS_CUTTING } from "./rules.js";

const STYLE_FONTS: Record<string, { sans: string[]; mono?: string[] }> = {
  fluent: { sans: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"] },
  ant: {
    sans: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ],
  },
  carbon: {
    sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
    mono: ['"IBM Plex Mono"', "monospace"],
  },
  atlassian: {
    sans: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ],
  },
  "apple-hig": {
    sans: [
      '"SF Pro Display"',
      '"SF Pro Text"',
      "-apple-system",
      "BlinkMacSystemFont",
      "sans-serif",
    ],
  },
  polaris: {
    sans: ["-apple-system", "BlinkMacSystemFont", '"Inter"', "sans-serif"],
  },
  material: { sans: ['"Roboto"', '"Google Sans"', "system-ui", "sans-serif"] },
  minimal: { sans: ['"Inter"', '"SF Pro Display"', "system-ui", "sans-serif"] },
  glass: { sans: ['"Inter"', '"SF Pro Display"', "system-ui", "sans-serif"] },
  neumorphism: {
    sans: ['"Inter"', '"SF Pro Display"', "system-ui", "sans-serif"],
  },
  "neo-brutalism": {
    sans: ['"Space Grotesk"', '"Inter"', "system-ui", "sans-serif"],
    mono: ['"JetBrains Mono"', "monospace"],
  },
  claymorphism: { sans: ['"Nunito"', '"Inter"', "system-ui", "sans-serif"] },
  skeuomorphism: { sans: ['"Georgia"', '"Times New Roman"', "serif"] },
  swiss: { sans: ['"Helvetica Neue"', '"Helvetica"', '"Arial"', "sans-serif"] },
  "swiss-archival": {
    sans: ['"IBM Plex Sans"', '"Helvetica Neue"', "sans-serif"],
    mono: ['"IBM Plex Mono"', "monospace"],
  },
  "m3-pastel": {
    sans: ['"Google Sans"', '"Roboto"', "system-ui", "sans-serif"],
  },
  "neo-m3": {
    sans: ['"Space Grotesk"', '"Inter"', "system-ui", "sans-serif"],
    mono: ['"JetBrains Mono"', "monospace"],
  },
};

const STYLE_RADIUS: Record<string, Record<string, string>> = {
  fluent: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  ant: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  carbon: { sm: "0px", md: "0px", lg: "0px", xl: "0px" },
  atlassian: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  "apple-hig": { sm: "8px", md: "12px", lg: "16px", xl: "20px" },
  polaris: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  material: { sm: "8px", md: "12px", lg: "16px", xl: "28px" },
  minimal: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  glass: { sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  neumorphism: { sm: "12px", md: "16px", lg: "24px", xl: "32px" },
  "neo-brutalism": { sm: "0px", md: "0px", lg: "0px", xl: "0px" },
  claymorphism: { sm: "16px", md: "24px", lg: "32px", xl: "40px" },
  skeuomorphism: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
  swiss: { sm: "0px", md: "0px", lg: "0px", xl: "0px" },
  "swiss-archival": { sm: "2px", md: "4px", lg: "6px", xl: "8px" },
  "m3-pastel": { sm: "12px", md: "16px", lg: "24px", xl: "28px" },
  "neo-m3": { sm: "0px", md: "4px", lg: "8px", xl: "16px" },
};

const STYLE_SHADOWS: Record<string, Record<string, string>> = {
  fluent: {
    sm: "0 1px 2px rgba(0,0,0,0.06)",
    md: "0 2px 4px rgba(0,0,0,0.08)",
    lg: "0 4px 12px rgba(0,0,0,0.12)",
    xl: "0 8px 24px rgba(0,0,0,0.16)",
  },
  ant: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 3px 6px rgba(0,0,0,0.08)",
    lg: "0 6px 16px rgba(0,0,0,0.10)",
    xl: "0 12px 40px rgba(0,0,0,0.12)",
  },
  carbon: {
    sm: "0 1px 0 rgba(0,0,0,0.16)",
    md: "0 2px 0 rgba(0,0,0,0.16)",
    lg: "0 4px 0 rgba(0,0,0,0.16)",
    xl: "0 8px 0 rgba(0,0,0,0.16)",
  },
  material: {
    sm: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    md: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
    lg: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
    xl: "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)",
  },
  minimal: {
    sm: "0 1px 3px rgba(0,0,0,0.04)",
    md: "0 2px 8px rgba(0,0,0,0.06)",
    lg: "0 4px 16px rgba(0,0,0,0.08)",
    xl: "0 8px 32px rgba(0,0,0,0.10)",
  },
  glass: {
    sm: "0 1px 3px rgba(0,0,0,0.10)",
    md: "0 4px 12px rgba(0,0,0,0.15)",
    lg: "0 8px 24px rgba(0,0,0,0.20)",
    xl: "0 16px 48px rgba(0,0,0,0.25)",
  },
  neumorphism: {
    sm: "4px 4px 8px rgba(0,0,0,0.15), -4px -4px 8px rgba(255,255,255,0.7)",
    md: "6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.7)",
    lg: "8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.7)",
    xl: "12px 12px 24px rgba(0,0,0,0.15), -12px -12px 24px rgba(255,255,255,0.7)",
  },
  "neo-brutalism": {
    sm: "2px 2px 0px rgba(0,0,0,1)",
    md: "4px 4px 0px rgba(0,0,0,1)",
    lg: "6px 6px 0px rgba(0,0,0,1)",
    xl: "8px 8px 0px rgba(0,0,0,1)",
  },
  claymorphism: {
    sm: "2px 2px 4px rgba(0,0,0,0.08), inset 0 -2px 4px rgba(0,0,0,0.04)",
    md: "4px 4px 8px rgba(0,0,0,0.10), inset 0 -4px 8px rgba(0,0,0,0.06)",
    lg: "6px 6px 12px rgba(0,0,0,0.12), inset 0 -6px 12px rgba(0,0,0,0.08)",
    xl: "8px 8px 16px rgba(0,0,0,0.14), inset 0 -8px 16px rgba(0,0,0,0.10)",
  },
  swiss: {
    sm: "none",
    md: "none",
    lg: "none",
    xl: "none",
  },
  "neo-m3": {
    sm: "0 1px 3px rgba(0,0,0,0.12)",
    md: "0 2px 8px rgba(0,0,0,0.16), 4px 4px 0px rgba(0,0,0,0.08)",
    lg: "0 4px 16px rgba(0,0,0,0.20), 6px 6px 0px rgba(0,0,0,0.10)",
    xl: "0 8px 32px rgba(0,0,0,0.24), 8px 8px 0px rgba(0,0,0,0.12)",
  },
};

function generateColorRamp(paletteType: string): Record<string, string> {
  switch (paletteType) {
    case "dark":
      return {
        50: "#f8fafc",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
        950: "#020617",
      };
    case "pastel":
      return {
        50: "#fefce8",
        100: "#fef9c3",
        200: "#fef08a",
        300: "#fde047",
        400: "#facc15",
        500: "#eab308",
        600: "#ca8a04",
        700: "#a16207",
        800: "#854d0e",
        900: "#713f12",
        950: "#422006",
      };
    case "vibrant":
      return {
        50: "#fdf4ff",
        100: "#fae8ff",
        200: "#f5d0fe",
        300: "#f0abfc",
        400: "#e879f9",
        500: "#d946ef",
        600: "#c026d3",
        700: "#a21caf",
        800: "#86198f",
        900: "#701a75",
        950: "#4a044e",
      };
    case "mono":
      return {
        50: "#fafafa",
        100: "#f5f5f5",
        200: "#e5e5e5",
        300: "#d4d4d4",
        400: "#a3a3a3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
        800: "#262626",
        900: "#171717",
        950: "#0a0a0a",
      };
    default:
      return {
        50: "#f8fafc",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
        950: "#020617",
      };
  }
}

function getAccentColors(
  style: string,
  paletteType: string,
): Record<string, string> {
  if (paletteType === "dark") {
    return { primary: "#3b82f6", secondary: "#8b5cf6", accent: "#06b6d4" };
  }
  if (paletteType === "vibrant") {
    return { primary: "#d946ef", secondary: "#f97316", accent: "#06b6d4" };
  }
  if (paletteType === "pastel") {
    return { primary: "#f472b6", secondary: "#a78bfa", accent: "#34d399" };
  }
  if (paletteType === "mono") {
    return { primary: "#404040", secondary: "#737373", accent: "#a3a3a3" };
  }
  return { primary: "#3b82f6", secondary: "#8b5cf6", accent: "#06b6d4" };
}

export interface TailwindConfig {
  content: string[];
  theme: {
    extend: {
      colors: Record<string, any>;
      fontFamily: Record<string, string[]>;
      borderRadius: Record<string, string>;
      boxShadow: Record<string, string>;
    };
  };
  plugins: string[];
}

export function generateTailwindConfig(
  style: string,
  paletteType: string,
): { config: TailwindConfig; code: string } {
  const fonts = STYLE_FONTS[style] ?? STYLE_FONTS.minimal;
  const radius = STYLE_RADIUS[style] ?? STYLE_RADIUS.minimal;
  const shadows = STYLE_SHADOWS[style] ?? STYLE_SHADOWS.minimal;
  const colorRamp = generateColorRamp(paletteType);
  const accents = getAccentColors(style, paletteType);

  const config: TailwindConfig = {
    content: [
      "./src/**/*.{html,js,ts,jsx,tsx}",
      "./pages/**/*.{html,js,ts,jsx,tsx}",
      "./components/**/*.{html,js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          surface: colorRamp,
          primary: accents.primary,
          secondary: accents.secondary,
          accent: accents.accent,
        },
        fontFamily: {
          sans: fonts.sans,
          ...(fonts.mono ? { mono: fonts.mono } : {}),
        },
        borderRadius: {
          sm: radius.sm,
          md: radius.md,
          lg: radius.lg,
          xl: radius.xl,
        },
        boxShadow: {
          sm: shadows.sm,
          md: shadows.md,
          lg: shadows.lg,
          xl: shadows.xl,
        },
      },
    },
    plugins: [],
  };

  const code = `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)}
`;

  return { config, code };
}
