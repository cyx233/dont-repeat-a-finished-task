---
description: "Evaluate whether this session's work is worth caching"
allowed-tools: ["AskUserQuestion", "Skill"]
---

# Draft Auto-Cache

Evaluate silently whether this session produced work worth caching. Do NOT output any text to the user unless you decide to offer caching.

If the session was trivial (one-off Q&A, already-cached work, simple config, mode activation): do nothing, just stop.

If it produced (A) a repeatable action worth scripting or (B) reusable knowledge/context worth noting: ask the user using AskUserQuestion:

```json
{"questions":[{"question":"Cache this session's work for future reuse?","header":"Draft","options":[{"label":"/draft-save","description":"Save as repeatable script (bash/python command)"},{"label":"/draft-note","description":"Save as reusable context (architecture, conventions, exploration findings)"},{"label":"Skip","description":"Nothing worth caching"}],"multiSelect":false}]}
```

If user picks /draft-note or /draft-save, invoke that skill with --name set to a lowercase-kebab-case slug (2-4 words from task intent). If Skip or no action needed, just stop.
