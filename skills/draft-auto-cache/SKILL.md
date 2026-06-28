---
description: "Evaluate whether this session's work is worth caching"
argument-hint: "--mode <ask|always>"
allowed-tools: ["AskUserQuestion", "Skill", "Bash"]
---

# Draft Auto-Cache

Evaluate silently whether this session produced work worth caching. Do NOT output any text to the user unless you decide to offer caching.

If the session was trivial (one-off Q&A, already-cached work, simple config, mode activation): do nothing, just stop.

If it produced cacheable work, determine the type yourself:
- **Script**: repeatable action (build fix, refactor, migration, multi-step command sequence)
- **Note**: reusable context (architecture decisions, conventions, exploration findings)

## If `--mode always`

Skip asking. Directly invoke `/draft-save` or `/draft-note` based on your determination with --name set to a lowercase-kebab-case slug. If trivial, still skip.

## If `--mode ask` (default)

Ask the user:

```json
{"questions":[{"question":"Cache this session's work?","header":"Draft","options":[{"label":"Yes","description":"<brief description of what you'll cache as script or note>"},{"label":"No","description":"Skip this time"},{"label":"Always","description":"Always cache without asking from now on"},{"label":"Never","description":"Disable auto-cache for this project"}],"multiSelect":false}]}
```

- **Yes**: invoke `/draft-save` or `/draft-note` (based on your determination) with --name set to a lowercase-kebab-case slug (2-4 words from task intent).
- **No**: do nothing, just stop.
- **Always**: run `node -e "require('${CLAUDE_PLUGIN_ROOT}/hooks/draft-runtime').setCacheMode('always', '$(pwd)')"`, then invoke `/draft-save` or `/draft-note` as above.
- **Never**: run `node -e "require('${CLAUDE_PLUGIN_ROOT}/hooks/draft-runtime').setCacheMode('never', '$(pwd)')"` then stop.
