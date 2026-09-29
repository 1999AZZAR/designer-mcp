export interface StyleDef {
  label: string;
  use_for: string;
  rules: string[];
}

export interface ArchetypeDef {
  label: string;
  rules: string[];
}

export interface HybridDef {
  label: string;
  use_for: string;
  structure: string;
  brand: string;
  rules: string[];
}

export const STYLES: Record<string, StyleDef> = {
  fluent: {
    label: "Fluent Design",
    use_for: "Windows-like software, Microsoft-adjacent enterprise products",
    rules: [
      "Use light, depth, motion, material, and scale as the main interaction vocabulary.",
      "Prefer Segoe UI or system-like Microsoft typography.",
      "Use acrylic or layered surfaces sparingly and intentionally.",
      "Structure pages with command bars, modular cards, and panels.",
    ],
  },
  ant: {
    label: "Ant Design",
    use_for:
      "Admin panels, dashboards, CMS, internal tools, workflow-heavy products",
    rules: [
      "Apply Natural, Certain, Meaningful, and Growing as operating checks.",
      "Use familiar enterprise patterns: forms, tables, tags, drawers, modals, inline validation.",
      "Prefer page scaffolding with header, actions row, main content, and secondary detail region.",
      "Keep motion functional feedback, not decoration.",
    ],
  },
  carbon: {
    label: "Carbon Design",
    use_for: "Enterprise software, analytical tools, dense data interfaces",
    rules: [
      "Prioritize clarity, efficiency, consistency, and inclusive interaction behavior.",
      "Use IBM Plex Sans and IBM Plex Mono where appropriate.",
      "Keep structure grid-driven and tightly aligned.",
      "Favor dense but highly legible layout over decorative flourish.",
    ],
  },
  atlassian: {
    label: "Atlassian Design",
    use_for: "Collaboration products, project management, teamwork-heavy tools",
    rules: [
      "Design for shared task context and highly visible action hierarchy.",
      "Use clear status language, approachable feedback, and practical structure.",
      "Favor boards, lists, sidebars, task detail surfaces, and collaboration context.",
      "Keep patterns trustworthy and discoverable.",
    ],
  },
  "apple-hig": {
    label: "Apple Human Interface Guidelines",
    use_for: "iOS apps, macOS apps, Apple-adjacent premium interfaces",
    rules: [
      "Apply clarity, deference, and depth.",
      "Use SF Pro or an Apple-platform-aligned sans.",
      "Respect generous touch targets, calm hierarchy, and platform-native navigation patterns.",
      "Use blur and vibrancy only when they support depth and legibility.",
    ],
  },
  polaris: {
    label: "Shopify Polaris",
    use_for:
      "Merchant tools, commerce operations, inventory and order management",
    rules: [
      "Optimize for merchant productivity and reassuring task flow.",
      "Use clean cards, resource lists, tables, and direct helper/error copy.",
      "Keep merchant state visible: draft, active, paid, unavailable, etc.",
      "Balance operational clarity with a friendly product tone.",
    ],
  },
  material: {
    label: "Material You",
    use_for:
      "Adaptive modern apps, expressive product UI, Android-aligned products",
    rules: [
      "Use tonal surfaces, adaptive hierarchy, and rounded geometry.",
      "Prefer material-style app bars, cards, chips, tabs, FABs, and sheets.",
      "Keep layouts responsive and fluid across breakpoints.",
      "Use expressive but disciplined motion.",
    ],
  },
  minimal: {
    label: "Minimalism",
    use_for:
      "Editorial sites, portfolios, clean product pages, content-first SaaS",
    rules: [
      "Let typography and whitespace carry hierarchy.",
      "Remove decorative structure that does not improve comprehension.",
      "Use borders rarely and shadows only if they are nearly invisible.",
      "Favor calm, content-first composition over component clutter.",
    ],
  },
  glass: {
    label: "Glassmorphism",
    use_for: "Hero sections, premium overlays, modern branded dashboards",
    rules: [
      "Use transparency and blur against rich backgrounds only.",
      "Keep glass surfaces readable with controlled opacity and contrast.",
      "Do not use glass as the sole logic system for dense workflows.",
      "Use it as a surface treatment, not as a substitute for structure.",
    ],
  },
  neumorphism: {
    label: "Neumorphism",
    use_for: "Tactile niche controls, wellness or ambient experimental UI",
    rules: [
      "Use monochrome or near-monochrome palettes and dual shadow depth.",
      "Keep surfaces simple, spacious, and limited in number.",
      "Offset low-contrast surfaces with very clear typography and focus treatment.",
      "Do not use for dense enterprise workflows.",
    ],
  },
  "neo-brutalism": {
    label: "Neo-Brutalism",
    use_for: "Loud digital brands, campaign surfaces, creative launches",
    rules: [
      "Use thick borders, hard shadows, bold type, and unapologetic contrast.",
      "Keep hierarchy obvious through scale and graphic separation.",
      "Avoid soft gradients, blurred shadows, and timid edge treatment.",
      "Use for strong brand expression, not dense workflow scaffolding.",
    ],
  },
  claymorphism: {
    label: "Claymorphism",
    use_for: "Playful consumer interfaces and soft friendly product surfaces",
    rules: [
      "Use inflated shapes, large radii, and soft dimensional depth.",
      "Keep layouts simple and spacious so the 3D treatment can breathe.",
      "Use soft or pastel colors with readable contrast.",
      "Avoid dense or highly analytical layouts.",
    ],
  },
  skeuomorphism: {
    label: "Skeuomorphism",
    use_for: "Luxury, nostalgic, tactile, or retro control surfaces",
    rules: [
      "Use realistic materials, layered shadows, reflections, and tactile cues.",
      "Commit to one dominant material story such as leather, metal, or wood.",
      "Use sparingly and intentionally to avoid visual overload.",
      "Keep readability and interaction clarity ahead of realism.",
    ],
  },
  swiss: {
    label: "Swiss Design",
    use_for: "Typography-first editorial systems, professional modernist pages",
    rules: [
      "Treat the grid as law.",
      "Use type, spacing, and asymmetry as the main compositional tools.",
      "Avoid shadows, gradients, and decorative effects.",
      "Keep the palette highly restrained.",
    ],
  },
  "swiss-archival": {
    label: "Swiss-Archival Design",
    use_for:
      "Digital archives, museum sites, academic platforms, heritage brands",
    rules: [
      "Follow the geometry ruleset: seed, superformula paths, layers, orbits, captions.",
      "Use the dual-font system: display + body with strict hierarchy.",
      "Apply noise texture and tactile surface treatment.",
      "Use keyboard-first interaction patterns.",
      "Source color tokens from the Swiss-Archival palette (Tailscale ramps).",
    ],
  },
  "m3-pastel": {
    label: "M3 Pastel",
    use_for:
      "Soft modern SaaS, creative dashboards, gentler material-style products",
    rules: [
      "Keep Material-style structure but soften it with pastel tonal surfaces.",
      "Use large rounded geometry and controlled surface layering.",
      "Protect contrast when using pale colors.",
      "Let color soften the tone without reducing clarity.",
    ],
  },
  "neo-m3": {
    label: "Neo-M3",
    use_for:
      "Editorial tech products, bold SaaS, structured brand-forward product UI",
    rules: [
      "Mix strong product structure with bolder editorial energy.",
      "Use bold borders, strong geometry, and controlled hard-shadow accents.",
      "Reserve monospace for metadata and technical emphasis.",
      "Do not let expressive surfaces break overall layout discipline.",
    ],
  },
};

