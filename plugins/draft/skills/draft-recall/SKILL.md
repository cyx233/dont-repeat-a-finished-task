---
description: "Recall a cached note and apply its context to the current task"
argument-hint: "<note-name>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Read"]
---

# Draft Recall

Load a cached note into context — reuse stored knowledge without re-deriving it.

## Steps

1. Locate:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find-note "$ARGUMENTS"
```

2. Not found → list available notes, exit.

3. Found → read and display the note content.

4. Refresh timestamp:
```!
touch "<note-path>"
```

5. Apply the note's context to subsequent actions in this conversation.
