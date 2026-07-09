"use strict";

const { execSync, execFileSync } = require('child_process');

const HOSTS = {
  claude: {
    env: 'CLAUDE_PROJECT_DIR',
    build(prompt, opts) {
      const args = ['-p', '--output-format', 'json'];
      if (opts.schema) args.push('--json-schema', JSON.stringify(opts.schema));
      return `claude ${args.join(' ')} ${esc(prompt)}`;
    },
  },
  codex: {
    env: 'CODEX_PROJECT_DIR',
    build(prompt) { return `codex exec ${esc(prompt)}`; },
  },
  gemini: {
    env: 'GEMINI_HOME',
    build(prompt) { return `gemini -p ${esc(prompt)}`; },
  },
  q: {
    env: 'Q_HOME',
    build(prompt) { return `q chat --no-interactive ${esc(prompt)}`; },
  },
};

function which(bin) {
  try { return execSync(`command -v ${bin}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

function detectHost() {
  for (const [name, cfg] of Object.entries(HOSTS)) {
    if (process.env[cfg.env] || which(name)) return name;
  }
  return null;
}

function query(prompt, opts = {}) {
  const host = opts.host || detectHost();
  if (!host || !HOSTS[host]) throw new Error('agent-hook: no supported CLI found');

  const cmd = HOSTS[host].build(prompt, opts);
  const raw = execSync(cmd, {
    encoding: 'utf8',
    timeout: opts.timeout || 15000,
    stdio: ['pipe', 'pipe', 'ignore'],
    env: { ...process.env, CLAUDE_EFFORT: 'low' },
  }).trim();

  try { return JSON.parse(raw); } catch { return raw; }
}

// Fork hack: reuses parent session KV cache via --resume --fork-session.
// Returns parsed JSON or raw string. Throws on timeout.
function forkQuery(prompt, opts = {}) {
  const args = buildForkArgs(opts);
  args.push(prompt);

  const raw = execFileSync('claude', args, {
    encoding: 'utf8',
    timeout: opts.timeout || 15000,
    stdio: ['pipe', 'pipe', 'ignore'],
    env: { ...process.env, CLAUDE_EFFORT: opts.effort || 'low' },
  }).trim();

  return parseResponse(raw);
}

// Fork hack with structured output + retry on parse failure.
// Sends malformed output back to the agent for correction (up to maxRetries).
function forkQueryStrict(prompt, opts = {}) {
  const maxRetries = opts.maxRetries || 2;
  const args = buildForkArgs(opts);

  let currentPrompt = prompt;
  for (let i = 0; i <= maxRetries; i++) {
    const cmdArgs = [...args, currentPrompt];
    let raw;
    try {
      raw = execFileSync('claude', cmdArgs, {
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

    // Parse failed — ask the agent to fix it
    currentPrompt = `Your previous output was not valid JSON. Output was:\n${raw}\n\nReturn ONLY valid JSON. No markdown, no explanation.`;
  }

  throw new Error('agent-hook: failed to get valid JSON after retries');
}

function buildForkArgs(opts) {
  const args = [];
  if (opts.sessionId) {
    args.push('--resume', opts.sessionId, '--fork-session');
  } else {
    args.push('--continue', '--fork-session');
  }
  args.push('--no-session-persistence', '-p', '--output-format', 'json');
  if (opts.agent) args.push('--agent', opts.agent);
  if (opts.schema) args.push('--json-schema', JSON.stringify(opts.schema));
  return args;
}

function tryParseJSON(raw) {
  // Handle claude --output-format json wrapper: extract .result field
  try {
    const wrapper = JSON.parse(raw);
    if (wrapper && typeof wrapper.result === 'string') {
      try { return JSON.parse(wrapper.result); } catch { return tryParseRaw(wrapper.result); }
    }
    if (wrapper && typeof wrapper.result === 'object') return wrapper.result;
    return wrapper;
  } catch { /* not JSON at top level */ }
  return tryParseRaw(raw);
}

function tryParseRaw(raw) {
  // Try extracting JSON from markdown code blocks
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch {} }
  try { return JSON.parse(raw); } catch { return null; }
}

function parseResponse(raw) {
  const result = tryParseJSON(raw);
  return result !== null ? result : raw;
}

function esc(s) { return `'${s.replace(/'/g, "'\\''")}'`; }

module.exports = { query, forkQuery, forkQueryStrict, detectHost };
