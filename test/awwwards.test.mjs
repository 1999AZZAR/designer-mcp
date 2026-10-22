import { test } from 'node:test';
import assert from 'node:assert/strict';

import { STYLES, PALETTES, buildSingle } from '../dist/rules.js';
import { listThemes, listGenres, detectGenre, generateTokens } from '../dist/tokens.js';
import { generateMotionSnippet, MOTION_CATEGORIES } from '../dist/anime-motion.js';
import { generateMotionDevSnippet } from '../dist/motion-dev.js';
import { getComponent, COMPONENT_TYPES } from '../dist/components.js';
import { generateTemplate } from '../dist/templates.js';
import { runSlopTest, selfCritique } from '../dist/anti-patterns.js';

test('Awwwards Rules: awwwards style is registered with SOTA guidelines', () => {
  assert.ok(STYLES.awwwards);
  assert.equal(STYLES.awwwards.label, 'Awwwards SOTA / Avant-Garde');
  assert.ok(STYLES.awwwards.rules.some((r) => r.includes('clamp')));
  assert.ok(STYLES.awwwards.rules.some((r) => r.includes('Syne')));

  const rules = buildSingle('awwwards', 'obsidian-noir', 'dashboard');
  assert.ok(rules.includes('Awwwards SOTA / Avant-Garde'));
  assert.ok(rules.includes('obsidian surfaces'));
});

test('Awwwards Palettes: obsidian-noir, copper-cyber, acid-avant registered', () => {
  assert.ok(PALETTES['obsidian-noir']);
  assert.ok(PALETTES['copper-cyber']);
  assert.ok(PALETTES['acid-avant']);
});

test('Awwwards Themes: avant-garde genre and themes in tokens.ts', () => {
  const genres = listGenres();
  assert.ok(genres.includes('avant-garde'));

  const detected = detectGenre('award-winning creative agency interactive portfolio website');
  assert.equal(detected, 'avant-garde');

  const avantThemes = listThemes('avant-garde');
  assert.ok(avantThemes.length >= 3);
  assert.ok(avantThemes.some((t) => t.name === 'Obsidian Kinetic'));
  assert.ok(avantThemes.some((t) => t.name === 'Tokyo Neo-Brutal'));
  assert.ok(avantThemes.some((t) => t.name === 'Atelier Craft'));

  const tokenRes = generateTokens('Obsidian Kinetic');
  assert.ok(tokenRes.css.includes('oklch('));
  assert.ok(tokenRes.full_css.includes('@media (prefers-color-scheme: light)'));
  const atelierRes = generateTokens('Atelier Craft');
  assert.ok(atelierRes.full_css.includes('@media (prefers-color-scheme: dark)'));
});

test('Awwwards Motion: anime.js v3 categories and reduced-motion protection', () => {
  assert.ok(MOTION_CATEGORIES.includes('magnetic'));
  assert.ok(MOTION_CATEGORIES.includes('text-split'));
  assert.ok(MOTION_CATEGORIES.includes('smooth-scroll'));
  assert.ok(MOTION_CATEGORIES.includes('marquee'));
  assert.ok(MOTION_CATEGORIES.includes('noise-grain'));
  assert.ok(MOTION_CATEGORIES.includes('clip-path-mask'));

  const mag = generateMotionSnippet('magnetic', 'awwwards');
  assert.ok(mag.snippet.includes('data-anime-magnetic'));
  assert.ok(mag.snippet.includes('prefers-reduced-motion'));

  const split = generateMotionSnippet('text-split', 'awwwards');
  assert.ok(split.snippet.includes('data-anime-split'));
  assert.ok(split.snippet.includes('prefers-reduced-motion'));

  const lenis = generateMotionSnippet('smooth-scroll', 'awwwards');
  assert.ok(lenis.snippet.includes('lenis'));

  const marquee = generateMotionSnippet('marquee', 'awwwards');
  assert.ok(marquee.snippet.includes('marquee-inner'));

  const grain = generateMotionSnippet('noise-grain', 'awwwards');
  assert.ok(grain.snippet.includes('feTurbulence'));

  const clip = generateMotionSnippet('clip-path-mask', 'awwwards');
  assert.ok(clip.snippet.includes('clipPath'));
});

test('Awwwards Motion: motion.dev React and Vanilla generators', () => {
  const magReact = generateMotionDevSnippet('magnetic', 'awwwards', 'react');
  assert.ok(magReact.snippet.includes('useSpring'));
  assert.ok(magReact.snippet.includes('motion/react'));

  const magVanilla = generateMotionDevSnippet('magnetic', 'awwwards', 'html');
  assert.ok(magVanilla.snippet.includes('data-motion-magnetic'));

  const splitReact = generateMotionDevSnippet('text-split', 'awwwards', 'react');
  assert.ok(splitReact.snippet.includes('SplitTextReveal'));

  const scrollReact = generateMotionDevSnippet('smooth-scroll', 'awwwards', 'react');
  assert.ok(scrollReact.snippet.includes('ReactLenis'));

  const marqueeReact = generateMotionDevSnippet('marquee', 'awwwards', 'react');
  assert.ok(marqueeReact.snippet.includes('Marquee'));
});

test('Awwwards Components: bento-grid and marquee across HTML, React, Vue', () => {
  assert.ok(COMPONENT_TYPES.includes('bento-grid'));
  assert.ok(COMPONENT_TYPES.includes('marquee'));

  // HTML
  const bentoHtml = getComponent('bento-grid', 'awwwards', 'html');
  assert.ok(bentoHtml.includes('Bento Grid Component'));
  assert.ok(bentoHtml.includes('md:col-span-8'));

  // React
  const bentoReact = getComponent('bento-grid', 'awwwards', 'react');
  assert.ok(bentoReact.includes('export const BentoGrid: React.FC<BentoGridProps>'));

  // Vue
  const bentoVue = getComponent('bento-grid', 'awwwards', 'vue');
  assert.ok(bentoVue.includes('<template>'));
  assert.ok(bentoVue.includes('defineProps<Props>()'));

  // Marquee
  const marqueeHtml = getComponent('marquee', 'awwwards', 'html');
  assert.ok(marqueeHtml.includes('AWWWARDS SOTA CRAFT'));
});

test('Awwwards Template: generateTemplate with bento-showcase archetype', () => {
  const template = generateTemplate('awwwards', 'obsidian-noir', 'awwwards-bento');
  assert.ok(template.includes('Awwwards SOTA Showcase'));
  assert.ok(template.includes('feTurbulence'));
  assert.ok(template.includes('data-anime-magnetic'));
  assert.ok(template.includes('data-anime-split'));
  assert.ok(template.includes('data-anime-card'));
  assert.ok(template.includes('Syne'));
});

test('Awwwards Anti-Slop: gate 57, gate 58 and selfCritique scoring', () => {
  const template = generateTemplate('awwwards', 'obsidian-noir', 'awwwards-bento');
  const slopRes = runSlopTest(template, 'avant-garde');
  assert.ok(slopRes.total >= 35);
  assert.ok(slopRes.gates.some((g) => g.id === 57 && g.pass));
  assert.ok(slopRes.gates.some((g) => g.id === 58 && g.pass));

  const critique = selfCritique(template);
  assert.ok(critique.hierarchy >= 4);
  assert.ok(critique.variety >= 4);
});
