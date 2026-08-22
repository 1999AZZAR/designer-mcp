/**
 * anime-motion.ts
 * anime.js v3 integration for the-designer MCP.
 * Provides style-aware animation presets, CDN helpers, and the
 * generate_motion_snippet tool implementation.
 *
 * CDN: https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js
 */

// ─── CDN ────────────────────────────────────────────────────────────────────

export const ANIME_CDN =
  `<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>`;

// ─── Types ───────────────────────────────────────────────────────────────────

export type MotionCategory =
  | "entrance"      // page/section load animations
  | "micro"         // button / chip / toggle micro-interactions
  | "stagger"       // list / grid stagger reveals
  | "scroll"        // scroll-triggered (IntersectionObserver + anime)
  | "loader"        // spinner / skeleton loader
  | "transition"    // page / route transitions
  | "counter"       // animated number counter
  | "typewriter";   // text typewriter effect

export const MOTION_CATEGORIES: MotionCategory[] = [
  "entrance", "micro", "stagger", "scroll",
  "loader", "transition", "counter", "typewriter",
];

// ─── Easing map per design style ─────────────────────────────────────────────

const STYLE_EASING: Record<string, string> = {
  "glass":          "easeOutQuart",
  "neo-brutalism":  "easeInOutExpo",
  "claymorphism":   "spring(1, 80, 10, 0)",
  "neumorphism":    "easeOutSine",
  "material":       "cubicBezier(0.4, 0, 0.2, 1)",
  "ant":            "easeOutCubic",
  "carbon":         "cubicBezier(0.2, 0, 0.38, 0.9)",
  "fluent":         "easeOutCubic",
  "atlassian":      "easeOutCubic",
  "apple-hig":      "spring(1, 100, 18, 0)",
  "polaris":        "easeOutQuad",
  "minimal":        "easeOutExpo",
  "swiss":          "linear",
  "swiss-archival": "linear",
  "skeuomorphism":  "easeOutBounce",
  "m3-pastel":      "spring(1, 80, 12, 0)",
  "neo-m3":         "spring(1, 70, 10, 0)",
};

const STYLE_DURATION: Record<string, number> = {
  "glass":          700,
  "neo-brutalism":  400,
  "claymorphism":   600,
  "neumorphism":    500,
  "material":       300,
  "ant":            250,
  "carbon":         240,
  "fluent":         300,
  "atlassian":      250,
  "apple-hig":      550,
  "polaris":        250,
  "minimal":        500,
  "swiss":          200,
  "swiss-archival": 200,
  "skeuomorphism":  600,
  "m3-pastel":      450,
  "neo-m3":         400,
};

function easing(style: string): string {
  return STYLE_EASING[style] ?? "easeOutCubic";
}

function duration(style: string): number {
  return STYLE_DURATION[style] ?? 350;
}

// ─── Snippet generators ───────────────────────────────────────────────────────

function entranceSnippet(style: string): string {
  const ease = easing(style);
  const dur  = duration(style);
  const delay = style === "neo-brutalism" ? 0 : 60;

  return `<!-- anime.js v3 — Entrance Animation (${style}) -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  // Respect prefers-reduced-motion
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  // Stagger hero elements on load
  anime({
    targets: "[data-anime-hero] > *",
    opacity: [0, 1],
    translateY: [${style === "neo-brutalism" ? "6, 0" : "24, 0"}],
    duration: ${dur},
    delay: anime.stagger(${delay}, { start: 80 }),
    easing: "${ease}",
  });

  // Fade-in cards
  anime({
    targets: "[data-anime-card]",
    opacity: [0, 1],
    translateY: [16, 0],
    scale: ${style === "claymorphism" || style === "m3-pastel" ? "[0.96, 1]" : "[1, 1]"},
    duration: ${dur},
    delay: anime.stagger(${delay}),
    easing: "${ease}",
  });
});
</script>`;
}

function microSnippet(style: string): string {
  const ease = easing(style);
  const dur  = Math.round(duration(style) * 0.5);

  const scale = style === "claymorphism" || style === "m3-pastel" ? "1.06" : "1.03";
  const push   = style === "neo-brutalism" ? "translateY(2px) translateX(2px)" : "scale(0.97)";

  return `<!-- anime.js v3 — Micro-Interactions (${style}) -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-anime-btn]").forEach((btn) => {
    btn.addEventListener("pointerenter", () => {
      if (reduced) return;
      anime({ targets: btn, scale: ${scale}, duration: ${dur}, easing: "${ease}" });
    });
    btn.addEventListener("pointerleave", () => {
      anime({ targets: btn, scale: 1, duration: ${dur}, easing: "${ease}" });
    });
    btn.addEventListener("pointerdown", () => {
      if (reduced) return;
      anime({ targets: btn, transform: "${push}", duration: ${Math.round(dur * 0.6)}, easing: "${ease}" });
    });
    btn.addEventListener("pointerup", () => {
      anime({ targets: btn, transform: "scale(1)", duration: ${dur}, easing: "${ease}" });
    });
  });

  // Card hover lift
  document.querySelectorAll("[data-anime-card]").forEach((card) => {
    card.addEventListener("pointerenter", () => {
      if (reduced) return;
      anime({ targets: card, translateY: -4, duration: ${dur}, easing: "${ease}" });
    });
    card.addEventListener("pointerleave", () => {
      anime({ targets: card, translateY: 0, duration: ${dur}, easing: "${ease}" });
    });
  });
});
</script>`;
}

