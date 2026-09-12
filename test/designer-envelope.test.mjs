import assert from 'node:assert/strict';
import {
  SERVER_NAME, TOOL_SIDE_EFFECTS, isEnvelopeEnabled,
  wrapResult, wrapError, textResult, errorResult,
} from '../src/envelope.ts';

const KEYS = ['ok','summary','data','artifacts','provenance','warnings','sideEffects','execution','redaction'];
let n = 0;
const t = (name, fn) => { fn(); n++; console.log(`ok ${n} - ${name}`); };

delete process.env['HELA_ENVELOPE'];
t('flag off by default', () => assert.equal(isEnvelopeEnabled(), false));
t('off-mode textResult passes text through byte-identical', () => {
  const r = textResult('generate_rules', 'RULES...');
  assert.equal(r.content[0].text, 'RULES...');
});
t('off-mode errorResult preserves legacy Error: text', () => {
  const r = errorResult('generate_rules', 'boom');
  assert.equal(r.isError, true);
  assert.equal(r.content[0].text, 'Error: boom');
});

process.env['HELA_ENVELOPE'] = 'true';
t('on-mode envelope has all 9 keys', () => {
  const env = JSON.parse(textResult('generate_rules', 'RULES...').content[0].text);
  for (const k of KEYS) assert.ok(k in env, `missing ${k}`);
  assert.equal(env.ok, true);
  assert.equal(env.data, 'RULES...');
  assert.equal(env.execution.serverName, SERVER_NAME);
  assert.equal(env.execution.toolName, 'generate_rules');
});
t('on-mode error envelope', () => {
  const r = errorResult('generate_rules', 'boom');
  assert.equal(r.isError, true);
  const env = JSON.parse(r.content[0].text);
  assert.equal(env.ok, false);
  assert.equal(env.error, 'boom');
});
t('all 29 tools declare empty side effects (pure generation)', () => {
  assert.equal(Object.keys(TOOL_SIDE_EFFECTS).length, 29);
  for (const [tool, se] of Object.entries(TOOL_SIDE_EFFECTS)) assert.deepEqual(se, [], tool);
});
t('run/step ids propagate', () => {
  process.env['HELA_RUN_ID'] = 'r1';
  process.env['HELA_STEP_ID'] = 's2';
  const env = wrapResult('list_options', 'x');
  assert.equal(env.execution.run_id, 'r1');
  assert.equal(env.execution.step_id, 's2');
  assert.equal(wrapError('list_options', 'e').execution.run_id, 'r1');
});
console.log(`\n${n} tests passed`);
