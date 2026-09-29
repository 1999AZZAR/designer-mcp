export interface SlopGate {
  id: number;
  name: string;
  description: string;
  check: (content: string) => { pass: boolean; detail: string };
  scoped?:
    | "universal"
    | "editorial"
    | "modern-minimal"
    | "atmospheric"
    | "playful";
}

export interface SlopTestResult {
  total: number;
  passed: number;
  failed: number;
  gates: Array<{ id: number; name: string; pass: boolean; detail: string }>;
  summary: string;
}

function hasInCSS(content: string, pattern: RegExp): boolean {
  return pattern.test(content);
}

function countInCSS(content: string, pattern: RegExp): number {
  return (content.match(pattern) ?? []).length;
}

const ALL_GATES: SlopGate[] = [
  // 1-10: Structure & Layout
  {
    id: 1,
    name: "Specimen fall-through",
    description:
      "Is this using the numbered left-margin label pattern without explicit editorial/archival brief?",
    check: (c) => {
      const hit = /left-margin|numbered.*label|hanging.*number/i.test(c);
      return {
        pass: !hit,
        detail: hit
          ? "Specimen pattern detected — only use for explicit editorial briefs"
          : "No specimen pattern",
      };
    },
  },
  {
    id: 2,
    name: "Section tag positioning",
    description:
      "Tags must stack vertically above headings, not hang left-margin?",
    check: (c) => {
      const hanging = /tag-left|heading-right|left.*label.*column/i.test(c);
      return {
        pass: !hanging,
        detail: hanging
          ? "Hanging tag pattern detected — stack vertically instead"
          : "Tags stack vertically",
      };
    },
    scoped: "editorial",
  },
  {
    id: 3,
    name: "Three-feature grid default",
    description:
      "Are features in a 3-column grid without structural justification?",
    check: (c) => {
      const threeCol = countInCSS(c, /grid-cols-3/g);
      return {
        pass: threeCol < 2,
        detail:
          threeCol >= 2
            ? `3-column grid found ${threeCol}x — vary the grid or use a different macrostructure`
            : "No default 3-col grid",
      };
    },
  },
  {
    id: 4,
    name: "No re-drawn browser chrome",
    description: "No fake browser bars / phone frames / code window chrome?",
    check: (c) => {
      const fakeChrome =
        /browser.*bar|traffic.*light|url.*pill|phone.*frame|mock.*title.*bar/i.test(
          c,
        );
      return {
        pass: !fakeChrome,
        detail: fakeChrome
          ? "Fake browser/phone chrome detected — use real screenshots"
          : "No fake chrome",
      };
    },
  },
  {
    id: 5,
    name: "No emoji in functional UI",
    description:
      "No emoji used as icons in functional interfaces (settings, nav, actions)?",
    check: (c) => {
      const emojiInUI = /[🔧⚙️📊📈📉💼🗂️📁📎🔗🖊️✏️📝]/u.test(c);
      return {
        pass: !emojiInUI,
        detail: emojiInUI
          ? "Emoji detected in UI — use proper icon library instead"
          : "No emoji in UI",
      };
    },
  },
  {
    id: 6,
    name: "No section tag / kicker default",
    description:
      "No generic '01 · THE TOUR' / '02 / FEATURES' / 'Chapter Three' section labels?",
    check: (c) => {
      const sectionTags =
        /\b0\d\s*[·/]\s*[A-Z]{3,}|chapter\s+(one|two|three|1|2|3)\b/i.test(c);
      return {
        pass: !sectionTags,
        detail: sectionTags
          ? "Auto-generated section tags detected — only use when content is genuinely ordinal"
          : "No generic section tags",
      };
    },
  },
  {
    id: 7,
    name: "CTA voice discipline",
    description:
      "No 'Get Started' / 'Learn More' as sole CTA voice without brand-specific alternatives?",
    check: (c) => {
      const ctaVoice = /get\s+started|learn\s+more/i.test(c);
      return {
        pass: !ctaVoice,
        detail: ctaVoice
          ? "Generic CTA voice detected — use brand-specific action verbs"
          : "CTA voice is specific",
      };
    },
  },
  {
    id: 8,
    name: "No Lorem ipsum",
    description: "No placeholder Latin text in final output?",
    check: (c) => {
      const lorem = /lorem\s+ipsum/i.test(c);
      return {
        pass: !lorem,
        detail: lorem
          ? "Lorem ipsum detected — use real copy or labeled grey block"
          : "No placeholder text",
      };
    },
  },
  {
    id: 9,
    name: "Nav + footer match in complexity",
    description:
      "Does the page have both nav and footer, and do they match in complexity?",
    check: (c) => {
      return {
        pass: true,
        detail: "Manual check: nav and footer should belong to the same genus",
      };
    },
  },

  // 11-20: Typography
  {
    id: 11,
    name: "Italic headers banned",
    description:
      "No italic font-style or <em> inside headings? 'Built to <em>think</em>' is an AI tell.",
    check: (c) => {
      const italicCSS = /h[1-6][^{]*\{[^}]*font-style:\s*italic/i.test(c);
      const italicHTML = /<h[1-6][^>]*>[^<]*<em>/i.test(c);
      return {
        pass: !italicCSS && !italicHTML,
        detail: italicCSS
          ? "Italic heading via CSS detected"
          : italicHTML
            ? "<em> inside heading detected — use weight, color, or underline instead"
            : "Heading style is roman",
      };
    },
  },
  {
    id: 15,
    name: "No italic display face on headings",
    description: "No italic/oblique display font used for heading text?",
    check: (c) => {
      const italicDisplay = /italic|oblique/.test(c);
      return {
        pass: !italicDisplay,
        detail: "Italic display font detected on heading text",
      };
    },
  },
  {
    id: 12,
    name: "Hero headline size matched to length",
    description:
      "Headline font-size appropriate for copy length? (short: large, long: smaller)",
    check: (c) => {
      return {
        pass: true,
        detail:
          "Manual review required — check headline size vs character count",
      };
    },
  },
  {
    id: 16,
    name: "Hanging header pattern banned",
    description:
      "No tag-left/heading-right two-column section header pattern? That is a templated-editorial tell.",
    check: (c) => {
      const hanging =
        /tag.*left.*column.*heading.*right|left.*label.*right.*heading/i.test(
          c,
        );
      return {
        pass: !hanging,
        detail: hanging
          ? "Hanging header pattern detected — stack tag above heading vertically"
          : "No hanging header pattern",
      };
    },
  },
  {
    id: 13,
    name: "No hanging punctuation without intent",
    description:
      "No decorative quotes or ornamental punctuation used as filler?",
    check: (c) => {
      const decorQuotes = /[❝❞❟❠🙶🙷⸮]/u.test(c);
      return {
        pass: !decorQuotes,
        detail: decorQuotes
          ? "Decorative ornamental quotes detected"
          : "No decorative quotes",
      };
    },
  },
  {
    id: 14,
    name: "Font pairing present",
    description:
      "Page uses a distinctive display face + refined body face (not single font unless intentional)?",
    check: (c) => {
      const singleFont = /font-family:\s*var\(--font-[^)]+\)/g;
      const matches = c.match(singleFont);
      return {
        pass: (matches?.length ?? 0) >= 2,
        detail:
          matches && matches.length < 2
            ? "Only one font family used — add a display/body pairing"
            : "Font pairing found",
      };
    },
  },

  // 21-30: Color & Tokens
  {
    id: 21,
    name: "No default purple gradient",
    description: "No purple-blue gradient without brief justification?",
    check: (c) => {
      const purpleGrad =
        /purple.*gradient|gradient.*purple|indigo.*purple.*gradient/i.test(c);
      return {
        pass: !purpleGrad,
        detail: purpleGrad
          ? "Default purple gradient detected — use brief-specific palette"
          : "No default purple gradient",
      };
    },
  },
  {
    id: 22,
    name: "Token reference discipline",
    description:
      "All colors reference named tokens, not inline hex/OKLCH values?",
    check: (c) => {
      const inlineVals =
        countInCSS(c, /#[0-9a-fA-F]{3,8}/g) + countInCSS(c, /oklch\([^)]+\)/g);
      return {
        pass: inlineVals < 5,
        detail:
          inlineVals >= 5
            ? `${inlineVals} inline color values found — use CSS custom property tokens`
            : "Most colors use tokens",
      };
    },
  },
  {
    id: 23,
    name: "OKLCH preferred over hex",
    description: "New color tokens defined in OKLCH, not hex?",
    check: (c) => {
      const hexDefs = countInCSS(c, /--[\w-]+:\s*#[0-9a-fA-F]{3,8}/g);
      const oklchDefs = countInCSS(c, /--[\w-]+:\s*oklch\(/g);
      return {
        pass: hexDefs <= oklchDefs,
        detail: `${hexDefs} hex vs ${oklchDefs} OKLCH token definitions`,
      };
    },
  },
  {
    id: 24,
    name: "Contrast ratio sufficient",
    description:
      "Text colors provide sufficient contrast against backgrounds (WCAG AA 4.5:1)?",
    check: (c) => {
      return {
        pass: true,
        detail:
          "Manual verification recommended — check text/background contrast",
      };
    },
  },

  // 31-40: Motion & Microinteractions
  {
    id: 31,
    name: "animate transform/opacity only",
    description:
      "Transitions/animate only transform and opacity, never layout properties?",
    check: (c) => {
      const layoutAnim =
        /transition.*margin|transition.*width|transition.*height|transition.*padding|transition.*top|transition.*left|animate.*margin|animate.*width|animate.*height/i.test(
          c,
        );
      return {
        pass: !layoutAnim,
        detail: layoutAnim
          ? "Layout-animating properties detected — use transform instead"
          : "Only transform/opacity animated",
      };
    },
  },
  {
    id: 32,
    name: "Named easings",
    description:
      "Uses --ease-out, --ease-in, --ease-in-out custom properties, not browser defaults?",
    check: (c) => {
      const namedEasings = countInCSS(c, /--ease-(out|in|in-out)/g);
      return {
        pass: namedEasings >= 1,
        detail:
          namedEasings >= 1
            ? `Named easings found: ${namedEasings}`
            : "No named easing tokens — define --ease-* variables",
      };
    },
  },
  {
    id: 33,
    name: "No bounce/overshoot on UI state",
    description: "No bounce or overshoot easings on functional UI transitions?",
    check: (c) => {
      const bounce = /cubic-bezier\([^)]*[0-9.]*\.[5-9][0-9]\s*,\s*[12]/i.test(
        c,
      );
      return {
        pass: !bounce,
        detail: bounce
          ? "Bounce/overshoot easing detected on UI transition"
          : "No bounce easings",
      };
    },
  },
  {
    id: 34,
    name: "prefers-reduced-motion respected",
    description: "Has @media (prefers-reduced-motion: reduce) override?",
    check: (c) => {
      const has = /prefers-reduced-motion/i.test(c);
      return {
        pass: has,
        detail: has
          ? "prefers-reduced-motion rule found"
          : "Missing prefers-reduced-motion — add reduced motion support",
      };
    },
  },
  {
    id: 35,
    name: "focus-visible ring instant",
    description:
      "Focus ring appears instantly (no animation) with sufficient contrast?",
    check: (c) => {
      const hasFv = /:focus-visible/.test(c);
      return {
        pass: hasFv,
        detail: hasFv
          ? "focus-visible styling found"
          : "Missing :focus-visible styling",
      };
    },
  },
  {
    id: 36,
    name: "No floating nav without matching footer",
    description:
      "A floating/chrome-less nav should pair with a matching footer, not a dense 4-column one.",
    check: (c) => {
      return {
        pass: true,
        detail: "Manual check: nav and footer should share the same genus",
      };
    },
  },
  {
    id: 37,
    name: "Glassmorphism hero requires dark background",
    description:
      "Glass surfaces need a background to blur against — dark or rich gradient.",
    check: (c) => {
      const glassLight =
        /backdrop-blur[^}]*background-color:\s*white|backdrop-blur[^}]*background:\s*#[fF]{6}/i.test(
          c,
        );
      return {
        pass: !glassLight,
        detail: glassLight
          ? "Glass effect on white background — glass needs dark/rich backdrop"
          : "Glass has proper backdrop",
      };
    },
  },

  // 41-50: Content & Copy
  {
    id: 41,
    name: "No fabricated metrics",
    description:
      "No invented numbers — stats, testimonials, case study counts, proof bars?",
    check: (c) => {
      const inventedPatterns =
        /\+?\d+\s*%?\s*(faster|more|better|improvement|increase|growth|conversion)/i.test(
          c,
        );
      const numbers =
        /trusted by.*\d+,?\d*\+?\s*(teams|customers|users|companies)/i.test(c);
      return {
        pass: !inventedPatterns && !numbers,
        detail:
          inventedPatterns || numbers
            ? "Invented metrics detected — use real data or labeled placeholders"
            : "No fabricated metrics",
      };
    },
  },
  {
    id: 42,
    name: "No fake testimonials",
    description: "No fabricated quotes from imaginary people?",
    check: (c) => {
      const fakeTest =
        /"([^"]{10,})"\s*[-–]\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/.test(c);
      return {
        pass: !fakeTest,
        detail: fakeTest
          ? "Suspiciously specific testimonial with full name detected — use real testimonials or placeholder"
          : "No fake testimonials",
      };
    },
  },
  {
    id: 43,
    name: "No fake logos",
    description:
      "No brand logos used without the brand's consent or real relationship?",
    check: (c) => {
      return {
        pass: true,
        detail:
          "Manual check: are logos from real companies used with permission?",
      };
    },
  },

  // 51-58: Responsive
  {
    id: 51,
    name: "No horizontal scroll",
    description: "No overflow causing horizontal scroll at any breakpoint?",
    check: (c) => {
      const hasClip = /overflow-x:\s*clip/i.test(c);
      const hasHidden = /overflow-x:\s*hidden/i.test(c);
      return {
        pass: hasClip,
        detail: hasClip
          ? "overflow-x: clip found"
          : hasHidden
            ? "overflow-x: hidden (use clip instead)"
            : "No overflow-x protection — add overflow-x: clip to html/body",
      };
    },
  },
  {
    id: 52,
    name: "No two-line clickable text",
    description: "No buttons/links/CTAs wrapping to two lines at 320px?",
    check: (c) => {
      return {
        pass: true,
        detail:
          "Manual check required: inspect all clickable text at 320px viewport",
      };
    },
  },
  {
    id: 53,
    name: "Grid tracks use minmax(0, 1fr)",
    description: "Image-bearing grid tracks use minmax(0, 1fr), not bare 1fr?",
    check: (c) => {
      const bare1fr = countInCSS(
        c,
        /grid-template-columns:\s*(?:repeat\([^,]+,\s*)?1fr/g,
      );
      const minmax = countInCSS(c, /minmax\(0,\s*1fr\)/g);
      return {
        pass: bare1fr <= minmax,
        detail: `bare 1fr: ${bare1fr}, minmax(0, 1fr): ${minmax} — prefer minmax(0, 1fr) for image tracks`,
      };
    },
  },
  {
    id: 54,
    name: "Section heads collapse to one column",
    description:
      "Multi-column section heads collapse to single column on mobile?",
    check: (c) => {
      return {
        pass: true,
        detail: "Manual check: verify section layouts stack at 320px",
      };
    },
  },
  {
    id: 55,
    name: "Display headers wrap safely",
    description: "Long display headers use overflow-wrap: anywhere?",
    check: (c) => {
      const hasWrap = /overflow-wrap:\s*anywhere/i.test(c);
      return {
        pass: hasWrap,
        detail: hasWrap
          ? "overflow-wrap: anywhere found"
          : "Missing overflow-wrap on display headings",
      };
    },
  },
  {
    id: 56,
    name: "Touch targets 44x44px minimum",
    description: "All interactive elements meet minimum touch target size?",
    check: (c) => {
      return {
        pass: true,
        detail: "Manual check: verify all interactive elements are >= 44x44px",
      };
    },
  },
];

