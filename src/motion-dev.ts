/**
 * motion-dev.ts
 * motion.dev integration for the-designer MCP.
 * Provides style-aware animation presets, CDN helpers, and the
 * generate_motion_snippet tool implementation for motion.dev.
 */

import type { MotionCategory, MotionSnippetResult } from "./anime-motion.js";

export type MotionFramework = "html" | "react" | "vue";

// ─── Easing & Physics map per design style ───────────────────────────────────

// For Motion.dev, we provide explicit objects for transition
const STYLE_TRANSITION: Record<string, string> = {
  glass: `{ ease: [0.16, 1, 0.3, 1], duration: 0.7 }`, // easeOutQuart
  "neo-brutalism": `{ ease: [0.87, 0, 0.13, 1], duration: 0.4 }`, // easeInOutExpo
  claymorphism: `{ type: "spring", bounce: 0.4, duration: 0.6 }`,
  neumorphism: `{ ease: [0.39, 0.575, 0.565, 1], duration: 0.5 }`, // easeOutSine
  material: `{ ease: [0.4, 0, 0.2, 1], duration: 0.3 }`,
  ant: `{ ease: [0.215, 0.61, 0.355, 1], duration: 0.25 }`, // easeOutCubic
  carbon: `{ ease: [0.2, 0, 0.38, 0.9], duration: 0.24 }`,
  fluent: `{ ease: [0.215, 0.61, 0.355, 1], duration: 0.3 }`,
  atlassian: `{ ease: [0.215, 0.61, 0.355, 1], duration: 0.25 }`,
  "apple-hig": `{ type: "spring", bounce: 0.2, duration: 0.55 }`,
  polaris: `{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.25 }`, // easeOutQuad
  minimal: `{ ease: [0.19, 1, 0.22, 1], duration: 0.5 }`, // easeOutExpo
  swiss: `{ ease: "linear", duration: 0.2 }`,
  "swiss-archival": `{ ease: "linear", duration: 0.2 }`,
  skeuomorphism: `{ type: "spring", bounce: 0.5, duration: 0.6 }`,
  "m3-pastel": `{ type: "spring", bounce: 0.3, duration: 0.45 }`,
  "neo-m3": `{ type: "spring", bounce: 0.25, duration: 0.4 }`,
  awwwards: `{ ease: [0.16, 1, 0.3, 1], duration: 0.85 }`,
};

function getTransition(style: string): string {
  return (
    STYLE_TRANSITION[style] ??
    `{ ease: [0.215, 0.61, 0.355, 1], duration: 0.35 }`
  );
}

// ─── Snippet generators ───────────────────────────────────────────────────────

function entranceSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);
  const yOffset = style === "neo-brutalism" ? 6 : 24;

  if (framework === "react") {
    return `// Motion.dev React — Entrance Animation (${style})
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: ${yOffset} },
  show: { opacity: 1, y: 0, transition: ${trans} }
};

export function EntranceHero({ children }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Map over children and wrap each in <motion.div variants={item}> */}
      {children}
    </motion.div>
  );
}`;
  }

  // Vanilla HTML / Vue (using motion CDN)
  return `<!-- Motion.dev Vanilla — Entrance Animation (${style}) -->
<script type="module">
  import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  // Hero stagger
  animate("[data-motion-hero] > *",
    { opacity: [0, 1], y: [${yOffset}, 0] },
    { delay: stagger(0.1), ...${trans} }
  );

  // Card fade-in
  animate("[data-motion-card]",
    { opacity: [0, 1], y: [16, 0] },
    { delay: stagger(0.05, { startDelay: 0.1 }), ...${trans} }
  );
</script>`;
}

function microSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);
  const scaleHover =
    style === "claymorphism" || style === "m3-pastel" ? 1.06 : 1.03;
  const pushTap = style === "neo-brutalism" ? "y: 2, x: 2" : "scale: 0.97";

  if (framework === "react") {
    return `// Motion.dev React — Micro-Interactions (${style})
import { motion } from "motion/react";

export function MotionButton({ children, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: ${scaleHover} }}
      whileTap={{ ${pushTap} }}
      transition={${trans}}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function MotionCard({ children }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={${trans}}
    >
      {children}
    </motion.div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Micro-Interactions (${style}) -->
<script type="module">
  import { hover, press, animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  document.querySelectorAll("[data-motion-btn]").forEach(btn => {
    hover(btn, () => {
      const animation = animate(btn, { scale: ${scaleHover} }, ${trans});
      return () => animate(btn, { scale: 1 }, ${trans});
    });
    press(btn, () => {
      const animation = animate(btn, { ${pushTap} }, ${trans});
      return () => animate(btn, { scale: ${scaleHover}, x: 0, y: 0 }, ${trans});
    });
  });

  document.querySelectorAll("[data-motion-card]").forEach(card => {
    hover(card, () => {
      animate(card, { y: -4 }, ${trans});
      return () => animate(card, { y: 0 }, ${trans});
    });
  });
</script>`;
}

function staggerSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);
  const xOffset = style === "neo-brutalism" ? -8 : -16;

  if (framework === "react") {
    return `// Motion.dev React — Stagger List/Grid Reveal (${style})
import { motion } from "motion/react";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: ${xOffset} },
  show: { opacity: 1, x: 0, transition: ${trans} }
};

export function StaggerList({ items }) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="show">
      {items.map(item => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.content}
        </motion.li>
      ))}
    </motion.ul>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Stagger List/Grid Reveal (${style}) -->
<script type="module">
  import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  animate("[data-motion-list] > *",
    { opacity: [0, 1], x: [${xOffset}, 0] },
    { delay: stagger(0.08), ...${trans} }
  );
</script>`;
}

function scrollSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);

  if (framework === "react") {
    return `// Motion.dev React — Scroll-Triggered Reveal (${style})
import { motion } from "motion/react";

export function ScrollReveal({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={${trans}}
    >
      {children}
    </motion.div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Scroll-Triggered Reveal (${style}) -->
<script type="module">
  import { inView, animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  inView("[data-motion-reveal]", (info) => {
    animate(info.target, { opacity: [0, 1], y: [32, 0] }, ${trans});
  }, { margin: "-100px" });
</script>`;
}

function loaderSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);

  if (framework === "react") {
    return `// Motion.dev React — Spinner / Loader (${style})
import { motion } from "motion/react";

export function Loader() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary, #6366f1)" }}
          animate={{ scale: [1, 0.5, 1], opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Spinner / Loader (${style}) -->
<style>
  .motion-spinner { display: flex; gap: 4px; }
  .motion-spinner-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary, #6366f1); }
</style>
<div class="motion-spinner" data-motion-spinner>
  <div class="motion-spinner-dot"></div>
  <div class="motion-spinner-dot"></div>
  <div class="motion-spinner-dot"></div>
</div>
<script type="module">
  import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  animate("[data-motion-spinner] .motion-spinner-dot",
    { scale: [1, 0.5, 1], opacity: [1, 0.3, 1] },
    { repeat: Infinity, duration: 1, delay: stagger(0.15) }
  );
</script>`;
}

function transitionSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);

  if (framework === "react") {
    return `// Motion.dev React — Page / Route Transition (${style})
import { motion, AnimatePresence } from "motion/react";
// Assumes usage within a router (like Next.js or React Router)
// Wrap your pages in this component:

export function PageTransition({ children, keyPath }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyPath}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={${trans}}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Page / Route Transition (${style}) -->
<style>
  body { opacity: 0; } /* Prevent flash */
</style>
<script type="module">
  import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  // Page In
  animate(document.body, { opacity: [0, 1], y: [16, 0] }, ${trans});

  // Page Out interceptor
  document.querySelectorAll("a[href]").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      e.preventDefault();
      animate(document.body, { opacity: 0, y: -16 }, ${trans}).then(() => {
        window.location.href = href;
      });
    });
  });
</script>`;
}

function counterSnippet(_style: string, framework: MotionFramework): string {
  if (framework === "react") {
    return `// Motion.dev React — Animated Number Counter
import { animate } from "motion";
import { useEffect, useRef } from "react";

export function Counter({ target, prefix = "", suffix = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (value) => {
        if (ref.current) ref.current.textContent = prefix + Math.round(value).toLocaleString() + suffix;
      }
    });
    return () => controls.stop();
  }, [target, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}`;
  }

  return `<!-- Motion.dev Vanilla — Animated Number Counter -->
<script type="module">
  import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  document.querySelectorAll("[data-motion-counter]").forEach(el => {
    const target = parseFloat(el.getAttribute("data-motion-counter") || "0");
    const prefix = el.getAttribute("data-motion-prefix") || "";
    const suffix = el.getAttribute("data-motion-suffix") || "";

    animate(0, target, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (val) => { el.textContent = prefix + Math.round(val).toLocaleString() + suffix; }
    });
  });
</script>
<!-- Usage: <span data-motion-counter="48352" data-motion-prefix="$"></span> -->`;
}

