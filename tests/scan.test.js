const { execSync } = require('child_process');
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SCAN = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

test('--find non-existent exits 1', () => {
  assert.throws(() => {
    execSync(`node "${SCAN}" --find does-not-exist-xyz`, { encoding: 'utf8', cwd: '/tmp' });
  });
});

test('--find-note non-existent exits 1', () => {
  assert.throws(() => {
    execSync(`node "${SCAN}" --find-note does-not-exist-xyz`, { encoding: 'utf8', cwd: '/tmp' });
  });
});

test('default mode runs without error', () => {
  execSync(`node "${SCAN}"`, { encoding: 'utf8', cwd: '/tmp' });
});
