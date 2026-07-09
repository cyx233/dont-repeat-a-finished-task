const { execSync } = require('child_process');
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const HOOKS = path.join(__dirname, '..', 'hooks');

test('auto-cache exits cleanly when stop_hook_active', () => {
  const out = execSync(`echo '{"stop_hook_active":true}' | node "${path.join(HOOKS, 'auto-cache.js')}"`, { encoding: 'utf8', cwd: '/tmp' });
  assert.strictEqual(out, '');
});

test('draft-match exits cleanly with empty prompt', () => {
  const out = execSync(`echo '{"prompt":""}' | node "${path.join(HOOKS, 'draft-match.js')}"`, { encoding: 'utf8', cwd: '/tmp' });
  assert.strictEqual(out, '');
});