function typewriterSnippet(_style: string, framework: MotionFramework): string {
  if (framework === "react") {
    return `// Motion.dev React — Typewriter Text Effect
import { motion } from "motion/react";

export function Typewriter({ text }) {
  const chars = text.split("");
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ show: { transition: { staggerChildren: 0.03 } } }}
    >
      {chars.map((c, i) => (
        <motion.span
          key={i}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        >
          {c}
        </motion.span>
      ))}
    </motion.div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Typewriter Text Effect -->
<script type="module">
  import { animate, stagger, inView } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  document.querySelectorAll("[data-motion-type]").forEach(el => {
    const text = el.textContent || "";
    el.textContent = "";
    const chars = text.split("").map(c => {
      const span = document.createElement("span");
      span.textContent = c;
      span.style.opacity = "0";
      el.appendChild(span);
      return span;
    });

    inView(el, () => {
      animate(chars, { opacity: [0, 1] }, { delay: stagger(0.03), duration: 0.05 });
    }, { once: true });
  });
</script>
<!-- Usage: <h1 data-motion-type>Hello, World</h1> -->`;
}


function magneticSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);
  if (framework === "react") {
    return `// Motion.dev React — Magnetic Hover Component (${style})
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef } from "react";

export function Magnetic({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((clientX - (left + width / 2)) * 0.35);
    y.set((clientY - (top + height / 2)) * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Magnetic Hover Element (${style}) -->
<script type="module">
  import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  document.querySelectorAll("[data-motion-magnetic]").forEach(el => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
      animate(el, { x, y }, ${trans});
    });

    el.addEventListener("mouseleave", () => {
      animate(el, { x: 0, y: 0 }, { type: "spring", stiffness: 200, damping: 12 });
    });
  });
</script>
<!-- Usage: <button data-motion-magnetic>Magnetic Action</button> -->`;
}

function textSplitSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);
  if (framework === "react") {
    return `// Motion.dev React — Kinetic Split-Text Stagger (${style})
import { motion } from "motion/react";

export function SplitTextReveal({ text }) {
  const words = text.split(" ");
  return (
    <motion.h1
      className="overflow-hidden flex flex-wrap gap-x-2"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%", opacity: 0 },
              show: { y: "0%", opacity: 1, transition: ${trans} }
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Kinetic Split-Text Stagger (${style}) -->
<style>
  [data-motion-split] .word-wrap { display: inline-block; overflow: hidden; vertical-align: top; }
  [data-motion-split] .char { display: inline-block; }
</style>
<script type="module">
  import { animate, stagger, inView } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  document.querySelectorAll("[data-motion-split]").forEach(el => {
    const text = el.textContent || "";
    el.innerHTML = text.split(" ").map(w =>
      \`<span class="word-wrap">\${w.split("").map(c => \`<span class="char">\${c}</span>\`).join("")}&nbsp;</span>\`
    ).join("");

    inView(el, () => {
      animate(el.querySelectorAll(".char"), { y: ["100%", "0%"], opacity: [0, 1] }, {
        delay: stagger(0.02, { start: 0.1 }),
        ...${trans}
      });
    }, { once: true });
  });
</script>
<!-- Usage: <h1 data-motion-split>Hyper-Crafted Web</h1> -->`;
}

function smoothScrollSnippet(_style: string, framework: MotionFramework): string {
  if (framework === "react") {
    return `// React Lenis Smooth Momentum Scroll
import { ReactLenis } from "lenis/react";

export function SmoothLayout({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}`;
  }

  return `<!-- Vanilla Lenis Smooth Momentum Scroll -->
<script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
<script>
  const lenis = new Lenis({ lerp: 0.08, duration: 1.2, smoothWheel: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
</script>`;
}

