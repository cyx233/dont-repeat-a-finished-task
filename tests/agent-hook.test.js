const { test } = require('node:test');
const assert = require('node:assert');
const { getSessionCwd } = require('../lib/agent-hook');

test('getSessionCwd returns cwd from opts', () => {
  assert.strictEqual(getSessionCwd({ cwd: '/tmp' }), '/tmp');
});

test('getSessionCwd returns undefined without input', () => {
  assert.strictEqual(getSessionCwd({}), undefined);
});
