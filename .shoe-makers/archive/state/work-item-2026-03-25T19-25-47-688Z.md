# Doc-sync: fix stale tree condition list in functionality.md

skill-type: doc-sync

## Context

`wiki/pages/functionality.md:85` contains an inline summary of tree conditions:

> "tests failing → critiques → stale assessment → inbox → plans → spec gaps → untested code → undocumented code → health → explore"

This doesn't match the actual tree in `src/tree/default-tree.ts:122-142`. The correct order is:

> tests failing → review-loop breaker → critiques → partial work → unreviewed commits → uncommitted changes → inbox → dead-code → work-item → candidates → insights → innovation → explore

## What to change

Update `wiki/pages/functionality.md:85` to accurately reflect the current tree conditions. The line is:

```
- A selector with priority-ordered conditions: tests failing → critiques → stale assessment → inbox → plans → spec gaps → untested code → undocumented code → health → explore
```

Replace with:

```
- A selector with priority-ordered conditions: tests failing → review-loop breaker → critiques → partial work → unreviewed commits → uncommitted changes → inbox → dead-code → work-item → candidates → insights → innovation → explore
```

## Files to modify

- `wiki/pages/functionality.md` — update line 85

## What NOT to change

- Do NOT modify source files
- Do NOT modify other wiki pages
- Do NOT modify invariants

## Decision Rationale

Candidate #2 was chosen over #1 because the init template doesn't manage gitignore (false candidate). #2 fixes a real spec-code inconsistency — the functionality overview page lists completely wrong tree conditions, which could mislead anyone reading the wiki to understand the system.