function staggerSnippet(style: string): string {
  const ease = easing(style);
  const dur  = duration(style);

  return `<!-- anime.js v3 — Stagger List/Grid Reveal (${style}) -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  anime({
    targets: "[data-anime-list] > *",
    opacity: [0, 1],
    translateX: ${style === "neo-brutalism" ? "[-8, 0]" : "[-16, 0]"},
    duration: ${dur},
    delay: anime.stagger(${Math.round(duration(style) * 0.15)}, { start: 100 }),
    easing: "${ease}",
  });

  // Grid items from below with scale
  anime({
    targets: "[data-anime-grid] > *",
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.95, 1],
    duration: ${Math.round(dur * 1.1)},
    delay: anime.stagger(80, { grid: [3, 3], from: "center" }),
    easing: "${ease}",
  });
});
</script>`;
}

function scrollSnippet(style: string): string {
  const ease = easing(style);
  const dur  = duration(style);

  return `<!-- anime.js v3 — Scroll-Triggered Reveal (${style}) -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const revealSections = document.querySelectorAll("[data-anime-reveal]");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [32, 0],
          duration: ${dur},
          easing: "${ease}",
        });

        // Stagger children if present
        const children = entry.target.querySelectorAll("[data-anime-reveal-child]");
        if (children.length) {
          anime({
            targets: children,
            opacity: [0, 1],
            translateY: [16, 0],
            duration: ${dur},
            delay: anime.stagger(60, { start: 120 }),
            easing: "${ease}",
          });
        }
      });
    },
    { threshold: 0.15 }
  );

  revealSections.forEach((el) => {
    el.style.opacity = "0";
    observer.observe(el);
  });
});
</script>`;
}

function loaderSnippet(style: string): string {
  const ease = easing(style);

  return `<!-- anime.js v3 — Spinner / Loader (${style}) -->
<style>
  .anime-spinner { width: 36px; height: 36px; position: relative; }
  .anime-spinner-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--color-primary, #6366f1);
    position: absolute; top: 50%; left: 50%;
    transform-origin: -8px 0;
  }
</style>
<div class="anime-spinner" id="animeSpinner" role="status" aria-label="Loading">
  ${[0,1,2,3,4,5,6,7].map(i => `<div class="anime-spinner-dot" style="transform: rotate(${i * 45}deg) translateX(-14px)"></div>`).join("\n  ")}
</div>
<script>
(function() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  anime({
    targets: "#animeSpinner .anime-spinner-dot",
    opacity: [1, 0.15, 1],
    scale: [1, 0.6, 1],
    duration: 1200,
    loop: true,
    delay: anime.stagger(150),
    easing: "${ease}",
  });
})();
</script>`;
}

function transitionSnippet(style: string): string {
  const ease = easing(style);
  const dur  = duration(style);

  return `<!-- anime.js v3 — Page / Route Transition (${style}) -->
<style>
  #page-transition-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: var(--color-primary, #6366f1);
    transform: translateY(100%);
    pointer-events: none;
  }
</style>
<div id="page-transition-overlay" aria-hidden="true"></div>
<script>
(function() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlay = document.getElementById("page-transition-overlay");

  function pageIn() {
    if (reduced) return;
    anime({
      targets: overlay,
      translateY: ["100%", "-100%"],
      duration: ${Math.round(dur * 1.4)},
      easing: "${ease}",
    });
  }

  function pageOut(href) {
    if (reduced) { location.href = href; return; }
    anime({
      targets: overlay,
      translateY: ["100%", "0%"],
      duration: ${dur},
      easing: "${ease}",
      complete: () => { location.href = href; },
    });
  }

  document.addEventListener("DOMContentLoaded", pageIn);

  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      pageOut(href);
    });
  });
})();
</script>`;
}

function counterSnippet(_style: string): string {
  return `<!-- anime.js v3 — Animated Number Counter -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  document.querySelectorAll("[data-anime-counter]").forEach((el) => {
    const target = parseFloat(el.getAttribute("data-anime-counter") || "0");
    const prefix = el.getAttribute("data-anime-prefix") || "";
    const suffix = el.getAttribute("data-anime-suffix") || "";
    const decimals = (el.getAttribute("data-anime-decimals") || "0") === "0" ? 0 : 2;

    const obj = { value: 0 };
    anime({
      targets: obj,
      value: target,
      duration: 1800,
      easing: "easeOutExpo",
      round: decimals === 0 ? 1 : undefined,
      update() {
        el.textContent = prefix + (decimals === 0
          ? Math.round(obj.value).toLocaleString()
          : obj.value.toFixed(2)) + suffix;
      },
    });
  });
});
</script>
<!-- Usage: <span data-anime-counter="48352" data-anime-prefix="$"></span> -->`;
}