export const PALETTES: Record<string, string[]> = {
  pastel: [
    "Use soft, low-saturation, high-value colors.",
    "Prefer light neutral canvases and toned accents.",
    "Protect text contrast on pale surfaces.",
  ],
  dark: [
    "Use deep but not absolute-black surfaces unless intentionally brutal.",
    "Separate layers through surface value shifts, not only shadows.",
    "Keep accent colors controlled and high legibility.",
  ],
  vibrant: [
    "Use strong accent colors against calm neutrals or stark black/white contrast.",
    "Limit the number of loud colors so hierarchy stays clear.",
    "Use saturation strategically for priority and emphasis.",
  ],
  mono: [
    "Use one hue family across multiple tones and values.",
    "Let spacing, typography, and contrast carry structure.",
    "Use accent shifts carefully to avoid flatness.",
  ],
};

export const ARCHETYPES: Record<string, ArchetypeDef> = {
  dashboard: {
    label: "Dashboard",
    rules: [
      "Use a page header, KPI strip, controls row, primary data region, and secondary widget region.",
      "Make the first screen scannable in under 5 seconds.",
      "Do not let every widget fight for equal visual weight.",
    ],
  },
  settings: {
    label: "Settings",
    rules: [
      "Group settings by user mental model, not backend schema.",
      "Use strong labels, helper text, and inline validation.",
      "Separate destructive actions from routine configuration.",
    ],
  },
  "table-detail": {
    label: "Table Detail",
    rules: [
      "Use header, filter and bulk action row, primary table, and detail drawer or side panel.",
      "Keep row actions predictable and status visibility high.",
      "Design bulk, empty, loading, and detail-edit flows together.",
    ],
  },
  "marketing-hero": {
    label: "Marketing Hero",
    rules: [
      "Establish one clear visual thesis immediately.",
      "Keep headline, proof, and CTA hierarchy obvious.",
      "Avoid generic interchangeable SaaS hero layouts.",
    ],
  },
  "editorial-landing": {
    label: "Editorial Landing",
    rules: [
      "Let typography and rhythm drive the page structure.",
      "Use modular story blocks with intentional asymmetry or calm sequencing.",
      "Treat whitespace as an active layout tool.",
    ],
  },
};

