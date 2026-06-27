---
description: "End trace and auto-sketch the work done since trace-start"
argument-hint: "[--name <script-name>]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Draw Trace End

End the trace, diff everything since trace-start, and generate a reusable script.

## Steps

1. Read the marker file:
```!
cat .claude/.draw-trace
```
   If missing, tell the user: "No active trace. Run `/draw-trace-start` first."

2. Determine the script name:
   - Use `--name` from this command's arguments if provided
   - Otherwise use the name saved in the marker
   - If neither, ask the user for a name

3. Gather changes since trace-start:
```!
SAVED_HEAD=<head from marker>
git diff "$SAVED_HEAD"..HEAD 2>/dev/null
git diff 2>/dev/null
git log --oneline "$SAVED_HEAD"..HEAD 2>/dev/null
```

4. If no git changes found, review the conversation since trace-start for file writes/edits made outside git.

5. Generate a script following the standard sketch rules:
   - Only include steps that produce side effects
   - Extract hardcoded values as `@param`
   - Choose bash unless complex data structures needed
   - Add `set -euo pipefail`
   - Add guard clauses for preconditions

6. Write the script to `.claude/scripts/<name>.sh` (or `.py`):
```bash
#!/bin/bash
# @draw
# @name <name>
# @description <one line description>
# @param <name> <type> "<description>" [default]

set -euo pipefail
# ... script body ...
```

7. Make executable:
```!
chmod +x .claude/scripts/<name>.sh
```

8. Clean up marker:
```!
rm .claude/.draw-trace
```

9. Show the generated script and ask if the user wants to edit anything.
