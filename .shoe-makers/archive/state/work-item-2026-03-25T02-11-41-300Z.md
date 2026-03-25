# Sync behaviour tree diagrams with actual implementation

skill-type: doc-sync

## What needs to change

The behaviour tree diagram in `README.md` (line 12-24) and `wiki/pages/behaviour-tree.md` (lines 19-30) are both out of date. They're missing nodes that exist in `src/tree/default-tree.ts`.

## Missing nodes

The actual tree in `src/tree/default-tree.ts:97-116` has these nodes that are NOT in the docs:

1. **`[review-loop ≥3?] → Explore`** (line 103) — circuit breaker that prevents infinite review loops. Should appear between `[tests failing?]` and `[unresolved critiques?]`.
2. **`[uncommitted changes?] → Review uncommitted work`** (line 106) — handles uncommitted changes before moving to proactive work. Should appear between `[unreviewed commits?]` and `[inbox messages?]`.
3. **`[dead-code work-item?] → Remove dead code`** (line 109) — special-cases dead-code work items before general work items. Should appear between `[inbox messages?]` and `[work-item.md exists?]`.

## Exact changes required

### README.md (lines 12-24)

Replace the tree diagram with:
```
Selector
├── [tests failing?]         → Fix tests
├── [review-loop ≥3?]        → Break out to explore
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review of previous elf's work
├── [uncommitted changes?]   → Review uncommitted work
├── [inbox messages?]        → Handle human instructions
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [insights exist?]        → Evaluate insight (generous disposition)
├── [innovation tier?]       → Innovate: creative insight from random concept
└── [always true]            → Explore: assess the codebase, write candidates.md
```

### wiki/pages/behaviour-tree.md (lines 19-30)

Replace the tree diagram with:
```
Selector
├── [tests failing?] → Fix tests (direct prompt)
├── [review-loop ≥3?] → Break out to explore (circuit breaker)
├── [unresolved critiques?] → Fix critiques (direct prompt)
├── [unreviewed commits?] → Review adversarially (direct prompt)
├── [uncommitted changes?] → Review uncommitted work (direct prompt)
├── [inbox messages?] → Handle inbox (direct prompt)
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute it
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight (generous disposition)
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

Also update the "Reactive zone" section (lines 33-39) to mention the new reactive conditions:
- **Review-loop circuit breaker** — if the review loop has fired 3+ times, break out to explore to reassess rather than continuing the loop.
- **Uncommitted changes** — review uncommitted work before proceeding with new actions.

## What NOT to change

- Do NOT modify any `src/` files or tests
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the wiki page's frontmatter
- Do NOT rewrite the three-phase orchestration section or other parts of the wiki — only update the tree diagram and reactive zone description
- Keep existing wiki formatting style (note the `last-modified-by` field should remain `user` — do not change it)

## Tests

No code tests needed (doc-sync). Verify by reading the updated files to confirm the tree diagrams match `src/tree/default-tree.ts:97-116`.

## Decision Rationale

Chose the README/wiki doc-sync over test coverage and dead-code candidates because:
- The guidance says "prefer improvement over tests" when invariants are met
- The README is the first thing users see; an inaccurate tree diagram undermines trust
- The review-loop circuit breaker is an important safety feature that should be documented
- This is a quick, high-confidence change with no risk of breaking anything
