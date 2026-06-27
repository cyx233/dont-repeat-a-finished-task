---
description: "Find a cached DRAFT script or note matching a task description. Use BEFORE starting any file-changing task (refactor, migration, build fix, lint fix, deploy, config change) to check if it was already done before. Also use when the user says \"didn't we do this before\", \"same as last time\", \"reuse\", or describes a task that sounds like a past session."
argument-hint: "<description>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draft Find

Search for cached items (scripts and notes) that match the given description.

1. Get the full catalog:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --all
```

2. Compare the user's description against each item's name and description. Use your judgment to determine relevance — exact keyword match is not required, semantic similarity counts.

3. Show results ranked by relevance. For each match, show:
   - Type (script or note)
   - Name and description
   - How to use it: `/draft-run <name> [params]` for scripts, `/draft-recall <name>` for notes

4. If nothing seems relevant, tell the user no cached item covers this task.
