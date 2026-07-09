"use strict";

const fs = require('fs');
const path = require('path');

const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

function emit(event, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

function scanCatalog(cwd) {
  const { execSync } = require('child_process');
  try {
    const raw = execSync(`node "${scanScript}" --all`, {
      encoding: 'utf8', timeout: 3000,
      cwd: cwd || process.env.CLAUDE_CWD || process.cwd(),
    }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).flatMap(line => {
      const p = line.split('\t');
      return p.length >= 4 ? [{ type: p[0], name: p[1], path: p[2], desc: p[3] }] : [];
    });
  } catch { return []; }
}

function parseInput() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(input.replace(/^﻿/, ''))); }
      catch (e) { reject(e); }
    });
    process.stdin.on('error', reject);
  });
}

function getModeFile(cwd) {
  return path.join(cwd || process.env.CLAUDE_CWD || process.cwd(), '.claude', '.draft-cache-mode');
}

function getCacheMode(cwd) {
  try { return JSON.parse(fs.readFileSync(getModeFile(cwd), 'utf8'))[process.ppid] || ''; }
  catch { return ''; }
}

function setCacheMode(mode, cwd) {
  let modes = {};
  try { modes = JSON.parse(fs.readFileSync(getModeFile(cwd), 'utf8')); } catch {}
  if (mode) modes[process.ppid] = mode; else delete modes[process.ppid];
  const f = getModeFile(cwd);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(modes));
}

module.exports = { emit, scanCatalog, parseInput, getCacheMode, setCacheMode };
