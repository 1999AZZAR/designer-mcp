export interface ComponentState {
  name: string;
  attr: string;
  label: string;
  description: string;
}

export const ALL_8_STATES: ComponentState[] = [
  { name: "default", attr: "", label: "Default", description: "Normal resting state" },
  { name: "hover", attr: 'class="is-hover"', label: "Hover", description: "Mouse hover" },
  { name: "focus", attr: 'class="is-focus"', label: "Focus", description: "Keyboard focus (:focus-visible)" },
  { name: "active", attr: 'class="is-active"', label: "Active", description: "Pressed state (:active)" },
  { name: "disabled", attr: "disabled", label: "Disabled", description: "Disabled state" },
  { name: "loading", attr: 'data-state="loading"', label: "Loading", description: "Processing / loading" },
  { name: "error", attr: 'data-state="error"', label: "Error", description: "Error state" },
  { name: "success", attr: 'data-state="success"', label: "Success", description: "Success state" },
];

export type ComponentKind = "button" | "input" | "toggle" | "chip" | "select";

interface Component8StateTemplate {
  html: string;
  statesCSS: string;
}

const BUTTON_HTML = `<button class="btn" {attr}>{label}</button>`;
const INPUT_HTML = `<div class="input-group"><label class="input-label">Label</label><input type="text" class="input" placeholder="Placeholder" {attr} /></div>`;
const TOGGLE_HTML = `<label class="toggle"><input type="checkbox" class="toggle-input" {attr} /><span class="toggle-track"><span class="toggle-thumb"></span></span><span class="toggle-label">{label}</span></label>`;
const CHIP_HTML = `<span class="chip" {attr}>{label}</span>`;
const SELECT_HTML = `<div class="select-group"><label class="select-label">Label</label><select class="select" {attr}><option>Option 1</option><option>Option 2</option></select></div>`;

function stateLabel(kind: ComponentKind, state: ComponentState): string {
  const labels: Record<string, string> = {
    button: "Submit",
    input: "user@example.com",
    toggle: "Enable notifications",
    chip: "Tag",
    select: "",
  };
  return state.name === "default" || state.name === "hover" || state.name === "focus" || state.name === "active"
    ? (labels[kind] ?? "Label")
    : state.name === "loading" ? `${kind === "toggle" ? "Saving..." : "Working\u2026"}` :
      state.name === "error" ? `Error${kind === "input" ? "" : " — Retry"}` :
      state.name === "success" ? "Saved" :
      labels[kind] ?? "Label";
}

function generate8StatesComponent(kind: ComponentKind): Component8StateTemplate {
  const baseHTML = {
    button: BUTTON_HTML,
    input: INPUT_HTML,
    toggle: TOGGLE_HTML,
    chip: CHIP_HTML,
    select: SELECT_HTML,
  }[kind];

  const stateRows = ALL_8_STATES.map((state) => {
    const label = stateLabel(kind, state);
    const attr = state.attr.replace("{label}", label);
    let html = baseHTML
      .replace("{attr}", attr)
      .replace("{label}", label);
    return `    <div class="demo-row">
      <span class="demo-label">${state.label}</span>
      <div class="demo-component">${html}</div>
    </div>`;
  });

  const html = `<div class="eight-state-demo">
  <h2 class="demo-title">${kind.charAt(0).toUpperCase() + kind.slice(1)} \u2014 8 states</h2>
${stateRows.join("\n")}
</div>`;

  const statesCSS = `
/* 8-state helpers — delete the .is-* classes before shipping */
.btn.is-hover { background: var(--color-paper-3); }
.btn.is-focus { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.btn.is-active { transform: translateY(1px); }

.input.is-hover { border-color: var(--color-accent-2); }
.input.is-focus { outline: 2px solid var(--color-focus); outline-offset: -2px; }
.input.is-active { border-color: var(--color-accent); }

.toggle-input.is-hover + .toggle-track { border-color: var(--color-accent-2); }
.toggle-input.is-focus + .toggle-track { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.chip.is-hover { background: var(--color-paper-3); }
.chip.is-focus { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.chip.is-active { transform: translateY(1px); }

.select.is-hover { border-color: var(--color-accent-2); }
.select.is-focus { outline: 2px solid var(--color-focus); outline-offset: -2px; }

/* State attribute styling */
.btn:disabled, .btn[disabled] { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
.btn[data-state="loading"] { cursor: wait; pointer-events: none; }
.btn[data-state="loading"]::after { content: " \u2026"; }
.btn[data-state="error"] { background: var(--color-accent); }
.btn[data-state="success"] { background: var(--color-accent-2); }
`;

  return { html, statesCSS };
}

