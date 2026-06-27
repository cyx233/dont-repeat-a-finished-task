---
description: "Save current session work as a reusable bash/python script"
argument-hint: "[--name <script-name>] [--commit <ref>]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Draft Save

You just helped the user complete a task. Now save that work as a reusable script.

## If --commit is provided

Read the git diff for that commit:
```
git diff $COMMIT~1..$COMMIT
```
Then generate a script that reproduces that change.

## Otherwise (default: current session)

Review what you did in this conversation. Identify:
- **Core actions**: commands that produced side effects (file edits, writes, builds)
- **Verification steps**: test/lint/build commands that validate correctness
- **Discard**: exploration (reads, greps that didn't lead to action), false starts, retries

## Script generation rules

1. Only include steps that produce side effects or verify results
2. Collapse retries — if you edited a file 3 times, only the final state matters
3. Extract hardcoded values as `@param` (file paths, patterns, names, text content)
4. Choose bash unless the logic requires complex data structures (then python)
5. Add `set -euo pipefail` for bash scripts
6. Add guard clauses: if preconditions aren't met, `exit 1` with a clear message
7. End with a verification step if one existed (e.g. run tests)

## Output format

Write the script to `.claude/scripts/<name>.sh` (or `.py`) with this frontmatter:

```bash
#!/bin/bash
# @draft
# @name <name>
# @description <one line description>
# @param <name> <type> "<description>" [default]

set -euo pipefail
# ... script body ...
```

## After writing

1. Show the user the generated script
2. Ask if they want to edit anything (params, triggers, logic)
3. Make it executable: `chmod +x .claude/scripts/<name>.sh`
