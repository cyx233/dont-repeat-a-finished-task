---
description: "Start tracing work for automatic sketch at trace-end"
argument-hint: "[--name <script-name>]"
allowed-tools: ["Bash"]
---

# Draft Trace Start

Mark the beginning of a traceable work segment.

## Steps

1. Parse `--name` from arguments (optional, can be provided at trace-end instead)

2. Capture current state:
```!
mkdir -p .claude && cat <<EOF > .claude/.draft-trace
name=${NAME:-}
head=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
timestamp=$(date +%s)
EOF
```

3. Confirm to user:
   - "Trace started. Do your work, then run `/draft-trace-end` to auto-sketch."
   - If `--name` was given, mention it will be used as the script name.
