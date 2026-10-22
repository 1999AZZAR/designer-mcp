import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  isStitchAvailable,
  findStitchCli,
  stitchGet,
  stitchUrl,
  stitchSyncDesignSystem,
  stitchScreenAudit,
} from '../dist/stitch.js';

test('Stitch Bridge: detects local stitch CLI binary', () => {
  const cli = findStitchCli();
  assert.ok(cli);
  assert.equal(isStitchAvailable(), true);
});

test('Stitch Bridge: stitchGet status executes CLI and returns structured JSON', async () => {
  const raw = await stitchGet({ resource: 'status' });
  const parsed = JSON.parse(raw);
  assert.ok(parsed);
  // Returns either success with data or structured status payload
  assert.ok(parsed.success !== undefined || parsed.authenticated !== undefined || parsed.error !== undefined);
});

test('Stitch Bridge: stitchSyncDesignSystem generates valid DESIGN.md and design-system.json', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stitch-sync-test-'));
  try {
    const raw = stitchSyncDesignSystem({
      themeName: 'Obsidian Kinetic',
      targetDir: tempDir,
    });
    const res = JSON.parse(raw);
    assert.equal(res.ok, true);
    assert.equal(res.theme, 'Obsidian Kinetic');

    // Verify .stitch/design-system.json
    assert.ok(fs.existsSync(res.designSystemJsonPath));
    const dsJson = JSON.parse(fs.readFileSync(res.designSystemJsonPath, 'utf8'));
    assert.ok(dsJson.designSystem);
    assert.equal(dsJson.designSystem.theme.colorMode, 'DARK');
    assert.ok(dsJson.designSystem.tokens.paper.includes('oklch'));

    // Verify DESIGN.md
    assert.ok(fs.existsSync(res.designMdPath));
    const designMd = fs.readFileSync(res.designMdPath, 'utf8');
    assert.ok(designMd.includes('# DESIGN.md — Obsidian Kinetic'));
    assert.ok(designMd.includes('OKLCH Color Tokens'));
    assert.ok(designMd.includes('clamp(2.5rem, 8vw, 7rem)'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Stitch Bridge: stitchScreenAudit audits HTML with WCAG, anti-slop, and craft critique', () => {
  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample Screen</title>
  <style>
    :root { --color-paper: oklch(10% 0.02 260); }
    :focus-visible { outline: 2px solid white; }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
</head>
<body class="bg-black text-white">
  <main>
    <h1 style="font-size: clamp(2.5rem, 8vw, 6rem);" data-anime-split>
      Kinetic Experience
    </h1>
    <button data-anime-magnetic class="px-6 py-3 rounded-full bg-white text-black font-mono">
      Explore
    </button>
  </main>
</body>
</html>`;

  const raw = stitchScreenAudit({ screenHtml: sampleHtml, genre: 'avant-garde' });
  const report = JSON.parse(raw);

  assert.equal(report.ok, true);
  assert.equal(report.genre, 'avant-garde');
  assert.ok(report.accessibility);
  assert.ok(report.accessibility.score >= 0);
  assert.ok(report.antiSlop);
  assert.ok(report.antiSlop.totalGates >= 35);
  assert.ok(report.craftQuality);
  assert.ok(report.craftQuality.hierarchy >= 3);
});
