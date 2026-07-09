#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

async function main() {
  const name = process.argv[2];
  const desc = process.argv[3] || '';
  const { embed, INDEX_PATH, BIN_PATH, VECTORS_DIR, DIM } = require('./embedder');

  if (!name) {
    // Full rebuild
    const { execSync } = require('child_process');
    const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');
    const raw = execSync(`node "${scanScript}" --all`, { encoding: 'utf8' }).trim();
    if (!raw) { console.log('No catalog items found.'); return; }

    const catalog = raw.split('\n').filter(Boolean).map(line => {
      const p = line.split('\t');
      return p.length >= 4 ? { name: p[1], desc: p[3] } : null;
    }).filter(Boolean);

    const index = {};
    const vectors = {};
    for (let i = 0; i < catalog.length; i++) {
      const item = catalog[i];
      const text = `${item.name.replace(/-/g, ' ')} ${item.desc}`;
      vectors[item.name] = await embed(text);
      index[item.name] = i;
      process.stderr.write(`  embedded: ${item.name}\n`);
    }

    fs.mkdirSync(VECTORS_DIR, { recursive: true });
    const buf = Buffer.alloc(catalog.length * DIM * 4);
    const view = new Float32Array(buf.buffer);
    for (const [n, slot] of Object.entries(index)) {
      view.set(vectors[n], slot * DIM);
    }
    fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
    fs.writeFileSync(BIN_PATH, buf);
    console.log(`Wrote ${catalog.length} vectors to ${VECTORS_DIR}`);
    return;
  }

  // Incremental: embed one item, append to store
  let index = {};
  try { index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')); } catch {}

  const slot = name in index ? index[name] : Object.keys(index).length;
  index[name] = slot;

  const vec = await embed(`${name.replace(/-/g, ' ')} ${desc}`);
  const totalSlots = Math.max(slot + 1, Object.keys(index).length);
  let buf;
  try { buf = Buffer.from(fs.readFileSync(BIN_PATH)); } catch { buf = Buffer.alloc(0); }

  // Extend buffer if needed
  const needed = totalSlots * DIM * 4;
  if (buf.length < needed) {
    const newBuf = Buffer.alloc(needed);
    buf.copy(newBuf);
    buf = newBuf;
  }

  const view = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  view.set(vec, slot * DIM);

  fs.mkdirSync(VECTORS_DIR, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
  fs.writeFileSync(BIN_PATH, buf);
  process.stderr.write(`  embedded: ${name}\n`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
