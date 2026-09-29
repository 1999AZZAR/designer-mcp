import type { PaletteData } from "./palette.js";

export type ConvertTarget =
  | "css"
  | "tailwind"
  | "scss"
  | "figma"
  | "android"
  | "swift"
  | "json";

function toCss(data: PaletteData): string {
  const lines = ["/* Color Palettes from Color Hunt */", ""];
  for (const p of data.palettes) {
    const name = slug(p.name);
    lines.push(`.${name} {`);
    p.colors.forEach((c, i) => lines.push(`  --color-${i + 1}: ${c};`));
    lines.push("}", "");
  }
  return lines.join("\n").trim();
}

function toTailwind(data: PaletteData): string {
  const colors: Record<string, Record<string, string>> = {};
  for (const p of data.palettes) {
    const name = slug(p.name);
    colors[name] = {};
    p.colors.forEach((c, i) => {
      colors[name][String((i + 1) * 100)] = c;
    });
  }
  return `module.exports = ${JSON.stringify({ theme: { extend: { colors } } }, null, 2)}`;
}

function toScss(data: PaletteData): string {
  const lines: string[] = ["// Color Palettes from Color Hunt", ""];
  for (const p of data.palettes) {
    const name = slug(p.name);
    p.colors.forEach((c, i) => lines.push(`$${name}-color-${i + 1}: ${c};`));
    lines.push("");
  }
  return lines.join("\n").trim();
}

function toFigma(data: PaletteData): string {
  const tokens: Record<
    string,
    Record<string, { value: string; type: string }>
  > = {};
  for (const p of data.palettes) {
    const name = slug(p.name);
    tokens[name] = {};
    p.colors.forEach((c, i) => {
      tokens[name][`color-${i + 1}`] = { value: c, type: "color" };
    });
  }
  return JSON.stringify({ colors: tokens }, null, 2);
}

function toAndroid(data: PaletteData): string {
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<resources>",
    "    <!-- Palettes from Color Hunt -->",
    "",
  ];
  for (const p of data.palettes) {
    const name = slug(p.name, "_");
    lines.push(`    <!-- ${p.name} -->`);
    p.colors.forEach((c, i) => {
      lines.push(`    <color name="${name}_color_${i + 1}">${c}</color>`);
    });
    lines.push("");
  }
  lines.push("</resources>");
  return lines.join("\n");
}

function toSwift(data: PaletteData): string {
  const lines = ["import SwiftUI", "", "// Color Palettes from Color Hunt", ""];
  for (const p of data.palettes) {
    const name = p.name.replace(/\s+/g, "");
    lines.push(`struct ${name}Colors {`);
    p.colors.forEach((c, i) => {
      lines.push(`    static let color${i + 1} = Color("0x${c.slice(1)}")`);
    });
    lines.push("}", "");
  }
  return lines.join("\n").trim();
}

function toJsonTokens(data: PaletteData): string {
  const palettes = data.palettes.map((p) => ({
    name: p.name,
    colors: Object.fromEntries(
      p.colors.map((c, i) => [`color-${i + 1}`, { value: c, type: "color" }]),
    ),
    tags: p.tags ?? [],
    likes: p.likes ?? 0,
  }));
  return JSON.stringify({ palettes }, null, 2);
}

function slug(s: string, sep = "-"): string {
  return s
    .toLowerCase()
    .replace(/[\s_]+/g, sep)
    .replace(/[^a-z0-9\-]/g, "");
}

export function convertPalette(
  data: PaletteData,
  target: ConvertTarget,
): string {
  switch (target) {
    case "css":
      return toCss(data);
    case "tailwind":
      return toTailwind(data);
    case "scss":
      return toScss(data);
    case "figma":
      return toFigma(data);
    case "android":
      return toAndroid(data);
    case "swift":
      return toSwift(data);
    default:
      return toJsonTokens(data);
  }
}
