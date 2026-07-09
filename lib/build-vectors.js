#!/usr/bin/env node
"use strict";

const fs = require('fs');

async function main() {
  const name = process.argv[2];
  const desc = process.argv[3] || '';
  if (!name) {
    // Full rebuild (no args)
    const { execSync } = require('child_process');
    const path = require('path');
    const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');
    const raw = execSync(`node "${scanScript}" --all`, { encoding: 'utf8' }).trim();
    if (!raw) { console.log('No catalog items found.'); return; }

    const catalog = raw.split('\n').filter(Boolean).map(line => {
      const p = line.split('\t');
      return p.length >= 4 ? { name: p[1], desc: p[3] } : null;
    }).filter(Boolean);

    const { embed, VECTORS_PATH } = require('./embedder');
    const vectors = {};
    for (const item of catalog) {
      vectors[item.name] = Array.from(await embed(`${item.name.replace(/-/g, ' ')} ${item.desc}`));
      process.stderr.write(`  embedded: ${item.name}\n`);
    }
    fs.mkdirSync(require('path').dirname(VECTORS_PATH), { recursive: true });
    fs.writeFileSync(VECTORS_PATH, JSON.stringify(vectors));
    console.log(`Wrote ${Object.keys(vectors).length} vectors to ${VECTORS_PATH}`);
    return;
  }

  // Incremental: embed one item, merge into existing index
  const { embed, VECTORS_PATH } = require('./embedder');
  let vectors = {};
  try { vectors = JSON.parse(fs.readFileSync(VECTORS_PATH, 'utf8')); } catch {}

  vectors[name] = Array.from(await embed(`${name.replace(/-/g, ' ')} ${desc}`));
  fs.mkdirSync(require('path').dirname(VECTORS_PATH), { recursive: true });
  fs.writeFileSync(VECTORS_PATH, JSON.stringify(vectors));
  process.stderr.write(`  embedded: ${name}\n`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
