---
description: "Run a cached DRAFT script by name"
argument-hint: "<script-name> [params...]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/lib/*)", "Bash(.claude/scripts/*)", "Bash(~/.claude/scripts/*)"]
---

# Draft Run

Replay a cached script — exact, controllable re-execution of a previous action.

## Steps

1. Parse arguments: first = script name, rest = params.

2. Locate:
```!
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.sh" --find "$1"
```

3. Not found → list available scripts, exit.

4. Found → show name, description, params, and the command to execute.

5. Execute:
```!
bash "<script-path>" [params...]
```

6. Refresh timestamp:
```!
touch "<script-path>"
```

7. Report result. If exit != 0, explain and suggest fixes.
