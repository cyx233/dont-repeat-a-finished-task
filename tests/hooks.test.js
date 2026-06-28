const { execSync } = require('child_process');
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const HOOKS = path.join(__dirname, '..', 'hooks');
const SCRIPTS = path.join(__dirname, '..', 'scripts', 'lib');

test('draft-activate.js produces output', () => {
  const out = execSync(`node "${path.join(HOOKS, 'draft-activate.js')}"`, { encoding: 'utf8', cwd: '/tmp' });
  assert.ok(out.includes('DRAFT plugin is active'));
});

test('auto-cache.js always outputs trigger', () => {
  const out = execSync(`node "${path.join(HOOKS, 'auto-cache.js')}"`, { encoding: 'utf8', cwd: '/tmp' });
  assert.ok(out.includes('"draft":"auto-cache"'));
});

test('scan.js --all runs without error', () => {
  execSync(`node "${path.join(SCRIPTS, 'scan.js')}" --all`, { encoding: 'utf8', cwd: '/tmp' });
});

test('draft-subagent.js exits cleanly without cache', () => {
  const out = execSync(`node "${path.join(HOOKS, 'draft-subagent.js')}"`, { encoding: 'utf8', cwd: '/tmp' });
  // Without cached items, should exit 0 with no/empty output
  assert.ok(out === '' || out.includes('DRAFT'));
});
