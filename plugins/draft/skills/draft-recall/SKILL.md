---
description: "Recall a cached note and apply its context to the current task"
argument-hint: "<note-name>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Read"]
---

# Draft Recall

Load a cached note into context and apply it.

## Steps

1. Locate the note:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find-note "$ARGUMENTS"
```

2. If not found, list available notes and tell the user.

3. If found, read the note file and display its content.

4. Refresh timestamp (keeps it hot in cache):
```!
touch "<note-path>"
```

5. Apply the note's context to the current task. The note content should guide your subsequent actions in this conversation.

6. Confirm to the user which note was loaded.
