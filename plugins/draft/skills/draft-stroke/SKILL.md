---
description: "Execute a DRAFT script by name"
argument-hint: "<script-name> [params...]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Bash(.claude/scripts/*)", "Bash(~/.claude/scripts/*)"]
---

# Draft Stroke

Execute an existing DRAFT script.

## Steps

1. Parse arguments: first arg is script name, rest are params

2. Locate the script:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find "$1"
```
   Search order: `.claude/scripts/` then `~/.claude/scripts/`

3. If not found, show available scripts and exit

4. If found, show the user:
   - Script name and description
   - Required params and their defaults
   - The command that will be executed

5. Execute:
```!
bash "<script-path>" [params...]
```

6. Report the result (stdout, stderr, exit code)

7. If exit code != 0, explain what went wrong and suggest fixes
