---
description: "List all available DRAW scripts"
argument-hint: ""
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draw Gallery

List all solidified scripts.

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh"
```

Format the output as a table for the user:

| Name | Description | Triggers | Params |
|------|-------------|----------|--------|

If no scripts found, tell the user:
- No scripts yet. Use `/draw-sketch` after completing a task to solidify it.