function marqueeSnippet(_style: string, framework: MotionFramework): string {
  if (framework === "react") {
    return `// Motion.dev React — Continuous Marquee Ticker
import { motion } from "motion/react";

export function Marquee({ text }) {
  return (
    <div className="flex overflow-hidden whitespace-nowrap select-none">
      <motion.div
        className="flex shrink-0 min-w-full"
        animate={{ x: ["0%", "-100%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
      >
        <span className="text-4xl font-bold uppercase mr-8">{text}</span>
      </motion.div>
      <motion.div
        className="flex shrink-0 min-w-full"
        animate={{ x: ["0%", "-100%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
      >
        <span className="text-4xl font-bold uppercase mr-8">{text}</span>
      </motion.div>
    </div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Continuous Marquee Ticker -->
<style>
  .motion-marquee { display: flex; overflow: hidden; user-select: none; white-space: nowrap; }
  .motion-marquee-track { display: flex; shrink: 0; min-width: 100%; }
</style>
<div class="motion-marquee" data-motion-marquee>
  <div class="motion-marquee-track"><span>MARQUEE &middot; SOTA CRAFT &middot;&nbsp;</span></div>
  <div class="motion-marquee-track" aria-hidden="true"><span>MARQUEE &middot; SOTA CRAFT &middot;&nbsp;</span></div>
</div>
<script type="module">
  import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  animate("[data-motion-marquee] .motion-marquee-track", { x: ["0%", "-100%"] }, {
    repeat: Infinity,
    ease: "linear",
    duration: 15
  });
</script>`;
}

function noiseGrainSnippet(_style: string, _framework: MotionFramework): string {
  return `<!-- SVG Noise / Film Grain Shader Overlay -->
<svg style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; opacity: 0.04; mix-blend-mode: overlay;">
  <filter id="noiseFilter">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)" />
</svg>`;
}

function clipPathMaskSnippet(style: string, framework: MotionFramework): string {
  const trans = getTransition(style);
  if (framework === "react") {
    return `// Motion.dev React — Cinematic Clip-Path Wipe (${style})
import { motion } from "motion/react";

export function ClipPathReveal({ children }) {
  return (
    <motion.div
      initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }}
      whileInView={{ clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)" }}
      viewport={{ once: true }}
      transition={${trans}}
    >
      {children}
    </motion.div>
  );
}`;
  }

  return `<!-- Motion.dev Vanilla — Cinematic Clip-Path Wipe (${style}) -->
<script type="module">
  import { animate, inView } from "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm";

  document.querySelectorAll("[data-motion-clip]").forEach(el => {
    inView(el, () => {
      animate(el, {
        clipPath: [
          "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
          "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)"
        ]
      }, ${trans});
    }, { once: true });
  });
</script>
<!-- Usage: <div data-motion-clip><img src="..." alt="" /></div> -->`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const USAGE_HINTS: Record<MotionCategory, string> = {
  entrance:
    "For React: Wrap your page content in the EntranceHero component. For Vanilla: Add data-motion-hero to your hero and drop the script.",
  micro:
    "For React: Replace generic buttons with <MotionButton>. For Vanilla: Add data-motion-btn to buttons.",
  stagger:
    "For React: Use the <StaggerList> component. For Vanilla: Wrap list items in [data-motion-list].",
  scroll:
    "For React: Wrap content to reveal in <ScrollReveal>. For Vanilla: Add data-motion-reveal to elements.",
  loader: "Render the <Loader> component or paste the HTML/CSS/JS snippet.",
  transition:
    "For React: Use <AnimatePresence mode='wait'> in your router layout. For Vanilla: Add the script to intercept links.",
  counter:
    "For React: <Counter target={48352} />. For Vanilla: <span data-motion-counter='48352'></span>.",
  typewriter:
    "For React: <Typewriter text='Hello' />. For Vanilla: <h1 data-motion-type>Hello</h1>.",
  magnetic:
    "For React: Wrap targets with <Magnetic>. For Vanilla: Add data-motion-magnetic to elements.",
  "text-split":
    "For React: <SplitTextReveal text='Headline' />. For Vanilla: Add data-motion-split.",
  "smooth-scroll":
    "For React: Wrap root with <SmoothLayout>. For Vanilla: Drop the script in HTML.",
  marquee:
    "For React: <Marquee text='Running ticker' />. For Vanilla: Add .motion-marquee[data-motion-marquee].",
  "noise-grain":
    "Drop the fixed SVG filter overlay into your HTML root.",
  "clip-path-mask":
    "For React: Wrap with <ClipPathReveal>. For Vanilla: Add data-motion-clip to element.",
};

export function generateMotionDevSnippet(
  category: MotionCategory,
  style: string,
  framework: MotionFramework,
): MotionSnippetResult {
  const snippetMap: Record<
    MotionCategory,
    (s: string, f: MotionFramework) => string
  > = {
    entrance: entranceSnippet,
    micro: microSnippet,
    stagger: staggerSnippet,
    scroll: scrollSnippet,
    loader: loaderSnippet,
    transition: transitionSnippet,
    counter: counterSnippet,
    typewriter: typewriterSnippet,
    magnetic: magneticSnippet,
    "text-split": textSplitSnippet,
    "smooth-scroll": smoothScrollSnippet,
    marquee: marqueeSnippet,
    "noise-grain": noiseGrainSnippet,
    "clip-path-mask": clipPathMaskSnippet,
  };

  const snippet = snippetMap[category](style, framework);

  return {
    category,
    style,
    easing: getTransition(style),
    duration: 0, // Motion.dev physics define duration inherently
    cdn: "https://cdn.jsdelivr.net/npm/motion@11.11.11/+esm",
    snippet,
    usage_hint: USAGE_HINTS[category],
    reduced_motion_note:
      "Motion.dev automatically respects prefers-reduced-motion for layout animations, but explicit `animate()` calls should consider manual checks if necessary. React components <motion.div> handles it under the hood.",
  };
}
