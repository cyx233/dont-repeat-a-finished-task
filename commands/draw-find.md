---
description: "Find a DRAW script matching a task description"
argument-hint: "<description>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draw Find

Search for scripts that match the given description.

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/match.sh" "$ARGUMENTS"
```

Show results ranked by relevance. For each match, show:
- Script name and description
- How to run it: `/draw-stroke <name> [params]`

If no matches, tell the user no existing script covers this task.
