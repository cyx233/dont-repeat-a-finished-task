#!/usr/bin/env node
// Hook: Stop (asyncRewake)
// Unconditionally triggers — let the agent decide if the session is worth caching.

const { setCacheMode } = require('./draft-runtime');
setCacheMode('');

console.log('{"draft":"auto-cache"}');
