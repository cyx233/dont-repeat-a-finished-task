---
description: "List all available DRAFT scripts"
argument-hint: ""
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draft Gallery

List all solidified scripts.

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh"
```

Format the output as a table for the user:

| Name | Description | Params |
|------|-------------|--------|

If no scripts found, tell the user:
- No scripts yet. Use `/draft-sketch` after completing a task to solidify it.
