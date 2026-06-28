// draft-runtime.js — shared helpers for draft hooks
"use strict";

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

/**
 * emit(event, text) — write hook output adapted per host environment.
 */
function emit(event, text) {
  // ponytail: two formats — JSON envelope (Copilot, Codex, SubagentStart) vs raw stdout
  if (isCopilot || isCodex || event === 'SubagentStart') {
    const payload = isCopilot
      ? { additionalContext: text }
      : { hookSpecificOutput: { hookEventName: event, additionalContext: text } };
    process.stdout.write(JSON.stringify(payload));
  } else {
    process.stdout.write(text);
  }
}

/**
 * scanCatalog(cwd) — run scan.js --all, return parsed items array.
 * Returns [] on failure/empty.
 */
function scanCatalog(cwd) {
  let raw = '';
  try {
    raw = execSync(`node "${scanScript}" --all`, {
      encoding: 'utf8',
      timeout: 3000,
      cwd: cwd || process.env.CLAUDE_CWD || process.cwd(),
    }).trim();
  } catch (e) {
    return [];
  }
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).flatMap(line => {
    const parts = line.split('\t');
    if (parts.length >= 4) {
      return [{ type: parts[0], name: parts[1], path: parts[2], desc: parts[3], triggers: parts[4] || '', params: parts[5] || '' }];
    }
    return [];
  });
}

/**
 * parseInput() — read stdin JSON, strip BOM. Resolves with parsed object.
 * Rejects on bad/missing input (caller should catch and exit silently).
 */
function parseInput() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(input.replace(/^﻿/, '')));
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.on('error', reject);
  });
}

// ponytail: session-level cache mode — {pid: "never"|"always"} in one JSON file
function getModeFile(cwd) {
  return path.join(cwd || process.env.CLAUDE_CWD || process.cwd(), '.claude', '.draft-cache-mode');
}

function readModes(cwd) {
  try { return JSON.parse(fs.readFileSync(getModeFile(cwd), 'utf8')); } catch { return {}; }
}

function pidAlive(pid) {
  try { process.kill(Number(pid), 0); return true; } catch { return false; }
}

function getCacheMode(cwd) {
  return readModes(cwd)[process.ppid] || '';
}

function setCacheMode(mode, cwd) {
  const modes = readModes(cwd);
  for (const pid of Object.keys(modes)) {
    if (!pidAlive(pid)) delete modes[pid];
  }
  if (mode) modes[process.ppid] = mode;
  else delete modes[process.ppid];
  const f = getModeFile(cwd);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(modes));
}

function autoCache() {
  parseInput().then(data => {
    if (getCacheMode(data.cwd) === 'never') process.exit(0);
    // ponytail: prevent rewake-of-rewake — lockfile with 60s TTL
    const lock = path.join(data.cwd || process.cwd(), '.claude', '.draft-rewake-lock');
    try {
      const st = fs.statSync(lock);
      if (Date.now() - st.mtimeMs < 60000) process.exit(0);
    } catch {}
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    fs.writeFileSync(lock, '');
    setCacheMode('', data.cwd);
    console.log('{"draft":"auto-cache"}');
  }).catch(() => process.exit(0));
}

module.exports = { emit, scanCatalog, parseInput, getCacheMode, setCacheMode, autoCache };
