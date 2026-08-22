import { STYLES, PALETTES, ARCHETYPES, HYBRIDS } from "./rules.js";

interface StyleScore {
  style: string;
  score: number;
  label: string;
  use_for: string;
  reasons: string[];
}

interface EvaluationResult {
  product_context: string;
  ranked_styles: StyleScore[];
  recommended: string;
  recommended_palette: string;
  recommended_archetype: string;
  workflow: string[];
}

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  enterprise: ["admin", "dashboard", "cms", "internal", "workflow", "crm", "erp", "analytics", "b2b", "saas"],
  consumer: ["mobile", "social", "chat", "music", "game", "fitness", "wellness", "lifestyle", "consumer"],
  ecommerce: ["shop", "store", "commerce", "product", "checkout", "cart", "merchant", "inventory", "order"],
  creative: ["portfolio", "agency", "creative", "design", "art", "photo", "video", "brand", "marketing"],
  editorial: ["blog", "magazine", "news", "editorial", "publish", "content", "story", "article"],
  automotive: ["car", "vehicle", "auto", "racing", "motor", "speed", "performance", "precision", "engineer", "mechanical", "industrial", "hardware", "mouse", "keyboard", "peripheral"],
  luxury: ["luxury", "premium", "high-end", "exclusive", "limited", "bespoke", "craft", "artisan"],
  developer: ["code", "dev", "api", "terminal", "cli", "git", "deploy", "infra", "platform", "engineer"],
  finance: ["bank", "finance", "payment", "fintech", "crypto", "trading", "invest", "wallet"],
};

const STYLE_SCORING: Record<string, Record<string, number>> = {
  fluent: { enterprise: 8, developer: 5, consumer: 4, ecommerce: 4, creative: 3, editorial: 2, automotive: 2, luxury: 2, finance: 6 },
  ant: { enterprise: 9, developer: 5, ecommerce: 6, finance: 7, consumer: 3, creative: 2, editorial: 2, automotive: 2, luxury: 1 },
  carbon: { enterprise: 9, developer: 8, finance: 7, consumer: 2, creative: 2, editorial: 3, automotive: 4, luxury: 2, ecommerce: 4 },
  atlassian: { enterprise: 8, developer: 7, consumer: 3, creative: 3, editorial: 2, automotive: 2, luxury: 1, ecommerce: 3, finance: 4 },
  "apple-hig": { consumer: 9, luxury: 7, creative: 6, ecommerce: 5, enterprise: 4, developer: 4, editorial: 4, automotive: 5, finance: 5 },
  polaris: { ecommerce: 9, consumer: 5, enterprise: 5, creative: 3, editorial: 3, automotive: 2, luxury: 4, developer: 2, finance: 5 },
  material: { consumer: 8, mobile: 9, creative: 5, ecommerce: 5, enterprise: 5, developer: 4, editorial: 3, automotive: 3, luxury: 2 },
  minimal: { editorial: 9, creative: 8, luxury: 7, consumer: 6, automotive: 6, developer: 5, enterprise: 4, ecommerce: 5, finance: 4 },
  glass: { creative: 8, luxury: 7, consumer: 6, automotive: 5, editorial: 5, ecommerce: 4, enterprise: 3, developer: 3, finance: 2 },
  neumorphism: { consumer: 6, creative: 4, wellness: 7, luxury: 4, automotive: 3, enterprise: 1, developer: 1, editorial: 2, ecommerce: 3 },
  "neo-brutalism": { creative: 9, consumer: 6, automotive: 5, luxury: 3, editorial: 5, enterprise: 2, developer: 4, ecommerce: 4, finance: 2 },
  claymorphism: { consumer: 7, creative: 5, wellness: 6, luxury: 3, automotive: 2, enterprise: 2, developer: 2, editorial: 3, ecommerce: 4 },
  skeuomorphism: { luxury: 8, automotive: 7, creative: 5, consumer: 4, editorial: 3, enterprise: 2, developer: 2, ecommerce: 3, finance: 3 },
  swiss: { editorial: 9, luxury: 8, automotive: 8, creative: 8, developer: 5, enterprise: 4, consumer: 4, ecommerce: 4, finance: 5 },
  "swiss-archival": { editorial: 9, luxury: 7, creative: 6, automotive: 5, enterprise: 3, developer: 4, consumer: 3, ecommerce: 2, finance: 3 },
  "m3-pastel": { consumer: 8, creative: 6, wellness: 5, luxury: 4, automotive: 2, enterprise: 2, developer: 2, editorial: 3, ecommerce: 5 },
  "neo-m3": { automotive: 8, creative: 7, luxury: 6, editorial: 7, consumer: 5, enterprise: 4, developer: 4, ecommerce: 4, finance: 4 },
};

