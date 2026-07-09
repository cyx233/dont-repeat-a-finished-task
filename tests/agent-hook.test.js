const { test } = require('node:test');
const assert = require('node:assert');
const { detectHost, forkQueryStrict } = require('../lib/agent-hook');

test('detectHost returns claude or null', () => {
  const host = detectHost();
  assert.ok(host === null || host === 'claude');
});

test('forkQueryStrict is exported', () => {
  assert.strictEqual(typeof forkQueryStrict, 'function');
});
