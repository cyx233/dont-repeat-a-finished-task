---
description: "List all cached DRAFT scripts and notes"
argument-hint: ""
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)"]
---

# Draft List

List all cached items (scripts and notes).

```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --all
```

Format the output as two tables:

**Scripts** (actions — zero-token execution via /draft-run):

| Name | Description | Params |
|------|-------------|--------|

**Notes** (context — injected on recall via /draft-recall):

| Name | Description |
|------|-------------|

If nothing found, tell the user:
- No cached items yet. Use `/draft-save` (action) or `/draft-note` (context) to cache work.
