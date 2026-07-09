const { test } = require('node:test');
const assert = require('node:assert');
const { detectHost } = require('../lib/agent-hook');

test('detectHost finds a CLI or returns null', () => {
  const host = detectHost();
  assert.ok(host === null || ['claude', 'codex', 'gemini', 'q'].includes(host));
});