export const HYBRIDS: Record<string, HybridDef> = {
  "polaris+swiss": {
    label: "Polaris + Swiss",
    use_for: "Commerce platforms wanting editorial polish, luxury e-commerce",
    structure: "polaris",
    brand: "swiss",
    rules: [
      "Polaris owns: commerce workflows, forms, tables, filters, product management.",
      "Swiss owns: typography system, editorial layout, grid rigor, brand expression.",
      "Use Swiss typography for product storytelling, Polaris components for operations.",
      "Keep grid strict (Swiss) but apply Polaris spacing for interactive density.",
    ],
  },
  "polaris+swiss-archival": {
    label: "Polaris + Swiss-Archival",
    use_for:
      "Heritage brands, artisan marketplaces, curated commerce with provenance",
    structure: "polaris",
    brand: "swiss-archival",
    rules: [
      "Polaris owns: commerce operations, order flows, inventory management.",
      "Swiss-Archival owns: brand surface, product storytelling, archival catalogs.",
      "Use Swiss-Archival noise texture and dual-font on product pages.",
      "Use Polaris resource lists and tables for admin/merchant views.",
    ],
  },
  "ant+neo-m3": {
    label: "Ant + Neo-M3",
    use_for: "Enterprise products needing bold brand on marketing surfaces",
    structure: "ant",
    brand: "neo-m3",
    rules: [
      "Ant owns: tables, forms, filters, drawers, notifications.",
      "Neo-M3 owns: hero sections, high-level brand surfaces, special callouts.",
    ],
  },
  "ant+glass": {
    label: "Ant + Glass",
    use_for:
      "Enterprise products with atmospheric landing/dashboard highlights",
    structure: "ant",
    brand: "glass",
    rules: [
      "Ant owns: product workflows.",
      "Glass owns: landing, dashboard highlight cards, atmospheric shells.",
    ],
  },
  "carbon+minimal": {
    label: "Carbon + Minimal",
    use_for: "Dense analytical tools with clean outer layout",
    structure: "carbon",
    brand: "minimal",
    rules: [
      "Carbon owns: dense operational components.",
      "Minimal softens: outer layout and marketing surfaces.",
    ],
  },
  "material+m3-pastel": {
    label: "Material + M3-Pastel",
    use_for: "Modern apps needing softer visual tone",
    structure: "material",
    brand: "m3-pastel",
    rules: [
      "Material owns: structure and behavior.",
      "M3-Pastel softens: color and surface language.",
    ],
  },
};

