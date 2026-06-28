---
title: DRAFT — Don't Repeat A Finished Task
inclusion: always
---

# DRAFT — Don't Repeat A Finished Task

A caching layer for agent workflows. Before re-implementing any task, check if it already exists as a cached script or note.

## Rules

1. When a user's task matches a cached script by name or description, RUN that script directly instead of re-implementing the work.
2. When a task matches a cached note, READ that note before proceeding.
3. Do NOT re-derive work that a cached script already handles.
4. Users can invoke `/draft-save` or `/draft-note` to cache work. Do not proactively offer unless the user says "always cache".

## Where to find cached items

- Scripts: files with `@draft` marker in `.claude/scripts/` and `~/.claude/scripts/`
- Notes: files with `draft: note` frontmatter in `.claude/notes/` and `~/.claude/notes/`

## Commands

- `/draft-save` — Save work as a reusable script
- `/draft-note` — Save context as a reusable note
- `/draft-rm <name>` — Delete a cached item
