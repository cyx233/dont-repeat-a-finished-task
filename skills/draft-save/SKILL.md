---
description: "Save current session work as a reusable bash/python script"
argument-hint: "[--name <name>] [--commit <ref>]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Draft Save

Save this session's work as a controllable, reusable script.

## Source

- `--commit <ref>`: read `git diff $COMMIT~1..$COMMIT`
- Otherwise: review what was done in this conversation

## What to extract

- Side effects only (file edits, writes, installs, deploys)
- Final state only (collapse retries)
- Verification step at the end if one existed
- Hardcoded values → `@param`

## Output

Pick the language that fits the task. Frontmatter format:

```
# @draft
# @name <name>
# @description <one line>
# @param <name> <type> "<description>" [default]
```

Write to `.claude/scripts/<name>.<ext>`, `chmod +x`.
Show the script, ask if user wants to edit.
