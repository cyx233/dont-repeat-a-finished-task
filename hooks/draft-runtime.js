// draft-runtime.js — shared helpers for draft hooks
"use strict";

const { execSync } = require('child_process');
const path = require('path');

const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

/**
 * emit(event, text) — write hook output adapted per host environment.
 * event: 'SessionStart' | 'SubagentStart' | 'UserPromptSubmit'
 */
function emit(event, text) {
  if (isCopilot) {
    process.stdout.write(JSON.stringify({ additionalContext: text }));
  } else if (isCodex) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: event, additionalContext: text },
    }));
  } else if (event === 'SubagentStart') {
    // Native Claude: SubagentStart needs JSON envelope or context is dropped
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: event, additionalContext: text },
    }));
  } else {
    // Native Claude: SessionStart/UserPromptSubmit accept raw stdout
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
  return raw.split('\n').filter(Boolean).map(line => {
    const parts = line.split('\t');
    if (parts.length >= 4) {
      return { type: parts[0], name: parts[1], path: parts[2], desc: parts[3] };
    }
    return null;
  }).filter(Boolean);
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

module.exports = { emit, scanCatalog, parseInput };
