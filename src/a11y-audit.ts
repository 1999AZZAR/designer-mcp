/**
 * a11y-audit.ts
 * Pure-TypeScript HTML accessibility auditor.
 * No external dependencies — uses only regex + string analysis.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = "critical" | "serious" | "moderate" | "minor";

export interface A11yIssue {
  id: string;
  severity: Severity;
  /** Short rule name e.g. 'img-alt' */
  rule: string;
  /** WCAG success criterion e.g. '1.1.1' */
  wcag: string;
  description: string;
  /** Snippet of the offending HTML (truncated to 120 chars) */
  element: string;
  /** Concrete fix instruction */
  fix: string;
}

export interface A11yAuditResult {
  /** 0–100: 100 = no issues */
  score: number;
  /** 'A' | 'B' | 'C' | 'D' | 'F' */
  grade: string;
  issue_count: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  issues: A11yIssue[];
  /** Names of checks that passed (found 0 issues) */
  passed_checks: string[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Truncate a string to max `len` chars, appending '…' if cut. */
function trunc(s: string, len = 120): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= len ? clean : clean.slice(0, len - 1) + "…";
}

/** Return all regex matches as an array of full-match strings. */
function allMatches(html: string, re: RegExp): string[] {
  const results: string[] = [];
  // Ensure global flag
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const globalRe = new RegExp(re.source, flags);
  let m: RegExpExecArray | null;
  while ((m = globalRe.exec(html)) !== null) {
    results.push(m[0]);
    // Avoid infinite loop on zero-length matches
    if (m[0].length === 0) globalRe.lastIndex++;
  }
  return results;
}

/** Return all regex match *groups* (index 1) as strings. */
function allGroups(html: string, re: RegExp, groupIdx = 1): string[] {
  const results: string[] = [];
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const globalRe = new RegExp(re.source, flags);
  let m: RegExpExecArray | null;
  while ((m = globalRe.exec(html)) !== null) {
    if (m[groupIdx] !== undefined) results.push(m[groupIdx]);
    if (m[0].length === 0) globalRe.lastIndex++;
  }
  return results;
}

/** Extract the value of an attribute from a tag string. Returns null if absent. */
function getAttr(tag: string, attr: string): string | null {
  // Matches: attr="value", attr='value', attr=value, or bare attr
  const re = new RegExp(
    `${attr}\\s*=\\s*(?:"([^"]*?)"|'([^']*?)'|([^\\s>]*))`,
    "i",
  );
  const m = re.exec(tag);
  if (m) return m[1] ?? m[2] ?? m[3] ?? "";
  // Bare attribute (no value)
  const bareRe = new RegExp(`(?:^|\\s)${attr}(?:\\s|>|$)`, "i");
  if (bareRe.test(tag)) return "";
  return null;
}

/** Check whether an attribute exists in a tag string. */
function hasAttr(tag: string, attr: string): boolean {
  return getAttr(tag, attr) !== null;
}

/** Get visible inner text from a simple element (strips nested tags). */
function innerText(element: string): string {
  return element.replace(/<[^>]+>/g, "").trim();
}

/** Collect all opening tags for a given element name. */
function getOpenTags(html: string, tagName: string): string[] {
  // Captures the full opening tag including attributes
  const re = new RegExp(`<${tagName}(\\s[^>]*)?>`, "gi");
  return allMatches(html, re);
}

/**
 * Collect all complete elements (open + content + close) for simple cases.
 * Handles single-level nesting only; sufficient for heading, button, a, etc.
 */
function getElements(html: string, tagName: string): string[] {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>.*?<\\/${tagName}>`, "gis");
  return allMatches(html, re);
}

// ---------------------------------------------------------------------------
// Individual check implementations
// ---------------------------------------------------------------------------

type CheckResult = Pick<
  A11yIssue,
  "id" | "severity" | "rule" | "wcag" | "description" | "element" | "fix"
>[];

// 1. img-alt — <img> without alt attribute
function checkImgAlt(html: string): CheckResult {
  return getOpenTags(html, "img")
    .filter((tag) => getAttr(tag, "alt") === null)
    .map((tag) => ({
      id: `img-alt`,
      severity: "critical" as Severity,
      rule: "img-alt",
      wcag: "1.1.1",
      description: "<img> element is missing an alt attribute.",
      element: trunc(tag),
      fix: 'Add alt="descriptive text" for meaningful images, or alt="" for decorative ones.',
    }));
}

// 2. img-alt-empty — <img alt=""> on non-decorative images
function checkImgAltEmpty(html: string): CheckResult {
  return getOpenTags(html, "img")
    .filter((tag) => {
      const alt = getAttr(tag, "alt");
      if (alt === null || alt.trim() !== "") return false;
      const src = getAttr(tag, "src") ?? "";
      // Skip obvious spacers/1x1 images
      const spacerRe =
        /spacer|1x1|blank|pixel|transparent|shim|dot\.gif|dot\.png/i;
      return !spacerRe.test(src);
    })
    .map((tag) => ({
      id: `img-alt-empty`,
      severity: "serious" as Severity,
      rule: "img-alt-empty",
      wcag: "1.1.1",
      description:
        "<img> has an empty alt attribute but does not appear decorative.",
      element: trunc(tag),
      fix: "Provide a descriptive alt text for meaningful images, or confirm the image is purely decorative.",
    }));
}

// 3. input-label — <input> without associated label
function checkInputLabel(html: string): CheckResult {
  // Collect all label for="" values
  const labelForValues = new Set(
    allGroups(html, /\blabel\b[^>]*?\bfor\s*=\s*["']?([^"'\s>]+)/gi).map((v) =>
      v.toLowerCase(),
    ),
  );

  return getOpenTags(html, "input")
    .filter((tag) => {
      const type = (getAttr(tag, "type") ?? "").toLowerCase();
      // Hidden inputs don't need labels
      if (type === "hidden") return false;
      // Submit/reset/button inputs use value as label
      if (["submit", "reset", "button", "image"].includes(type)) return false;
      const id = (getAttr(tag, "id") ?? "").toLowerCase();
      if (id && labelForValues.has(id)) return false;
      if (hasAttr(tag, "aria-label") || hasAttr(tag, "aria-labelledby"))
        return false;
      if (hasAttr(tag, "title")) return false;
      return true;
    })
    .map((tag) => ({
      id: `input-label`,
      severity: "critical" as Severity,
      rule: "input-label",
      wcag: "1.3.1",
      description: "<input> element has no associated label.",
      element: trunc(tag),
      fix: 'Associate a <label for="inputId"> or add aria-label / aria-labelledby to the input.',
    }));
}

// 4. button-name — <button> with no accessible name
function checkButtonName(html: string): CheckResult {
  return getElements(html, "button")
    .filter((el) => {
      if (hasAttr(el, "aria-label") || hasAttr(el, "aria-labelledby"))
        return false;
      if (hasAttr(el, "title")) return false;
      // Check for value attribute on button type
      if (hasAttr(el, "value") && (getAttr(el, "value") ?? "").trim())
        return false;
      return innerText(el).length === 0;
    })
    .map((el) => ({
      id: `button-name`,
      severity: "critical" as Severity,
      rule: "button-name",
      wcag: "4.1.2",
      description:
        "<button> has no accessible name (empty text and no aria-label).",
      element: trunc(el),
      fix: 'Add visible text content or aria-label="description" to the button.',
    }));
}

// 5. link-name — <a href> with empty text and no aria-label
function checkLinkName(html: string): CheckResult {
  return getElements(html, "a")
    .filter((el) => {
      if (!hasAttr(el, "href")) return false; // anchors without href are not interactive
      if (hasAttr(el, "aria-label") || hasAttr(el, "aria-labelledby"))
        return false;
      if (hasAttr(el, "title") && (getAttr(el, "title") ?? "").trim())
        return false;
      // Allow if contains an img with alt
      if (/<img[^>]+alt\s*=\s*["'][^"']+["']/i.test(el)) return false;
      return innerText(el).length === 0;
    })
    .map((el) => ({
      id: `link-name`,
      severity: "serious" as Severity,
      rule: "link-name",
      wcag: "4.1.2",
      description: "<a href> element has no accessible name.",
      element: trunc(el),
      fix: "Provide visible link text, or add aria-label describing the link destination.",
    }));
}

// 6. lang-missing — <html> without lang attribute
function checkLangMissing(html: string): CheckResult {
  const htmlTag = /<html(\s[^>]*)?>/.exec(html)?.[0];
  if (!htmlTag) return [];
  if (hasAttr(htmlTag, "lang") && (getAttr(htmlTag, "lang") ?? "").trim())
    return [];
  return [
    {
      id: `lang-missing`,
      severity: "serious",
      rule: "lang-missing",
      wcag: "3.1.1",
      description: "<html> element is missing a lang attribute.",
      element: trunc(htmlTag),
      fix: 'Add lang="en" (or the appropriate BCP 47 language tag) to the <html> element.',
    },
  ];
}

// 7. page-title — no <title> or empty title
function checkPageTitle(html: string): CheckResult {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch && titleMatch[1].trim().length > 0) return [];
  const element = titleMatch ? titleMatch[0] : "<title> (missing)";
  return [
    {
      id: `page-title`,
      severity: "serious",
      rule: "page-title",
      wcag: "2.4.2",
      description: titleMatch
        ? "Page <title> is empty."
        : "Page is missing a <title> element.",
      element: trunc(element),
      fix: "Add a descriptive <title> inside <head> that identifies the page purpose.",
    },
  ];
}

// 8. heading-order — heading levels skip (e.g. h1 → h3)
function checkHeadingOrder(html: string): CheckResult {
  const issues: CheckResult = [];
  const headings = allMatches(html, /<h([1-6])(?:\s[^>]*)?>[\s\S]*?<\/h\1>/gi);
  let prevLevel = 0;
  for (const h of headings) {
    const levelMatch = /^<h([1-6])/i.exec(h);
    if (!levelMatch) continue;
    const level = parseInt(levelMatch[1], 10);
    if (prevLevel > 0 && level > prevLevel + 1) {
      issues.push({
        id: `heading-order`,
        severity: "moderate",
        rule: "heading-order",
        wcag: "1.3.1",
        description: `Heading level skipped: h${prevLevel} followed by h${level}.`,
        element: trunc(h),
        fix: `Use sequential heading levels. Replace h${level} with h${prevLevel + 1} or restructure the content hierarchy.`,
      });
    }
    prevLevel = level;
  }
  return issues;
}

// 9. heading-h1-missing — no <h1> on page
function checkHeadingH1Missing(html: string): CheckResult {
  if (/<h1[\s>]/i.test(html)) return [];
  return [
    {
      id: `heading-h1-missing`,
      severity: "moderate",
      rule: "heading-h1-missing",
      wcag: "2.4.6",
      description: "Page has no <h1> heading.",
      element: "<h1> (missing)",
      fix: "Add a single <h1> that describes the main content of the page.",
    },
  ];
}

// 10. heading-h1-multiple — more than one <h1>
function checkHeadingH1Multiple(html: string): CheckResult {
  const h1s = getElements(html, "h1");
  if (h1s.length <= 1) return [];
  return h1s.slice(1).map((el) => ({
    id: `heading-h1-multiple`,
    severity: "minor" as Severity,
    rule: "heading-h1-multiple",
    wcag: "2.4.6",
    description: `Multiple <h1> elements found (${h1s.length} total). Only one is recommended per page.`,
    element: trunc(el),
    fix: "Use only one <h1> per page. Demote additional top-level headings to <h2>.",
  }));
}

// 11. focus-visible — outline:none or outline:0 in style blocks
function checkFocusVisible(html: string): CheckResult {
  const issues: CheckResult = [];
  // Extract all <style> blocks
  const styleBlocks = allGroups(html, /<style[^>]*>([\s\S]*?)<\/style>/gi);
  // Also check inline style attributes
  const inlineStyles = allGroups(html, /\bstyle\s*=\s*["']([^"']*)["']/gi);

  const allCss = [...styleBlocks, ...inlineStyles].join("\n");

  // Look for outline: none / outline: 0 not followed by a :focus-visible rule
  // Simple heuristic: flag if pattern found and :focus-visible doesn't appear nearby
  const hasFocusVisible = /:focus-visible/.test(allCss);

  const outlineRe = /outline\s*:\s*(none|0)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = outlineRe.exec(allCss)) !== null) {
    // Check a window around the match for :focus-visible compensation
    const windowStr = allCss.slice(Math.max(0, m.index - 200), m.index + 200);
    if (!hasFocusVisible && !/:focus-visible/.test(windowStr)) {
      issues.push({
        id: `focus-visible`,
        severity: "serious",
        rule: "focus-visible",
        wcag: "2.4.7",
        description: `CSS uses "${m[0]}" which may remove focus indicators without a :focus-visible replacement.`,
        element: trunc(m[0]),
        fix: "Remove outline:none, or replace it with a custom :focus-visible style that provides a clear focus ring.",
      });
      break; // Report once per audit
    }
  }
  return issues;
}

// 12. tabindex-positive — tabindex > 0
function checkTabindexPositive(html: string): CheckResult {
  const re = /\btabindex\s*=\s*["']?\s*(\d+)\s*["']?/gi;
  const issues: CheckResult = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const val = parseInt(m[1], 10);
    if (val > 0) {
      // Find surrounding tag for context
      const tagStart = html.lastIndexOf("<", m.index);
      const tagEnd = html.indexOf(">", m.index);
      const tag =
        tagStart !== -1 && tagEnd !== -1
          ? html.slice(tagStart, tagEnd + 1)
          : m[0];
      issues.push({
        id: `tabindex-positive`,
        severity: "moderate",
        rule: "tabindex-positive",
        wcag: "2.4.3",
        description: `tabindex="${val}" disrupts the natural tab order.`,
        element: trunc(tag),
        fix: 'Use tabindex="0" to include elements in natural order, or tabindex="-1" for programmatic focus only.',
      });
    }
  }
  return issues;
}

// 13. autofocus — autofocus attribute present
function checkAutofocus(html: string): CheckResult {
  const re = /<[a-z][^>]*\bautofocus\b[^>]*>/gi;
  return allMatches(html, re).map((tag) => ({
    id: `autofocus`,
    severity: "minor" as Severity,
    rule: "autofocus",
    wcag: "3.2.2",
    description:
      "Element uses autofocus, which can disorient keyboard and screen-reader users.",
    element: trunc(tag),
    fix: "Remove autofocus, or ensure it is only used on the primary action of the page with user awareness.",
  }));
}

// 14. select-label — <select> without label or aria-label
function checkSelectLabel(html: string): CheckResult {
  const labelForValues = new Set(
    allGroups(html, /\blabel\b[^>]*?\bfor\s*=\s*["']?([^"'\s>]+)/gi).map((v) =>
      v.toLowerCase(),
    ),
  );
  return getElements(html, "select")
    .filter((el) => {
      const openTag = /^<select[^>]*>/i.exec(el)?.[0] ?? el;
      const id = (getAttr(openTag, "id") ?? "").toLowerCase();
      if (id && labelForValues.has(id)) return false;
      if (hasAttr(openTag, "aria-label") || hasAttr(openTag, "aria-labelledby"))
        return false;
      if (hasAttr(openTag, "title") && (getAttr(openTag, "title") ?? "").trim())
        return false;
      return true;
    })
    .map((el) => ({
      id: `select-label`,
      severity: "critical" as Severity,
      rule: "select-label",
      wcag: "1.3.1",
      description: "<select> element has no associated label.",
      element: trunc(el),
      fix: 'Add a <label for="selectId"> or aria-label attribute to the <select> element.',
    }));
}

// 15. textarea-label — <textarea> without label or aria-label
function checkTextareaLabel(html: string): CheckResult {
  const labelForValues = new Set(
    allGroups(html, /\blabel\b[^>]*?\bfor\s*=\s*["']?([^"'\s>]+)/gi).map((v) =>
      v.toLowerCase(),
    ),
  );
  return getElements(html, "textarea")
    .filter((el) => {
      const openTag = /^<textarea[^>]*>/i.exec(el)?.[0] ?? el;
      const id = (getAttr(openTag, "id") ?? "").toLowerCase();
      if (id && labelForValues.has(id)) return false;
      if (hasAttr(openTag, "aria-label") || hasAttr(openTag, "aria-labelledby"))
        return false;
      if (hasAttr(openTag, "title") && (getAttr(openTag, "title") ?? "").trim())
        return false;
      return true;
    })
    .map((el) => ({
      id: `textarea-label`,
      severity: "critical" as Severity,
      rule: "textarea-label",
      wcag: "1.3.1",
      description: "<textarea> element has no associated label.",
      element: trunc(el),
      fix: 'Add a <label for="textareaId"> or aria-label attribute to the <textarea> element.',
    }));
}

// 16. table-caption — <table> without <caption> or aria-label
function checkTableCaption(html: string): CheckResult {
  return getElements(html, "table")
    .filter((el) => {
      const openTag = /^<table[^>]*>/i.exec(el)?.[0] ?? el;
      if (hasAttr(openTag, "aria-label") || hasAttr(openTag, "aria-labelledby"))
        return false;
      if (
        hasAttr(openTag, "summary") &&
        (getAttr(openTag, "summary") ?? "").trim()
      )
        return false;
      if (/<caption[\s>]/i.test(el)) return false;
      return true;
    })
    .map((el) => ({
      id: `table-caption`,
      severity: "minor" as Severity,
      rule: "table-caption",
      wcag: "1.3.1",
      description:
        "<table> has no <caption> or aria-label to describe its purpose.",
      element: trunc(el),
      fix: 'Add a <caption> as the first child of the table, or add aria-label="table description".',
    }));
}

// 17. table-th-scope — <th> without scope attribute
function checkTableThScope(html: string): CheckResult {
  return getOpenTags(html, "th")
    .filter((tag) => !hasAttr(tag, "scope") && !hasAttr(tag, "id"))
    .map((tag) => ({
      id: `table-th-scope`,
      severity: "moderate" as Severity,
      rule: "table-th-scope",
      wcag: "1.3.1",
      description: "<th> element is missing a scope attribute.",
      element: trunc(tag),
      fix: 'Add scope="col" or scope="row" to each <th> to define header associations.',
    }));
}

// 18. skip-link — no skip-navigation link near start of body
function checkSkipLink(html: string): CheckResult {
  // Look within first 2000 chars after <body> for a skip link
  const bodyStart = html.search(/<body[\s>]/i);
  const searchArea = html.slice(
    bodyStart !== -1 ? bodyStart : 0,
    (bodyStart !== -1 ? bodyStart : 0) + 2000,
  );
  if (/href\s*=\s*["']#[^"']+["'][^>]*>[^<]*skip/i.test(searchArea)) return [];
  if (/class\s*=\s*["'][^"']*skip[^"']*["']/i.test(searchArea)) return [];
  return [
    {
      id: `skip-link`,
      severity: "moderate",
      rule: "skip-link",
      wcag: "2.4.1",
      description: "No skip-navigation link found near the start of the page.",
      element: "<body> (start)",
      fix: 'Add a "Skip to main content" link as the first focusable element: <a href="#main-content" class="skip-link">Skip to main content</a>.',
    },
  ];
}

// 19. meta-viewport-scale — user-scalable=no or maximum-scale=1
function checkMetaViewportScale(html: string): CheckResult {
  const issues: CheckResult = [];
  const viewportTags = allMatches(
    html,
    /<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/gi,
  );
  // Also catch reversed attribute order
  const viewportTags2 = allMatches(
    html,
    /<meta[^>]*content\s*=\s*["'][^"']*(?:user-scalable|maximum-scale)[^"']*["'][^>]*>/gi,
  );
  const allViewport = [...new Set([...viewportTags, ...viewportTags2])];

  for (const tag of allViewport) {
    const content = getAttr(tag, "content") ?? "";
    if (/user-scalable\s*=\s*no/i.test(content)) {
      issues.push({
        id: `meta-viewport-scale`,
        severity: "serious",
        rule: "meta-viewport-scale",
        wcag: "1.4.4",
        description:
          "Viewport meta uses user-scalable=no, preventing users from zooming.",
        element: trunc(tag),
        fix: "Remove user-scalable=no from the viewport meta tag to allow users to zoom.",
      });
    } else if (/maximum-scale\s*=\s*1(?:[^0-9]|$)/i.test(content)) {
      issues.push({
        id: `meta-viewport-scale`,
        severity: "serious",
        rule: "meta-viewport-scale",
        wcag: "1.4.4",
        description:
          "Viewport meta uses maximum-scale=1, restricting zoom to 100%.",
        element: trunc(tag),
        fix: "Remove maximum-scale=1 or set it to at least maximum-scale=5 to allow adequate zoom.",
      });
    }
  }
  return issues;
}

// 20. landmark-main — no <main> or role="main"
function checkLandmarkMain(html: string): CheckResult {
  if (/<main[\s>]/i.test(html)) return [];
  if (/role\s*=\s*["']main["']/i.test(html)) return [];
  return [
    {
      id: `landmark-main`,
      severity: "moderate",
      rule: "landmark-main",
      wcag: "1.3.6",
      description: 'Page has no <main> landmark or role="main".',
      element: "<main> (missing)",
      fix: "Wrap the primary page content in a <main> element to define the main landmark.",
    },
  ];
}

// 21. landmark-nav — no <nav> or role="navigation"
function checkLandmarkNav(html: string): CheckResult {
  if (/<nav[\s>]/i.test(html)) return [];
  if (/role\s*=\s*["']navigation["']/i.test(html)) return [];
  return [
    {
      id: `landmark-nav`,
      severity: "minor",
      rule: "landmark-nav",
      wcag: "1.3.6",
      description: 'Page has no <nav> landmark or role="navigation".',
      element: "<nav> (missing)",
      fix: 'Wrap navigation links in a <nav> element (or use role="navigation" on a suitable container).',
    },
  ];
}

// 22. form-required-aria — required attribute without aria-required="true"
function checkFormRequiredAria(html: string): CheckResult {
  const re = /<(?:input|select|textarea)(\s[^>]*)?>/gi;
  const issues: CheckResult = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (!hasAttr(tag, "required")) continue;
    const ariaRequired = (getAttr(tag, "aria-required") ?? "").toLowerCase();
    if (ariaRequired === "true") continue;
    issues.push({
      id: `form-required-aria`,
      severity: "minor",
      rule: "form-required-aria",
      wcag: "4.1.2",
      description:
        'Form field uses required but is missing aria-required="true" for broader AT support.',
      element: trunc(tag),
      fix: 'Add aria-required="true" alongside the required attribute for maximum assistive technology compatibility.',
    });
  }
  return issues;
}

// 23. empty-heading — heading with no text content
function checkEmptyHeading(html: string): CheckResult {
  const issues: CheckResult = [];
  for (let level = 1; level <= 6; level++) {
    getElements(html, `h${level}`)
      .filter((el) => innerText(el).length === 0)
      .forEach((el) => {
        issues.push({
          id: `empty-heading`,
          severity: "serious",
          rule: "empty-heading",
          wcag: "2.4.6",
          description: `<h${level}> element has no text content.`,
          element: trunc(el),
          fix: `Add descriptive text to the <h${level}> element or remove it if it serves no purpose.`,
        });
      });
  }
  return issues;
}

// 24. link-new-tab-warn — target="_blank" without rel containing noopener
function checkLinkNewTabWarn(html: string): CheckResult {
  return getElements(html, "a")
    .filter((el) => {
      const openTag = /^<a[^>]*>/i.exec(el)?.[0] ?? el;
      if ((getAttr(openTag, "target") ?? "") !== "_blank") return false;
      const rel = (getAttr(openTag, "rel") ?? "").toLowerCase();
      return !rel.includes("noopener") && !rel.includes("noreferrer");
    })
    .map((el) => ({
      id: `link-new-tab-warn`,
      severity: "minor" as Severity,
      rule: "link-new-tab-warn",
      wcag: "3.2.5",
      description:
        'Link opens in a new tab (target="_blank") without rel="noopener noreferrer", and may not warn users.',
      element: trunc(el),
      fix: 'Add rel="noopener noreferrer" and consider adding a visual/ARIA indicator that the link opens in a new tab.',
    }));
}

// 25. color-contrast-inline — obviously same/similar inline foreground+background
function checkColorContrastInline(html: string): CheckResult {
  const issues: CheckResult = [];
  const inlineStyleRe = /style\s*=\s*["']([^"']*)["']/gi;
  let m: RegExpExecArray | null;

  // Map of CSS color names to hex for simple comparison
  const colorNames: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    gray: "#808080",
    grey: "#808080",
    silver: "#c0c0c0",
    transparent: "transparent",
  };

  function normalizeColor(val: string): string {
    const v = val.trim().toLowerCase();
    return colorNames[v] ?? v;
  }

  while ((m = inlineStyleRe.exec(html)) !== null) {
    const styleStr = m[1];
    const colorMatch = /\bcolor\s*:\s*([^;}"']+)/i.exec(styleStr);
    const bgMatch = /\bbackground(?:-color)?\s*:\s*([^;}"']+)/i.exec(styleStr);
    if (!colorMatch || !bgMatch) continue;

    const fg = normalizeColor(colorMatch[1]);
    const bg = normalizeColor(bgMatch[1]);

    // Flag if obviously same colour
    if (fg === bg && fg !== "transparent") {
      // Find tag for context
      const tagStart = html.lastIndexOf("<", m.index);
      const tagEnd = html.indexOf(">", m.index);
      const tag =
        tagStart !== -1 && tagEnd !== -1
          ? html.slice(tagStart, tagEnd + 1)
          : m[0];
      issues.push({
        id: `color-contrast-inline`,
        severity: "moderate",
        rule: "color-contrast-inline",
        wcag: "1.4.3",
        description: `Inline style sets color and background to the same value ("${fg}"), making text invisible.`,
        element: trunc(tag),
        fix: "Ensure sufficient contrast between foreground and background colors (minimum ratio 4.5:1 for normal text).",
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// All checks registry
// ---------------------------------------------------------------------------

type CheckFn = (html: string) => CheckResult;

const ALL_CHECKS: Array<{ name: string; fn: CheckFn }> = [
  { name: "img-alt", fn: checkImgAlt },
  { name: "img-alt-empty", fn: checkImgAltEmpty },
  { name: "input-label", fn: checkInputLabel },
  { name: "button-name", fn: checkButtonName },
  { name: "link-name", fn: checkLinkName },
  { name: "lang-missing", fn: checkLangMissing },
  { name: "page-title", fn: checkPageTitle },
  { name: "heading-order", fn: checkHeadingOrder },
  { name: "heading-h1-missing", fn: checkHeadingH1Missing },
  { name: "heading-h1-multiple", fn: checkHeadingH1Multiple },
  { name: "focus-visible", fn: checkFocusVisible },
  { name: "tabindex-positive", fn: checkTabindexPositive },
  { name: "autofocus", fn: checkAutofocus },
  { name: "select-label", fn: checkSelectLabel },
  { name: "textarea-label", fn: checkTextareaLabel },
  { name: "table-caption", fn: checkTableCaption },
  { name: "table-th-scope", fn: checkTableThScope },
  { name: "skip-link", fn: checkSkipLink },
  { name: "meta-viewport-scale", fn: checkMetaViewportScale },
  { name: "landmark-main", fn: checkLandmarkMain },
  { name: "landmark-nav", fn: checkLandmarkNav },
  { name: "form-required-aria", fn: checkFormRequiredAria },
  { name: "empty-heading", fn: checkEmptyHeading },
  { name: "link-new-tab-warn", fn: checkLinkNewTabWarn },
  { name: "color-contrast-inline", fn: checkColorContrastInline },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 15,
  serious: 8,
  moderate: 4,
  minor: 1,
};

function computeScore(issues: A11yIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    score -= SEVERITY_PENALTY[issue.severity];
  }
  return Math.max(0, score);
}

function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Audit an HTML string for accessibility issues.
 *
 * @param html - Raw HTML string to audit.
 * @returns Structured audit result with issues, score, grade, and pass/fail info.
 */
export function auditA11y(html: string): A11yAuditResult {
  if (typeof html !== "string") html = "";

  const allIssues: A11yIssue[] = [];
  const passedChecks: string[] = [];

  for (const { name, fn } of ALL_CHECKS) {
    let results: CheckResult;
    try {
      results = fn(html);
    } catch {
      // Gracefully swallow errors in individual checks
      results = [];
    }

    if (results.length === 0) {
      passedChecks.push(name);
    } else {
      for (const r of results) {
        allIssues.push({
          id: r.id,
          severity: r.severity,
          rule: r.rule,
          wcag: r.wcag,
          description: r.description,
          element: r.element,
          fix: r.fix,
        });
      }
    }
  }

  const issueCounts = {
    critical: allIssues.filter((i) => i.severity === "critical").length,
    serious: allIssues.filter((i) => i.severity === "serious").length,
    moderate: allIssues.filter((i) => i.severity === "moderate").length,
    minor: allIssues.filter((i) => i.severity === "minor").length,
    total: allIssues.length,
  };

  const score = computeScore(allIssues);
  const grade = computeGrade(score);

  const summaryParts: string[] = [];
  if (issueCounts.critical > 0)
    summaryParts.push(`${issueCounts.critical} critical`);
  if (issueCounts.serious > 0)
    summaryParts.push(`${issueCounts.serious} serious`);
  if (issueCounts.moderate > 0)
    summaryParts.push(`${issueCounts.moderate} moderate`);
  if (issueCounts.minor > 0) summaryParts.push(`${issueCounts.minor} minor`);

  const summary =
    allIssues.length === 0
      ? `No accessibility issues found. Score: ${score}/100 (${grade}).`
      : `Found ${allIssues.length} issue${allIssues.length === 1 ? "" : "s"} (${summaryParts.join(", ")}). Score: ${score}/100 (${grade}).`;

  return {
    score,
    grade,
    issue_count: issueCounts,
    issues: allIssues,
    passed_checks: passedChecks,
    summary,
  };
}
