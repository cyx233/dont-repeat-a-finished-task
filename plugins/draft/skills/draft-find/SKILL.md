---
description: "Find a cached DRAFT script or note matching a task description. Use BEFORE starting any file-changing task (refactor, migration, build fix, lint fix, deploy, config change) to check if it was already done before. Also use when the user says \"didn't we do this before\", \"same as last time\", \"reuse\", or describes a task that sounds like a past session."
argument-hint: "<description>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draft Find

Check if this task was already done before — a cached script can replay it, a cached note can provide the context.

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --all
```

Match the user's description against each item's name and description (semantic similarity, not keyword-exact).

Show matches ranked by relevance:
- Type (script / note)
- Name and description
- Usage: `/draft-run <name> [params]` for scripts, `/draft-recall <name>` for notes

No matches → say so, move on.
