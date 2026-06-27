---
description: "Find a DRAW script matching a task description"
argument-hint: "<description>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draw Find

Search for scripts that match the given description.

1. Get the full script catalog:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh"
```

2. Compare the user's description against each script's name and description. Use your judgment to determine relevance — exact keyword match is not required, semantic similarity counts.

3. Show results ranked by relevance. For each match, show:
   - Script name and description
   - How to run it: `/draw-stroke <name> [params]`

4. If no scripts seem relevant, tell the user no existing script covers this task.
