import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveWithinRoot, PathContainmentError } from '../src/envelope.ts';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

let n = 0;
const t = (name, fn) => { fn(); n++; console.log(`ok ${n} - ${name}`); };

const tmp = mkdtempSync(join(tmpdir(), 'path-guard-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));

/* ---------- the helper itself ---------- */

const root = join(tmp, 'references');
mkdirSync(root, { recursive: true });
writeFileSync(join(root, 'ant-design.md'), '# ant');
writeFileSync(join(tmp, 'secret.md'), '# secret outside');
mkdirSync(join(tmp, 'nested'), { recursive: true });
writeFileSync(join(tmp, 'nested', 'secret.md'), '# nested secret');

t('a legitimate bare name resolves inside the root', () => {
  const p = resolveWithinRoot(root, 'ant-design', { label: 'name', extension: '.md' });
  assert.equal(p, join(root, 'ant-design.md'));
});

const rejects = (fn, re) => {
  try { fn(); } catch (e) {
    assert.ok(e instanceof PathContainmentError, `expected PathContainmentError, got ${e}`);
    assert.match(e.message, re);
    return;
  }
  assert.fail('expected a PathContainmentError');
};

t('rejects the reported PoC (../ escape to a sibling skill)', () => {
  rejects(() => resolveWithinRoot(root, '../../motion-designer/references/motion-dev-guidelines',
    { label: 'name', extension: '.md' }), /must be a bare file name/);
});

t('rejects every relative-traversal form', () => {
  for (const evil of ['..', '../secret', '../../etc/hostname', 'a/../secret', './../secret',
    '..\\secret', 'nested/../../secret', 'a/b/../../../secret']) {
    rejects(() => resolveWithinRoot(root, evil, { label: 'name', extension: '.md' }),
      /must be a bare file name|must not be an absolute or traversing path/);
  }
});

t('rejects absolute paths and NUL bytes', () => {
  rejects(() => resolveWithinRoot(root, '/etc/hostname', { label: 'name' }), /bare file name/);
  rejects(() => resolveWithinRoot(root, '/etc/hostname'.replace(/\//g, String.fromCharCode(92)),
    { label: 'name' }), /bare file name/);
  rejects(() => resolveWithinRoot(root, 'ant-design\u0000.md', { label: 'name' }), /bare file name/);
});

t('rejects empty and non-string input', () => {
  rejects(() => resolveWithinRoot(root, '', { label: 'name' }), /non-empty string/);
  rejects(() => resolveWithinRoot(root, '   ', { label: 'name' }), /non-empty string/);
  rejects(() => resolveWithinRoot(root, undefined, { label: 'name' }), /non-empty string/);
  rejects(() => resolveWithinRoot(root, 42, { label: 'name' }), /non-empty string/);
});

t('refuses a symlink that points outside the root', () => {
  const link = join(root, 'escape.md');
  symlinkSync(join(tmp, 'secret.md'), link);
  rejects(() => resolveWithinRoot(root, 'escape', { label: 'name', extension: '.md' }),
    /resolves outside the allowed directory/);
});

t('rejects a directory passed where a file is expected', () => {
  mkdirSync(join(root, 'sub.md'), { recursive: true });
  rejects(() => resolveWithinRoot(root, 'sub', { label: 'name', extension: '.md' }), /not a file/);
});

t('allows a name that simply does not exist (caller reports not-found)', () => {
  const p = resolveWithinRoot(root, 'no-such-doc', { label: 'name', extension: '.md' });
  assert.equal(existsSync(p), false);
  assert.equal(p, join(root, 'no-such-doc.md'));
});

t('reports a missing trusted root instead of reading anything', () => {
  rejects(() => resolveWithinRoot(join(tmp, 'no-such-root'), 'ant-design', { label: 'name' }),
    /trusted root is missing/);
});

/* ---------- end to end over stdio, against the real tool ---------- */

function callTool(name, args) {
  const env = { ...process.env };
  const res = spawnSync('node', [join(REPO, 'dist', 'index.js')], {
    input: [
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } }),
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } }),
      '',
    ].join('\n'),
    encoding: 'utf8', env, cwd: REPO, timeout: 60_000,
  });
  for (const line of (res.stdout ?? '').split('\n')) {
    const s = line.trim();
    if (!s.startsWith('{')) continue;
    let r; try { r = JSON.parse(s); } catch { continue; }
    if (r.id === 2) return r.result?.content?.[0]?.text ?? JSON.stringify(r);
  }
  return '';
}

const CANARY = join(tmp, 'canary-secret.md');
writeFileSync(CANARY, 'CANARY_TOKEN_do_not_leak');

t('get_reference still serves a real reference doc', () => {
  const out = callTool('get_reference', { name: 'ant-design' });
  assert.ok(!out.startsWith('Error'), `unexpected error: ${out.slice(0, 120)}`);
});

t('get_reference no longer leaks across skills (issue #14 PoC)', () => {
  const out = callTool('get_reference', { name: '../../motion-designer/references/motion-dev-guidelines' });
  assert.match(out, /Error/, 'traversal must be refused');
  assert.equal(/motion\.dev|React Integration/.test(out), false, 'must not return foreign file content');
});

t('get_reference cannot read outside the process working tree', () => {
  const rel = CANARY.split(REPO).pop();
  for (const evil of [rel.replace(/^\//, '').replace(/\.md$/, ''), '../../../../../../etc/hostname',
    '/etc/hostname', '..%2f..%2fetc']) {
    const out = callTool('get_reference', { name: evil });
    assert.match(out, /Error/, `should refuse ${evil}: ${out.slice(0, 100)}`);
    assert.equal(out.includes('CANARY_TOKEN'), false);
  }
});

t('get_ellis_ui_template cannot traverse out of examples/ellis-ui', () => {
  const out = callTool('get_ellis_ui_template', { design_name: '../../../skills/logo-design' });
  assert.match(out, /Error/, `traversal must be refused: ${out.slice(0, 120)}`);
});

t('get_ellis_ui_template still serves a real design', () => {
  const out = callTool('get_ellis_ui_template', { design_name: 'backup_gameboy' });
  assert.ok(!out.startsWith('Error'), `unexpected error: ${out.slice(0, 120)}`);
  assert.ok(out.length > 200, 'expected template content');
});

console.log(`\n${n} tests passed`);