function typewriterSnippet(_style: string): string {
  return `<!-- anime.js v3 — Typewriter Text Effect -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-anime-type]").forEach((el) => {
    const text = el.textContent || "";
    el.textContent = "";
    el.style.borderRight = "2px solid currentColor";

    if (reduced) { el.textContent = text; el.style.borderRight = "none"; return; }

    const chars = text.split("").map((c) => {
      const span = document.createElement("span");
      span.textContent = c;
      span.style.opacity = "0";
      el.appendChild(span);
      return span;
    });

    anime({
      targets: chars,
      opacity: [0, 1],
      duration: 30,
      delay: anime.stagger(50, { start: 200 }),
      easing: "linear",
      complete: () => { el.style.borderRight = "none"; },
    });
  });
});
</script>
<!-- Usage: <h1 data-anime-type>Hello, World</h1> -->`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface MotionSnippetResult {
  category: MotionCategory;
  style: string;
  easing: string;
  duration: number;
  cdn: string;
  snippet: string;
  usage_hint: string;
  reduced_motion_note: string;
}

const USAGE_HINTS: Record<MotionCategory, string> = {
  entrance:   "Add data-anime-hero to your hero section, data-anime-card to cards. Drop this script before </body>.",
  micro:      "Add data-anime-btn to interactive buttons, data-anime-card to hoverable cards.",
  stagger:    "Wrap list items in <ul data-anime-list>, grid items in <div data-anime-grid>.",
  scroll:     "Add data-anime-reveal to any section. Optional: data-anime-reveal-child on inner elements.",
  loader:     "Paste the spinner HTML/CSS/script where the loading indicator should appear.",
  transition: "Paste once in your base layout. Works automatically for all internal <a> links.",
  counter:    "Add data-anime-counter='48352' (target value) to any <span>. Optional: data-anime-prefix, data-anime-suffix, data-anime-decimals.",
  typewriter: "Add data-anime-type to any heading or paragraph element.",
};

/**
 * Generate a ready-to-paste anime.js v3 snippet for a given category + style.
 */
export function generateMotionSnippet(
  category: MotionCategory,
  style: string
): MotionSnippetResult {
  const snippetMap: Record<MotionCategory, (style: string) => string> = {
    entrance:   entranceSnippet,
    micro:      microSnippet,
    stagger:    staggerSnippet,
    scroll:     scrollSnippet,
    loader:     loaderSnippet,
    transition: transitionSnippet,
    counter:    counterSnippet,
    typewriter: typewriterSnippet,
  };

  const snippet = snippetMap[category](style);

  return {
    category,
    style,
    easing: easing(style),
    duration: duration(style),
    cdn: ANIME_CDN,
    snippet,
    usage_hint: USAGE_HINTS[category],
    reduced_motion_note:
      "All snippets include a prefers-reduced-motion guard. " +
      "When reduced motion is preferred, animations are skipped entirely.",
  };
}

// ─── Template helpers ─────────────────────────────────────────────────────────

/**
 * Returns the anime.js CDN <script> tag + a compact entrance + micro script
 * to embed directly in generated templates.
 */
export function buildAnimeShell(style: string): string {
  const ease = easing(style);
  const dur  = duration(style);

  return `${ANIME_CDN}
<script>
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  document.addEventListener("DOMContentLoaded", function () {
    /* Hero entrance */
    anime({
      targets: "[data-anime-hero] > *",
      opacity: [0, 1],
      translateY: [${style === "neo-brutalism" ? "4, 0" : "20, 0"}],
      duration: ${dur},
      delay: anime.stagger(60, { start: 60 }),
      easing: "${ease}",
    });
    /* Card stagger */
    anime({
      targets: "[data-anime-card]",
      opacity: [0, 1],
      translateY: [12, 0],
      duration: ${dur},
      delay: anime.stagger(50),
      easing: "${ease}",
    });
    /* Sidebar nav links */
    anime({
      targets: "aside nav a, nav a",
      opacity: [0, 1],
      translateX: [-10, 0],
      duration: ${Math.round(dur * 0.85)},
      delay: anime.stagger(35, { start: 40 }),
      easing: "${ease}",
    });
    /* Button micro-interactions */
    document.querySelectorAll("button, [role='button']").forEach(function (btn) {
      btn.addEventListener("pointerdown", function () {
        anime({ targets: btn, scale: 0.96, duration: ${Math.round(dur * 0.35)}, easing: "${ease}" });
      });
      btn.addEventListener("pointerup", function () {
        anime({ targets: btn, scale: 1, duration: ${Math.round(dur * 0.5)}, easing: "${ease}" });
      });
      btn.addEventListener("pointerleave", function () {
        anime({ targets: btn, scale: 1, duration: ${Math.round(dur * 0.5)}, easing: "${ease}" });
      });
    });
    /* Table row reveal */
    anime({
      targets: "tbody tr",
      opacity: [0, 1],
      translateX: [-6, 0],
      duration: ${Math.round(dur * 0.9)},
      delay: anime.stagger(25, { start: 200 }),
      easing: "${ease}",
    });
  });
})();
</script>`;
}
