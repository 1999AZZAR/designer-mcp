/**
 * stitch.ts
 * Native Stitch Canvas & Workflow integration for the-designer MCP (HeLa Phenotype).
 *
 * Provides:
 * 1. Seven Stitch core resource tools (stitch_get, stitch_find, stitch_create,
 *    stitch_edit, stitch_delete, stitch_generate, stitch_url), superseding the
 *    dedicated stitch MCP server.
 * 2. Two Phenotype-native bridge tools:
 *    - stitch_sync_design_system (converts OKLCH tokens & design rules into Stitch DESIGN.md & design-system JSON)
 *    - stitch_screen_audit (audits Stitch-captured screens with WCAG 2.1, 35 anti-slop gates & 6-axis craft critique)
 */

import { spawn } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { generateTokens, getTheme, listThemes } from "./tokens.js";
import { auditA11y } from "./a11y-audit.js";
import { runSlopTest, selfCritique } from "./anti-patterns.js";

// ─── CLI Execution Helper ───────────────────────────────────────────────────

export function findStitchCli(): string | null {
  const commonPaths = ["/usr/bin/stitch", "/usr/local/bin/stitch"];
  for (const p of commonPaths) {
    if (existsSync(p)) return p;
  }
  return null;
}

export function isStitchAvailable(): boolean {
  return findStitchCli() !== null;
}

export interface StitchExecResult {
  ok: boolean;
  exitCode: number;
  data: any;
  raw: string;
  error?: string;
}

