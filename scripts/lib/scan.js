#!/usr/bin/env node
// Node.js equivalent of scan.sh — cross-platform scanner for @draft scripts and notes
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

function getDirs(subdir) {
  const dirs = [];
  const local = path.join(process.cwd(), ".claude", subdir);
  const global = path.join(os.homedir(), ".claude", subdir);
  if (fs.existsSync(local) && fs.statSync(local).isDirectory()) dirs.push(local);
  if (fs.existsSync(global) && fs.statSync(global).isDirectory()) dirs.push(global);
  return dirs;
}

function parseScriptFrontmatter(filePath, content) {
  content = content || fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  let name = "";
  let description = "";
  let triggers = "";

  for (const line of lines) {
    if (line === "# @draft") continue;
    if (line.startsWith("# @name ")) { name = line.slice("# @name ".length); continue; }
    if (line.startsWith("# @description ")) { description = line.slice("# @description ".length); continue; }
    if (line.startsWith("# @triggers ")) { triggers = line.slice("# @triggers ".length); continue; }
    if (line.startsWith("# @param ")) continue;
    if (line.startsWith("# @requires ")) continue;
    if (line.startsWith("#!")) continue;
    if (line.startsWith("#")) continue;
    break;
  }

  if (name) return { name, path: filePath, description, triggers };
  return null;
}

function parseNoteFrontmatter(filePath, content) {
  content = content || fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  let name = "";
  let description = "";
  let inFrontmatter = false;

  for (const line of lines) {
    if (line === "---") {
      if (inFrontmatter) break;
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line.startsWith("name: ")) name = line.slice("name: ".length);
      else if (line.startsWith("description: ")) description = line.slice("description: ".length);
    }
  }

  if (name) return { name, path: filePath, description };
  return null;
}

function scanScripts() {
  const results = [];
  for (const dir of getDirs("scripts")) {
    for (const entry of fs.readdirSync(dir)) {
      const filePath = path.join(dir, entry);
      if (!fs.statSync(filePath).isFile()) continue;
      const content = fs.readFileSync(filePath, "utf8");
      if (!content.split(/\r?\n/).slice(0, 5).join("\n").includes("@draft")) continue;
      const parsed = parseScriptFrontmatter(filePath, content);
      if (parsed) results.push(parsed);
    }
  }
  return results;
}

function scanNotes() {
  const results = [];
  for (const dir of getDirs("notes")) {
    for (const entry of fs.readdirSync(dir)) {
      const filePath = path.join(dir, entry);
      if (!fs.statSync(filePath).isFile()) continue;
      const content = fs.readFileSync(filePath, "utf8");
      if (!content.split(/\r?\n/).slice(0, 5).join("\n").includes("draft: note")) continue;
      const parsed = parseNoteFrontmatter(filePath, content);
      if (parsed) results.push(parsed);
    }
  }
  return results;
}

// CLI
const args = process.argv.slice(2);
const mode = args[0] || "scripts";

switch (mode) {
  case "--all":
    for (const s of scanScripts()) {
      process.stdout.write(`script\t${s.name}\t${s.path}\t${s.description}\t${s.triggers || ''}\n`);
    }
    for (const n of scanNotes()) {
      process.stdout.write(`note\t${n.name}\t${n.path}\t${n.description}\t\n`);
    }
    break;

  case "--notes":
    for (const n of scanNotes()) {
      process.stdout.write(`${n.name}\t${n.path}\t${n.description}\n`);
    }
    break;

  case "--find": {
    const target = args[1] || "";
    for (const s of scanScripts()) {
      if (s.name === target) {
        process.stdout.write(s.path + "\n");
        process.exit(0);
      }
    }
    process.exit(1);
    break;
  }

  case "--find-note": {
    const target = args[1] || "";
    for (const n of scanNotes()) {
      if (n.name === target) {
        process.stdout.write(n.path + "\n");
        process.exit(0);
      }
    }
    process.exit(1);
    break;
  }

  case "--find-any": {
    const target = args[1] || "";
    for (const s of scanScripts()) {
      if (s.name === target) { process.stdout.write(`script\t${s.path}\n`); process.exit(0); }
    }
    for (const n of scanNotes()) {
      if (n.name === target) { process.stdout.write(`note\t${n.path}\n`); process.exit(0); }
    }
    process.exit(1);
    break;
  }

  default:
    // No flag = list scripts
    for (const s of scanScripts()) {
      process.stdout.write(`${s.name}\t${s.path}\t${s.description}\n`);
    }
    break;
}
