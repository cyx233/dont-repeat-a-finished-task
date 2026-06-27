# DRAFT — Don't Repeat A Finished Task

A caching layer for agent workflows.

## The Problem: Three Storage Tiers, One Gap

```
Tier        Analogy       Lifetime        Token cost per use
----------- ------------- --------------- -------------------
Harness     Disk          Permanent       Zero (always loaded)
DRAFT       CPU cache     Auto-evicting   Zero (script) / Low (note)
Memory      Registers     Per-convo       High (re-parsed, re-derived)
```

DRAFT caches two kinds of things:

| Type | Caches | On hit | Example |
|------|--------|--------|---------|
| **Script** | An action | Zero tokens (subprocess) | "sort imports and lint" |
| **Note** | A context | Low tokens (injected, no re-derivation) | "we're using X pattern this sprint" |

Both auto-evict when cold (30-day TTL).

## How It Works

- **Write**: Agent finishes a response with file changes → Stop hook triggers asyncRewake → agent silently calls `/draft-save` or `/draft-note`. Zero user noise.
- **Read**: SessionStart injects a one-line hint when cache is non-empty. Agent uses `/draft-find` before file-changing tasks.
- **Manual**: `/draft-save`, `/draft-note`, `/draft-run`, `/draft-recall`, `/draft-find`, `/draft-list`, `/draft-rm`

## Install

```bash
claude plugin marketplace add cyx233/dont-repeat-a-finished-task
claude plugin install draft
```

## Uninstall

```bash
claude plugin uninstall draft
claude plugin marketplace remove dont-repeat-a-finished-task
```

## License

MIT
