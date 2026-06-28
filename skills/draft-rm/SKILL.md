---
description: "Delete a cached DRAFT script or note"
argument-hint: "<name>"
allowed-tools: ["Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Bash(rm *)"]
---

# Draft Rm

Delete a cached item.

1. Locate:
```!
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.js" --find "$ARGUMENTS"
```

2. Not found → try note:
```!
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.js" --find-note "$ARGUMENTS"
```

3. Not found → tell user, exit.
4. Found → show name, type, path. Confirm before deleting.
5. `rm <path>`
