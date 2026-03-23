# Fix README behaviour tree diagram

skill-type: doc-sync

## Context

The behaviour tree diagram in `README.md` (lines 11-20) is outdated. It shows 7 items but the actual tree in `src/tree/default-tree.ts:76-92` has 10 items.

## What's wrong

Current README diagram (lines 11-20):
```
Selector
├── [tests failing?]        → Fix tests
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review of previous elf's work
├── [inbox messages?]        → Handle human instructions
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [neither?]               → Explore: assess the codebase, write candidates.md
```

Issues:
1. Missing `[uncommitted changes?] → Review uncommitted work` (should be between unreviewed-commits and inbox)
2. Missing `[dead-code work-item?] → Remove dead code` (should be between inbox and work-item)
3. `[neither?]` should be `[always true]` to match `alwaysTrue` condition

## What to change

Replace the tree diagram in `README.md` lines 11-20 with:

```
Selector
├── [tests failing?]         → Fix tests
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review of previous elf's work
├── [uncommitted changes?]   → Review uncommitted work
├── [inbox messages?]        → Handle human instructions
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [always true]            → Explore: assess the codebase, write candidates.md
```

This matches `src/tree/default-tree.ts:79-91` exactly.

## Tests

No code tests needed — this is a documentation change. Verify by visual comparison against `src/tree/default-tree.ts`.

## What NOT to change

- Don't change any other part of the README — only the tree diagram
- Don't change `src/tree/default-tree.ts` — the code is correct, the docs are wrong
