---
description: "Delete a cached DRAFT script or note"
argument-hint: "<name>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Bash(rm *)"]
---

# Draft Rm

Delete a cached item.

1. Locate as script:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find "$ARGUMENTS"
```

2. Not found → try as note:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find-note "$ARGUMENTS"
```

3. Not found at all → tell user, exit.

4. Found → show name, type, path. Confirm with user before deleting.

5. `rm <path>` → confirm deletion.
