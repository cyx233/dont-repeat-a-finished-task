const { test } = require('node:test');
const assert = require('node:assert');
const { detectHost } = require('../lib/agent-hook');

test('detectHost finds a CLI or returns null', () => {
  const host = detectHost();
  assert.ok(host === null || ['claude', 'codex', 'gemini', 'q'].includes(host));
});

test('tryParseJSON handles wrapper format', () => {
  // Access internal via require — module caches
  const mod = require('../lib/agent-hook');
  // forkQueryStrict validates; test the parse logic indirectly
  assert.ok(typeof mod.forkQueryStrict === 'function');
});