export const CROSS_CUTTING = {
  icons: {
    label: "Icon Standards",
    rules: [
      "NEVER use icons from unapproved sources.",
      "Only these 6 icon libraries are allowed: Phosphor, Font Awesome, Google Material Symbols, Tabler, Lucide, Heroicons.",
      "Use icons from the approved set only — reject all others.",
      "Match icon style (outline/filled/duotone) to the chosen design system.",
    ],
  },
  accessibility: {
    label: "Accessibility (WCAG AA)",
    rules: [
      "All text must meet WCAG AA contrast (4.5:1 normal, 3:1 large).",
      "Every interactive element must have visible focus indicators.",
      "All form inputs must have visible labels (not placeholder-only).",
      "Use semantic HTML: landmarks, headings in order, lists for repeated items.",
      "Never use color alone to convey information — add icon, text, or pattern.",
      "Icon-only buttons must have aria-label.",
      "Respect prefers-reduced-motion for all animations.",
      "Minimum touch target: 44x44px.",
    ],
  },
  motion: {
    label: "Motion & Animation",
    rules: [
      "Use motion as feedback, not decoration.",
      "Standard transitions: 150-250ms with ease-out for entering, ease-in for exiting.",
      "No animation longer than 500ms without a progress indicator.",
      "No flashing content (max 3 flashes per second).",
      "Always respect prefers-reduced-motion.",
    ],
  },
  tokens: {
    label: "Design Tokens",
    rules: [
      "Use consistent spacing scale based on 4px increments.",
      "Typography: max 4-5 size steps per system.",
      "Border radius: pick 2-3 values max (sm, md, lg) and reuse.",
      "Shadows: use sparingly, prefer surface elevation via color shift.",
      "Z-index: use a scale, not ad-hoc values.",
    ],
  },
  responsive: {
    label: "Responsive Layout",
    rules: [
      "Design mobile-first, enhance for larger screens.",
      "Use 12-column grid with consistent gutters.",
      "Stack elements vertically on mobile, use columns on tablet+.",
      "Tables become card layouts on mobile.",
      "Navigation: bottom tabs (mobile) → sidebar (desktop).",
    ],
  },
  tailwind: {
    label: "Tailwind CSS",
    rules: [
      "When using Tailwind CSS, follow utility-first patterns.",
      "Use @apply sparingly — prefer utilities in markup.",
      "Dark mode: use class-based dark: prefix.",
      "Custom colors go in tailwind.config.js extend section.",
      "Responsive: mobile-first with sm:, md:, lg:, xl: prefixes.",
    ],
  },
};

const BASE_RULES = `# AI Design Rules

## Core Philosophy
- Choose the design system from product context first, not visual taste first.
- Prefer one primary design language unless a hybrid has explicit ownership boundaries.
- Avoid generic AI aesthetics: no default purple gradients, no glossy filler, no emoji in functional UI.
- Keep interfaces production-ready, accessible, and structurally coherent.

## UI Principles
1. **Structural, Clear, and Tidy**: Layout must follow a logical hierarchy with intentional alignment and grouping.
2. **Clear and Understandable**: Every element must have a clear purpose and be easily identifiable.
3. **Consistent and Coherent**: Use the same patterns, spacing, and styles across the entire interface.
4. **Purposeful and Relevant**: Only include elements that serve a specific user goal.
5. **Adaptable and Responsive**: Design must work seamlessly across all screen sizes and orientations.

## What Makes a Good Design?
1. **Emphasis**: Highlight the most important elements to guide user attention.
2. **Alignment and Balance**: Ensure a stable, professional look through mathematical or visual grid alignment.
3. **Contrast**: Use value, color, and size to create clear distinctions between elements.
4. **Consistency and Repetition**: Replicate patterns and styles to build familiarity and speed.
5. **White Space**: Use empty space to let the design breathe and prevent cognitive overload.
6. **Hierarchy**: Establish a clear path for the eye to follow, from most to least important.
7. **Unity and Cohesion**: Ensure all parts feel like they belong to a single, purposeful system.

## Beginner Mistakes (DO NOT DO)
- **Not following the design flow**: Skipping wireframes or testing leads to structural failure.
- **Too much complexity/detail**: Over-designing components makes them hard to maintain and use.
- **Too much color**: Excessive palettes distract from the functional hierarchy.
- **No visual hierarchy**: If everything is loud, nothing is heard.
- **No clear purpose**: Every pixel must justify its existence in service of a user goal.
- **Poor usability and spacing**: Cramped or illogical layouts frustrate users.
- **Prioritizing aesthetic over usability**: A "cool" design that is unusable is a failed design.
`;

function formatSection(title: string, items: string[]): string {
  return [`## ${title}`, ...items.map((i) => `- ${i}`)].join("\n");
}

