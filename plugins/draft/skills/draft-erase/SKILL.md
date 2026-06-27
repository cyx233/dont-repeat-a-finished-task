---
description: "Delete a cached DRAFT script or note"
argument-hint: "<name>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Bash(rm *)"]
---

# Draft Erase

Delete a cached item (script or note).

1. Try to locate as script:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find "$ARGUMENTS"
```

2. If not found as script, try as note:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find-note "$ARGUMENTS"
```

3. If found, show the item name, type, and path to the user

4. Confirm with the user before deleting

5. Delete: `rm <path>`

6. Confirm deletion