const PALETTE_CONTEXT: Record<string, string[]> = {
  dark: ["automotive", "luxury", "developer", "gaming", "creative", "editorial"],
  pastel: ["consumer", "wellness", "creative", "mobile"],
  vibrant: ["consumer", "creative", "gaming", "ecommerce"],
  mono: ["enterprise", "editorial", "developer", "luxury", "automotive"],
};

function detectContext(description: string): string[] {
  const lower = description.toLowerCase();
  const matches: Array<{ category: string; count: number }> = [];

  for (const [category, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > 0) matches.push({ category, count });
  }

  matches.sort((a, b) => b.count - a.count);
  return matches.slice(0, 3).map((m) => m.category);
}

function scorePalette(contexts: string[]): string {
  const scores: Record<string, number> = { pastel: 0, dark: 0, vibrant: 0, mono: 0 };
  for (const ctx of contexts) {
    for (const [palette, paletteContexts] of Object.entries(PALETTE_CONTEXT)) {
      if (paletteContexts.includes(ctx)) scores[palette] += 2;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function scoreArchetype(description: string, contexts: string[]): string {
  const lower = description.toLowerCase();
  if (lower.includes("dashboard") || lower.includes("admin") || lower.includes("analytics")) return "dashboard";
  if (lower.includes("setting") || lower.includes("config") || lower.includes("preference")) return "settings";
  if (lower.includes("table") || lower.includes("list") || lower.includes("data")) return "table-detail";
  if (lower.includes("editorial") || lower.includes("blog") || lower.includes("article") || lower.includes("story")) return "editorial-landing";
  if (contexts.includes("automotive") || contexts.includes("luxury") || contexts.includes("creative")) return "marketing-hero";
  if (contexts.includes("ecommerce")) return "marketing-hero";
  return "marketing-hero";
}

function buildWorkflow(recommended: string, palette: string, archetype: string): string[] {
  return [
    `PHASE 1: WIREFRAME`,
    `  - validate_combo — style="${recommended}", palette="${palette}" → confirm valid`,
    `  - brand_fetch_design_md — pull reference for relevant brands (if applicable)`,
    `  - generate_rules — style="${recommended}", palette="${palette}", archetype="${archetype}" → get design rules (inc. Good Design criteria)`,
    `PHASE 2: PROTOTYPE`,
    `  - get_reference — pull deep-dive docs (accessibility, tokens, etc.) as needed`,
    `  - generate_template — style="${recommended}", palette="${palette}", archetype="${archetype}" → starter HTML`,
    `  - get_component — individual components styled for "${recommended}"`,
    `PHASE 3: TEST`,
    `  - export_project — full scaffold when ready to ship`,
    `  - Use cross-cutting rules to validate accessibility and responsive behavior`,
    `  - SELF-CHECK: Avoid beginner mistakes (complexity, color-overload, aesthetic > usability)`,
  ];
}

export function evaluateStyle(description: string): EvaluationResult {
  let contexts = detectContext(description);
  if (contexts.length === 0) {
    // Fallback if no keywords matched to prevent a 0-score tie where 'ant' wins by alphabetical order
    contexts = ["consumer", "creative"]; 
  }
  const primaryContext = contexts[0];

  const ranked: StyleScore[] = Object.entries(STYLES).map(([key, def]) => {
    const scoreTable = STYLE_SCORING[key] ?? {};
    let score = 0;
    const reasons: string[] = [];

    for (const ctx of contexts) {
      const ctxScore = scoreTable[ctx] ?? 0;
      score += ctxScore;
      if (ctxScore >= 7) reasons.push(`Strong fit for ${ctx} products`);
      else if (ctxScore >= 5) reasons.push(`Good fit for ${ctx} products`);
    }

    if (contexts.includes("automotive")) {
      if (["swiss", "neo-m3", "minimal", "skeuomorphism"].includes(key)) {
        score += 3;
        reasons.push("Matches automotive precision/editorial aesthetic");
      }
    }
    if (contexts.includes("luxury")) {
      if (["minimal", "swiss", "glass", "skeuomorphism", "neo-m3"].includes(key)) {
        score += 2;
        reasons.push("Fits luxury/premium positioning");
      }
    }
    
    // Add a tiny random jitter (0.01 - 0.09) to break ties so 'fluent'/'ant' don't always win exact ties
    score += Math.random() * 0.1;

    return { style: key, score, label: def.label, use_for: def.use_for, reasons };
  });

  ranked.sort((a, b) => b.score - a.score);
  const recommended = ranked[0].style;
  const palette = scorePalette(contexts);
  const archetype = scoreArchetype(description, contexts);

  return {
    product_context: description,
    ranked_styles: ranked.slice(0, 5),
    recommended,
    recommended_palette: palette,
    recommended_archetype: archetype,
    workflow: buildWorkflow(recommended, palette, archetype),
  };
}
