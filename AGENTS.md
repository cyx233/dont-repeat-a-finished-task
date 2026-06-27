# DRAFT — Don't Repeat A Finished Task

A caching layer for agent workflows. Scripts and notes are stored in `.claude/scripts/` and `.claude/notes/`.

## Rules

1. When a user's task matches a cached script by name or description, RUN that script directly instead of re-implementing the work.
2. When a task matches a cached note, READ that note before proceeding.
3. After completing a repeatable file-changing task that has no cached script, offer to save it.
4. Do NOT re-derive work that a cached script already handles.

## Finding cached items

- Scripts: look for files with `@draft` marker in `.claude/scripts/` and `~/.claude/scripts/`
- Notes: look for files with `draft: note` frontmatter in `.claude/notes/` and `~/.claude/notes/`
