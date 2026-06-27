---
description: "Save a note to the DRAFT cache (reusable context, not a script)"
argument-hint: "[--name <note-name>]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Draft Note

Capture a piece of reusable context (pattern, convention, decision, constraint) as a cached note.

Notes differ from scripts: a script caches an **action** (zero-token subprocess on hit). A note caches **context** (injected into the agent's prompt on hit, saving re-derivation tokens).

## When to use

- A convention the team is following this sprint
- An architecture pattern for the current refactoring effort
- A decision that keeps coming up across conversations
- Anything where the agent wastes tokens re-discovering the same knowledge

## Steps

1. If `--name` is provided, use it. Otherwise, ask the user for a short name.

2. Review the conversation for the knowledge to cache. Identify:
   - The core fact/convention/pattern
   - Any constraints or exceptions
   - When it applies (scope)

3. Write a concise note to `.claude/notes/<name>.md` with this frontmatter:

```markdown
---
draft: note
name: <name>
description: <one-line summary -- used for matching>
---

<note content -- concise, actionable, no fluff>
```

4. Show the user the generated note.

5. Ask if they want to edit anything.

## Rules

- Keep notes short -- they will be injected into context on every match
- One note = one concept. Don't bundle unrelated knowledge.
- Use plain language. The reader is an LLM, not a human scanning docs.
- No code blocks unless the note IS about a specific code pattern.
