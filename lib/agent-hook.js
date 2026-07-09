"use strict";

const { execFileSync } = require('child_process');

// ponytail: claude-only, multi-host if this ever ships as a generic agent plugin
function detectHost() {
  try {
    require('child_process').execSync('command -v claude', { stdio: ['pipe', 'pipe', 'ignore'] });
    return 'claude';
  } catch { return null; }
}

function forkQueryStrict(prompt, opts = {}) {
  const maxRetries = opts.maxRetries || 2;
  const args = buildForkArgs(opts);

  let currentPrompt = prompt;
  for (let i = 0; i <= maxRetries; i++) {
    let raw;
    try {
      raw = execFileSync('claude', [...args, currentPrompt], {
        encoding: 'utf8',
        timeout: opts.timeout || 15000,
        stdio: ['pipe', 'pipe', 'ignore'],
        env: { ...process.env, CLAUDE_EFFORT: opts.effort || 'low' },
      }).trim();
    } catch (e) {
      if (i === maxRetries) throw e;
      continue;
    }

    const parsed = tryParseJSON(raw);
    if (parsed !== null) {
      if (opts.validate && !opts.validate(parsed)) {
        currentPrompt = `Your previous output was valid JSON but failed validation. Output was:\n${raw}\n\nFix it. Return ONLY valid JSON matching the required schema.`;
        continue;
      }
      return parsed;
    }
    currentPrompt = `Your previous output was not valid JSON. Output was:\n${raw}\n\nReturn ONLY valid JSON. No markdown, no explanation.`;
  }
  throw new Error('agent-hook: failed to get valid JSON after retries');
}

function buildForkArgs(opts) {
  const args = [];
  if (opts.sessionId) args.push('--resume', opts.sessionId, '--fork-session');
  else args.push('--continue', '--fork-session');
  args.push('--bare', '--no-session-persistence', '-p', '--output-format', 'json');
  args.push('--model', opts.model || 'claude-haiku-4-5');
  if (opts.agent) args.push('--agent', opts.agent);
  if (opts.schema) args.push('--json-schema', JSON.stringify(opts.schema));
  return args;
}

function tryParseJSON(raw) {
  try {
    const wrapper = JSON.parse(raw);
    if (wrapper && typeof wrapper.result === 'string') {
      try { return JSON.parse(wrapper.result); } catch { return tryParseRaw(wrapper.result); }
    }
    if (wrapper && typeof wrapper.result === 'object') return wrapper.result;
    return wrapper;
  } catch {}
  return tryParseRaw(raw);
}

function tryParseRaw(raw) {
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch {} }
  try { return JSON.parse(raw); } catch { return null; }
}

module.exports = { detectHost, forkQueryStrict };
