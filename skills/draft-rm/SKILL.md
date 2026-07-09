---
description: "Delete a cached DRAFT script or note"
argument-hint: "<name>"
allowed-tools: ["Bash", "Read"]
---

# Draft Rm

Delete a cached item.

1. Locate:
```!
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/scan.js" --find-any "$ARGUMENTS"
```

2. Not found → tell user, exit.
3. Found → show name, type, path. Confirm before deleting.
4. `rm <path>`
5. Remove from vector index:
```!
node -e "const fs=require('fs'),d=require('os').homedir()+'/.claude/.draft-vectors',p=d+'/index.json';try{const idx=JSON.parse(fs.readFileSync(p,'utf8'));delete idx['$ARGUMENTS'];fs.writeFileSync(p,JSON.stringify(idx))}catch{}"
```