function applyGenreOverrides(gates: SlopGate[], genre: string): SlopGate[] {
  return gates.filter((g) => {
    if (!g.scoped) return true;
    if (g.scoped === genre) return true;
    return false;
  });
}

export function runSlopTest(
  content: string,
  genre = "editorial",
): SlopTestResult {
  const scopedGates = applyGenreOverrides(ALL_GATES, genre);
  const results = scopedGates.map((gate) => ({
    id: gate.id,
    name: gate.name,
    pass: gate.check(content).pass,
    detail: gate.check(content).detail,
  }));

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  return {
    total: results.length,
    passed,
    failed,
    gates: results,
    summary:
      failed === 0
        ? `${passed} / ${results.length} gates passed ✓`
        : `${passed} / ${results.length} — fails on: ${results
            .filter((r) => !r.pass)
            .map((r) => `${r.id}`)
            .join(", ")}`,
  };
}

export interface QualityScore {
  philosophy: number;
  hierarchy: number;
  execution: number;
  specificity: number;
  restraint: number;
  variety: number;
  summary: string;
}

export function selfCritique(content: string): QualityScore {
  const score = {
    philosophy: 4,
    hierarchy: 3,
    execution: 3,
    specificity: 3,
    restraint: 3,
    variety: 3,
  };

  if (countInCSS(content, /--[\w-]+/g) > 10) score.specificity = 5;
  if (hasInCSS(content, /:focus-visible/))
    score.execution = Math.min(5, score.execution + 1);
  if (hasInCSS(content, /prefers-reduced-motion/))
    score.execution = Math.min(5, score.execution + 1);
  if (countInCSS(content, /nth|:has\(|:not\(/g) > 0)
    score.hierarchy = Math.min(5, score.hierarchy + 1);
  if (countInCSS(content, /[#.][a-z]/g) < 30)
    score.restraint = Math.min(5, score.restraint + 1);
  if (hasInCSS(content, /var\(--/))
    score.philosophy = Math.min(5, score.philosophy + 1);

  const allScores = [
    score.philosophy,
    score.hierarchy,
    score.execution,
    score.specificity,
    score.restraint,
    score.variety,
  ];
  const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  return {
    ...score,
    summary: `P${score.philosophy} · H${score.hierarchy} · E${score.execution} · S${score.specificity} · R${score.restraint} · V${score.variety} — avg ${avg.toFixed(1)}/5`,
  };
}
