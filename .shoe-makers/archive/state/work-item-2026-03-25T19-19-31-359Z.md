# Doc-sync: update tick-types.md tree diagram to match code

skill-type: doc-sync

## Context

`wiki/pages/tick-types.md` contains a tree diagram (lines 13-27) that is missing two nodes from the actual implementation in `src/tree/default-tree.ts`:

1. `[partial work?] → Continue partial work` — exists at line 130 of default-tree.ts, between unresolved-critiques and unreviewed-commits
2. `[uncommitted changes?] → Review before committing` — exists at line 132 as `unverified-work`, between unreviewed-commits and inbox-messages

The current wiki diagram shows:
```
├── [unresolved critiques?]  → Fix the flagged issues
├── [unreviewed commits?]    → Review adversarially
├── [uncommitted changes?]   → Review before committing
├── [inbox messages?]        → Read and act
```

But the actual tree order is:
```
├── [unresolved critiques?]  → Fix critiques
├── [partial work?]          → Continue partial work
├── [unreviewed commits?]    → Review adversarially
├── [uncommitted changes?]   → Review before committing
├── [inbox messages?]        → Read and act
```

The wiki has `uncommitted changes` but in the wrong position (before inbox instead of after unreviewed commits). The missing node is `partial work`.

## What to change

Update the tree diagram in `wiki/pages/tick-types.md` (lines 13-27) to match the actual tree in `src/tree/default-tree.ts:122-142`:

```
Selector
├── [tests failing?]         → Fix them
├── [review-loop ≥3?]        → Break out to explore (circuit breaker)
├── [unresolved critiques?]  → Fix the flagged issues
├── [partial work?]          → Continue partial work
├── [unreviewed commits?]    → Review adversarially
├── [uncommitted changes?]   → Review before committing
├── [inbox messages?]        → Read and act
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [insights exist?]        → Evaluate insight (generous disposition)
├── [innovation tier?]       → Innovate: write insight from creative brief
└── [always]                 → Explore: write candidates.md
```

## Files to modify

- `wiki/pages/tick-types.md` — update the tree diagram to include `partial-work` node in correct position

## What NOT to change

- Do NOT modify any source files
- Do NOT modify the tree implementation
- Do NOT change other wiki pages
- Do NOT modify invariants

## Tests

No code changes, so just run `bun test` to confirm nothing broke.

## Decision Rationale

Candidate #2 (tick-types.md tree diagram) was chosen over #1 (archive done plan) because a spec-code inconsistency is more impactful than stale metadata. The tree diagram is a key reference that elves and humans read to understand routing — having it wrong could lead to confusion about expected behaviour. Candidate #3 (test health) is low impact and restricted by skill permissions.