export function generate8StateComponent(kind: ComponentKind): Component8StateTemplate {
  return generate8StatesComponent(kind);
}

export function generate8StateWrapperHtml(kind: ComponentKind): string {
  const { html, statesCSS } = generate8StatesComponent(kind);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${kind.charAt(0).toUpperCase() + kind.slice(1)} — 8-State Demo</title>
  <style>
    :root {
      --color-paper: oklch(97% 0.01 85);
      --color-paper-2: oklch(93% 0.02 85);
      --color-paper-3: oklch(88% 0.03 85);
      --color-text: oklch(25% 0.02 85);
      --color-text-2: oklch(45% 0.03 85);
      --color-accent: oklch(50% 0.25 250);
      --color-accent-2: oklch(45% 0.2 130);
      --color-border: oklch(80% 0.02 85);
      --color-focus: oklch(60% 0.3 260);
      --space-md: 16px;
      --space-sm: 8px;
      --radius-md: 8px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: var(--color-paper); color: var(--color-text); padding: 2rem; }
    .eight-state-demo { max-width: 600px; margin: 0 auto; }
    .demo-title { font-size: 1.25rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); }
    .demo-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border); }
    .demo-label { width: 100px; font-size: 0.875rem; color: var(--color-text-2); flex-shrink: 0; }
    .demo-component { flex: 1; }
    .btn { padding: 8px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-accent); color: white; font-size: 0.875rem; cursor: pointer; transition: background 150ms ease; }
    .input, .select { width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; background: white; color: var(--color-text); }
    .input-label, .select-label { display: block; font-size: 0.75rem; color: var(--color-text-2); margin-bottom: 4px; }
    .select { cursor: pointer; }
    .toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .toggle-input { width: 18px; height: 18px; }
    .toggle-label { font-size: 0.875rem; }
    .chip { display: inline-flex; padding: 4px 12px; border: 1px solid var(--color-border); border-radius: 999px; font-size: 0.75rem; cursor: pointer; }
    ${statesCSS}
  </style>
</head>
<body>
  ${html}
  <p style="margin-top:2rem;font-size:0.75rem;color:var(--color-text-2)">
    This is a development preview. Delete this file before shipping.
  </p>

  <!-- anime.js v3 micro-interactions -->
  <script src="https://cdn.jsdelivr.net/npm/animejs@4/lib/anime.iife.min.js"></script>
  <script>
  (function () {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    document.querySelectorAll(".btn:not([disabled])").forEach(function (btn) {
      btn.addEventListener("pointerdown", function () {
        anime({ targets: btn, scale: 0.93, duration: 120, easing: "easeOutQuad" });
      });
      btn.addEventListener("pointerup", function () {
        anime({ targets: btn, scale: 1, duration: 280, easing: "spring(1, 80, 10, 0)" });
      });
      btn.addEventListener("pointerleave", function () {
        anime({ targets: btn, scale: 1, duration: 200, easing: "easeOutQuad" });
      });
    });
    document.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("pointerenter", function () {
        anime({ targets: chip, scale: 1.07, duration: 200, easing: "spring(1, 80, 10, 0)" });
      });
      chip.addEventListener("pointerleave", function () {
        anime({ targets: chip, scale: 1, duration: 180, easing: "easeOutQuad" });
      });
    });
    // Stagger-reveal all demo rows on load
    anime({
      targets: ".demo-row",
      opacity: [0, 1],
      translateX: [-12, 0],
      duration: 380,
      delay: anime.stagger(45, { start: 60 }),
      easing: "easeOutCubic",
    });
  })();
  </script>
</body>
</html>`;
}