export async function execStitchCli(
  args: string[],
  payload?: any,
  timeoutMs = 30000,
): Promise<StitchExecResult> {
  const cli = findStitchCli();
  if (!cli) {
    return {
      ok: false,
      exitCode: 127,
      data: null,
      raw: "",
      error:
        "Stitch CLI (/usr/bin/stitch) is not installed on this host environment.",
    };
  }

  // Ensure --json flag is present
  const fullArgs = [...args];
  if (!fullArgs.includes("--json")) {
    fullArgs.push("--json");
  }

  if (payload !== undefined && !fullArgs.some((a) => a.startsWith("--json="))) {
    fullArgs.push(typeof payload === "string" ? payload : JSON.stringify(payload));
  }

  return new Promise((resolvePromise) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    const child = spawn(cli, fullArgs, {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGTERM");
      resolvePromise({
        ok: false,
        exitCode: 124,
        data: null,
        raw: "",
        error: `Stitch command timed out after ${timeoutMs}ms: stitch ${args.join(" ")}`,
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (killed) return;

      const exitCode = code ?? 0;
      let parsed: any = null;
      try {
        const trimmed = stdout.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          parsed = JSON.parse(trimmed);
        }
      } catch {
        parsed = null;
      }

      if (exitCode === 0) {
        resolvePromise({
          ok: true,
          exitCode: 0,
          data: parsed ?? { output: stdout.trim() },
          raw: stdout,
        });
      } else {
        const errorMsg =
          stderr.trim() ||
          (parsed?.error?.message ? parsed.error.message : "") ||
          stdout.trim() ||
          `Stitch command failed with exit code ${exitCode}`;
        resolvePromise({
          ok: false,
          exitCode,
          data: parsed,
          raw: stderr || stdout,
          error: errorMsg,
        });
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolvePromise({
        ok: false,
        exitCode: 1,
        data: null,
        raw: "",
        error: err.message,
      });
    });
  });
}

// ─── 7 Core Stitch MCP Handlers ─────────────────────────────────────────────

export async function stitchGet(args: {
  resource: string;
  id?: string;
  project?: string;
  workspace?: string;
}): Promise<string> {
  const cliArgs = ["get", args.resource];
  if (args.id) cliArgs.push(args.id);
  if (args.project) cliArgs.push("--project", args.project);
  if (args.workspace) cliArgs.push("--workspace", args.workspace);

  const res = await execStitchCli(cliArgs);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

export async function stitchFind(args: {
  resource: string;
  project?: string;
  workspace?: string;
  limit?: number;
  filter?: string;
  criteria?: Record<string, any>;
}): Promise<string> {
  const cliArgs = ["find", args.resource];
  if (args.project) cliArgs.push("--project", args.project);
  if (args.workspace) cliArgs.push("--workspace", args.workspace);
  if (args.limit) cliArgs.push("--limit", String(args.limit));
  if (args.filter) cliArgs.push("--filter", args.filter);

  const res = await execStitchCli(cliArgs);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

export async function stitchCreate(args: {
  resource: string;
  body: Record<string, any>;
  project?: string;
  workspace?: string;
  dryRun?: boolean;
}): Promise<string> {
  const cliArgs = ["create", args.resource];
  if (args.project) cliArgs.push("--project", args.project);
  if (args.workspace) cliArgs.push("--workspace", args.workspace);
  if (args.dryRun) cliArgs.push("--dry-run");

  const res = await execStitchCli(cliArgs, args.body);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

export async function stitchEdit(args: {
  resource: string;
  id: string;
  body: Record<string, any>;
  project?: string;
  workspace?: string;
}): Promise<string> {
  const cliArgs = ["edit", args.resource, args.id];
  if (args.project) cliArgs.push("--project", args.project);
  if (args.workspace) cliArgs.push("--workspace", args.workspace);

  const res = await execStitchCli(cliArgs, args.body);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

export async function stitchDelete(args: {
  resource: string;
  id: string;
  project?: string;
  workspace?: string;
}): Promise<string> {
  const cliArgs = ["delete", args.resource, args.id];
  if (args.project) cliArgs.push("--project", args.project);
  if (args.workspace) cliArgs.push("--workspace", args.workspace);

  const res = await execStitchCli(cliArgs);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

export async function stitchGenerate(args: Record<string, any>): Promise<string> {
  const resource = args.resource || "screens";
  const cliArgs = ["generate", resource];
  if (args.project) cliArgs.push("--project", args.project);
  if (args.workspace) cliArgs.push("--workspace", args.workspace);
  if (args.dryRun || args["dry-run"]) cliArgs.push("--dry-run");

  const bodyPayload: Record<string, any> = {};
  for (const [k, v] of Object.entries(args)) {
    if (!["resource", "project", "workspace", "dryRun", "dry-run"].includes(k)) {
      bodyPayload[k] = v;
    }
  }

  const res = await execStitchCli(cliArgs, Object.keys(bodyPayload).length ? bodyPayload : undefined);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

export async function stitchUrl(args: {
  resource: string;
  id?: string;
  project?: string;
}): Promise<string> {
  const cliArgs = ["url", args.resource];
  if (args.id) cliArgs.push(args.id);
  if (args.project) cliArgs.push("--project", args.project);

  const res = await execStitchCli(cliArgs);
  return JSON.stringify(res.ok ? res.data : { error: res.error, code: res.exitCode }, null, 2);
}

// ─── 2 Phenotype-Native Bridge Tools ────────────────────────────────────────

export interface StitchSyncResult {
  ok: boolean;
  theme: string;
  designMdPath: string;
  designSystemJsonPath: string;
  designSystem: Record<string, any>;
  summary: string;
}

export function stitchSyncDesignSystem(args: {
  themeName?: string;
  style?: string;
  targetDir?: string;
}): string {
  const targetDir = resolve(args.targetDir || process.cwd());
  const dotStitchDir = join(targetDir, ".stitch");
  if (!existsSync(dotStitchDir)) {
    mkdirSync(dotStitchDir, { recursive: true });
  }

  const theme = getTheme(args.themeName || "Obsidian Kinetic") || listThemes()[0];
  const tokenSet = generateTokens(theme.name);

  // Synthesize Stitch-compliant designSystem JSON
  const headlineFont = theme.fontDisplay.split(",")[0].replace(/['"]/g, "").trim();
  const bodyFont = theme.fontBody.split(",")[0].replace(/['"]/g, "").trim();
  const isDark = theme.paperBand === "dark";

  const designSystemPayload = {
    designSystem: {
      displayName: `${theme.name} Design System`,
      theme: {
        headlineFont: headlineFont.toUpperCase().replace(/\s+/g, "_"),
        bodyFont: bodyFont.toUpperCase().replace(/\s+/g, "_"),
        colorMode: isDark ? "DARK" : "LIGHT",
        customColor: isDark ? "#10B981" : "#3B82F6",
        roundness: "ROUND_SIXTEEN",
      },
      tokens: {
        paper: tokenSet.tokens.colors["--color-paper"],
        accent: tokenSet.tokens.colors["--color-accent"],
        border: tokenSet.tokens.colors["--color-border"],
        text: tokenSet.tokens.colors["--color-text"],
      },
    },
  };

  const jsonPath = join(dotStitchDir, "design-system.json");
  writeFileSync(jsonPath, JSON.stringify(designSystemPayload, null, 2), "utf8");

  // Synthesize canonical DESIGN.md specification
  const designMdContent = `# DESIGN.md — ${theme.name}

> Generated by **the-designer MCP (HeLa Phenotype)** for Stitch Canvas and Codebase Alignment.

## 1. Visual Language & Style
- **System Theme**: ${theme.name} (${theme.genre})
- **Paper Band**: ${theme.paperBand}
- **Color Mode**: ${isDark ? "Dark Theme" : "Light Theme"}
- **Display Style**: ${theme.displayStyle}

## 2. Typographic Scale & Fonts
- **Display Font**: \`${theme.fontDisplay}\`
- **Body Font**: \`${theme.fontBody}\`
- **Monospace Font**: \`${theme.fontMono}\`
- **Hierarchy Guideline**: Extreme heading-to-body contrast (\`clamp(2.5rem, 8vw, 7rem)\`) with tight tracking on headings.

## 3. OKLCH Color Tokens
- \`--color-paper\`: \`${tokenSet.tokens.colors["--color-paper"]}\`
- \`--color-paper-2\`: \`${tokenSet.tokens.colors["--color-paper-2"]}\`
- \`--color-accent\`: \`${tokenSet.tokens.colors["--color-accent"]}\`
- \`--color-text\`: \`${tokenSet.tokens.colors["--color-text"]}\`
- \`--color-border\`: \`${tokenSet.tokens.colors["--color-border"]}\`

## 4. Interaction & Motion Rules
- Tactile physics with magnetic cursor bounds on primary interactive elements.
- Staggered split-text reveals for section headings.
- Strictly respect \`@media (prefers-reduced-motion: reduce)\` on all choreographies.

## 5. Anti-Slop Constraints
- Reject generic corporate SaaS blue buttons and sterile equal-width 3-card columns.
- Mandate accessible focus visible rings and minimum 44x44px touch targets.
`;

  const designMdPath = join(targetDir, "DESIGN.md");
  writeFileSync(designMdPath, designMdContent, "utf8");

  const result: StitchSyncResult = {
    ok: true,
    theme: theme.name,
    designMdPath,
    designSystemJsonPath: jsonPath,
    designSystem: designSystemPayload,
    summary: `Synchronized ${theme.name} design system to ${jsonPath} and ${designMdPath}`,
  };

  return JSON.stringify(result, null, 2);
}

export function stitchScreenAudit(args: {
  screenHtml?: string;
  filePath?: string;
  genre?: string;
}): string {
  let html = args.screenHtml || "";
  if (!html && args.filePath) {
    const fullPath = resolve(args.filePath);
    if (existsSync(fullPath)) {
      html = readFileSync(fullPath, "utf8");
    } else {
      return JSON.stringify({
        ok: false,
        error: `File not found for screen audit: ${fullPath}`,
      }, null, 2);
    }
  }

  if (!html) {
    return JSON.stringify({
      ok: false,
      error: "No HTML provided for stitch_screen_audit. Provide screenHtml or filePath.",
    }, null, 2);
  }

  const genre = args.genre || "avant-garde";
  const a11y = auditA11y(html);
  const slop = runSlopTest(html, genre);
  const critique = selfCritique(html);

  return JSON.stringify({
    ok: true,
    genre,
    accessibility: {
      score: a11y.score,
      grade: a11y.grade,
      summary: a11y.summary,
      totalIssues: a11y.issues.length,
      issues: a11y.issues.slice(0, 10), // Top 10 actionable issues
    },
    antiSlop: {
      totalGates: slop.total,
      passed: slop.passed,
      failed: slop.failed,
      summary: slop.summary,
      failedGates: slop.gates.filter((g) => !g.pass),
    },
    craftQuality: critique,
  }, null, 2);
}
