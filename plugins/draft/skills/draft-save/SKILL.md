---
description: "Save current session work as a reusable bash/python script"
argument-hint: "[--name <script-name>] [--commit <ref>]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Draft Save

Save this session's work as a reusable, controllable script. Next time the same task comes up, `/draft-run` replays it exactly — no re-derivation, no drift.

## Source

- `--commit <ref>`: read `git diff $COMMIT~1..$COMMIT` and generate a script that reproduces that change.
- Otherwise: review what was done in this conversation.

## Extract the action

Identify from the session (or diff):
- **Side effects**: file edits, writes, installs, deploys — the actual work
- **Verification**: test/lint/build that validated the result
- Discard exploration, false starts, retries — only the final working path matters.

## Script rules

1. Only side-effect and verification steps
2. Collapse retries — only the final state matters
3. Extract hardcoded values as `@param`
4. Bash unless complex data structures require python
5. `set -euo pipefail` for bash
6. Guard clauses: preconditions not met → `exit 1` with message
7. End with verification step if one existed

## Output

Write to `.claude/scripts/<name>.sh` (or `.py`):

```bash
#!/bin/bash
# @draft
# @name <name>
# @description <one line>
# @param <name> <type> "<description>" [default]

set -euo pipefail
# ... script body ...
```

Then `chmod +x` the file.

Show the script to the user and ask if they want to edit.
