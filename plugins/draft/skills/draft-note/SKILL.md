---
description: "Save a note to the DRAFT cache (reusable context, not a script)"
argument-hint: "[--name <note-name>]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Draft Note

Save a piece of reusable context as a note. Scripts cache actions; notes cache knowledge — conventions, patterns, decisions, constraints that stay stable across sessions and should be reused without re-derivation.

## Steps

1. If `--name` provided, use it. Otherwise ask.

2. From the conversation, extract:
   - The core fact/pattern/convention
   - Constraints or exceptions
   - When it applies (scope)

3. Write to `.claude/notes/<name>.md`:

```markdown
---
draft: note
name: <name>
description: <one-line summary — used for matching>
---

<note content — concise, actionable>
```

4. Show the note, ask if they want to edit.

## Rules

- Short — injected into context on every match
- One note = one concept
- Plain language for LLM consumption
- No code blocks unless the note IS about a code pattern
