const { execSync } = require('child_process');
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SCAN = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

test('--all runs without error', () => {
  execSync(`node "${SCAN}" --all`, { encoding: 'utf8', cwd: '/tmp' });
});

test('--find non-existent exits 1', () => {
  assert.throws(() => execSync(`node "${SCAN}" --find nope`, { encoding: 'utf8', cwd: '/tmp' }));
});
