function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const h = parseInt(hex.slice(1, 3), 16) / 255;
  const s = parseInt(hex.slice(3, 5), 16) / 255;
  const l = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(h, s, l);
  const min = Math.min(h, s, l);
  let hh = 0,
    ss = 0;
  const ll = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    ss = ll > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === h) hh = ((s - l) / d + (s < l ? 6 : 0)) / 6;
    else if (max === s) hh = ((l - h) / d + 2) / 6;
    else hh = ((h - s) / d + 4) / 6;
  }
  return {
    h: Math.round(hh * 360),
    s: Math.round(ss * 100),
    l: Math.round(ll * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shiftLightness(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + delta)));
}

function maximizeContrast(hex: string, targetBg: string): string {
  const hsl = hexToHsl(hex);
  const bgHsl = hexToHsl(targetBg);
  if (bgHsl.l > 50) {
    return hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 30));
  } else {
    return hslToHex(hsl.h, hsl.s, Math.min(90, hsl.l + 30));
  }
}

export interface PaletteVariant {
  name: string;
  description: string;
  colors: string[];
}

export function generatePaletteVariants(colors: string[]): PaletteVariant[] {
  return [
    {
      name: "Light",
      description: "Lightened version for light-mode backgrounds",
      colors: colors.map((c) => shiftLightness(c, 20)),
    },
    {
      name: "Dark",
      description: "Darkened version for dark-mode surfaces",
      colors: colors.map((c) => shiftLightness(c, -20)),
    },
    {
      name: "High Contrast",
      description: "Maximized contrast for accessibility (WCAG AAA)",
      colors: colors.map((c) => maximizeContrast(c, "#ffffff")),
    },
    {
      name: "Muted",
      description: "Desaturated version for subtle backgrounds",
      colors: colors.map((c) => {
        const hsl = hexToHsl(c);
        return hslToHex(hsl.h, Math.max(10, hsl.s - 30), hsl.l);
      }),
    },
    {
      name: "Vivid",
      description: "Boosted saturation for emphasis and CTAs",
      colors: colors.map((c) => {
        const hsl = hexToHsl(c);
        return hslToHex(hsl.h, Math.min(100, hsl.s + 20), hsl.l);
      }),
    },
  ];
}