export function buildSingle(
  style: string,
  palette: string,
  archetype?: string,
  tailwind = false,
): string {
  const s = STYLES[style];
  if (!s)
    throw new Error(
      `Style '${style}' not found. Available: ${Object.keys(STYLES).join(", ")}`,
    );

  const sections: string[] = [BASE_RULES.trim()];
  sections.push(
    formatSection(`Selected System: ${s.label}`, [
      `Use for: ${s.use_for}`,
      ...s.rules,
    ]),
  );
  sections.push(
    formatSection(`Palette: ${palette.toUpperCase()}`, PALETTES[palette]),
  );

  if (archetype && ARCHETYPES[archetype]) {
    sections.push(
      formatSection(
        `Archetype: ${ARCHETYPES[archetype].label}`,
        ARCHETYPES[archetype].rules,
      ),
    );
  }

  for (const key of ["icons", "accessibility", "motion", "tokens"] as const) {
    sections.push(
      formatSection(CROSS_CUTTING[key].label, CROSS_CUTTING[key].rules),
    );
  }

  if (tailwind) {
    sections.push(
      formatSection(
        CROSS_CUTTING.responsive.label,
        CROSS_CUTTING.responsive.rules,
      ),
    );
    sections.push(
      formatSection(CROSS_CUTTING.tailwind.label, CROSS_CUTTING.tailwind.rules),
    );
  }

  return sections.join("\n\n") + "\n";
}

export function buildHybrid(
  primary: string,
  secondary: string,
  palette: string,
  archetype?: string,
): string {
  const key = `${primary}+${secondary}`;
  const h = HYBRIDS[key];
  if (!h)
    throw new Error(
      `No hybrid pattern for '${key}'. Available: ${Object.keys(HYBRIDS).join(", ")}`,
    );

  const sections: string[] = [BASE_RULES.trim()];
  sections.push(
    formatSection(`Hybrid: ${h.label}`, [`Use for: ${h.use_for}`, ...h.rules]),
  );
  sections.push(
    formatSection(`Structure Owner: ${STYLES[primary].label}`, [
      `Use for: ${STYLES[primary].use_for}`,
      ...STYLES[primary].rules,
    ]),
  );
  sections.push(
    formatSection(
      `Brand Owner: ${STYLES[secondary].label}`,
      STYLES[secondary].rules,
    ),
  );
  sections.push(
    formatSection(`Palette: ${palette.toUpperCase()}`, PALETTES[palette]),
  );

  if (archetype && ARCHETYPES[archetype]) {
    sections.push(
      formatSection(
        `Archetype: ${ARCHETYPES[archetype].label}`,
        ARCHETYPES[archetype].rules,
      ),
    );
  }

  sections.push(
    formatSection(CROSS_CUTTING.icons.label, CROSS_CUTTING.icons.rules),
  );
  sections.push(
    formatSection(
      CROSS_CUTTING.accessibility.label,
      CROSS_CUTTING.accessibility.rules,
    ),
  );
  sections.push(
    formatSection(CROSS_CUTTING.motion.label, CROSS_CUTTING.motion.rules),
  );

  return sections.join("\n\n") + "\n";
}

export interface RulesResult {
  styles: string[];
  palettes: string[];
  archetypes: string[];
  hybrids: string[];
  cross_cutting: string[];
  selected_style?: string | null;
  selected_hybrid?: string | null;
  selected_palette?: string;
  selected_archetype?: string;
  rules?: string;
}

export function buildRulesJson(opts: {
  style?: string;
  palette?: string;
  archetype?: string;
  hybrid?: string;
  content?: string;
}): RulesResult {
  const result: RulesResult = {
    styles: Object.keys(STYLES),
    palettes: Object.keys(PALETTES),
    archetypes: Object.keys(ARCHETYPES),
    hybrids: Object.keys(HYBRIDS),
    cross_cutting: Object.keys(CROSS_CUTTING),
  };
  if (opts.hybrid) {
    result.selected_hybrid = opts.hybrid;
    result.selected_style = null;
  } else {
    result.selected_style = opts.style ?? null;
  }
  result.selected_palette = opts.palette;
  result.selected_archetype = opts.archetype;
  if (opts.content) result.rules = opts.content;
  return result;
}
