"use strict";

const { execSync } = require('child_process');

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

function esc(s) { return `'${s.replace(/'/g, "'\\''")}'`; }

module.exports = { query, detectHost };
