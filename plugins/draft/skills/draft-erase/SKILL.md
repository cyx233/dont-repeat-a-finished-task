---
description: "Delete a DRAFT script"
argument-hint: "<script-name>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Bash(rm *)"]
---

# Draft Erase

Delete a solidified script.

1. Locate the script:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find "$ARGUMENTS"
```

2. If found, show the script name and path to the user

3. Confirm with the user before deleting

4. Delete: `rm <path>`

5. Confirm deletion
