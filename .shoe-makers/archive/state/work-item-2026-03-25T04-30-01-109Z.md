# Doc-sync: Fix incomplete tree diagrams in architecture.md and verification.md

skill-type: doc-sync

## What to fix

Two wiki pages have tree diagrams missing nodes compared to the actual tree in `src/tree/default-tree.ts`.

### File 1: `wiki/pages/architecture.md` (lines 25-36)

**Current tree (9 nodes):**
```
Selector
├── [tests failing?] → Fix tests (direct)
├── [unresolved critiques?] → Fix critiques (direct)
├── [unreviewed commits?] → Review adversarially (direct)
├── [inbox messages?] → Handle inbox (direct)
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight (generous disposition)
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

**Correct tree (12 nodes, matching `wiki/pages/behaviour-tree.md` and `src/tree/default-tree.ts`):**
```
Selector
├── [tests failing?] → Fix tests (direct)
├── [review-loop ≥3?] → Break out to explore (circuit breaker)
├── [unresolved critiques?] → Fix critiques (direct)
├── [unreviewed commits?] → Review adversarially (direct)
├── [uncommitted changes?] → Review uncommitted work (direct)
├── [inbox messages?] → Handle inbox (direct)
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight (generous disposition)
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

Replace lines 25-36 with the corrected tree. Update `last-modified-by` to `elf`.

### File 2: `wiki/pages/verification.md` (lines 123-134)

**Current tree (9 nodes):**
```
Selector
├── [tests failing?] → Fix them
├── [review loop ≥3?] → Break out to explore
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially (critique)
├── [uncommitted work?] → Review before committing (review)
├── [inbox messages?] → Read and act
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [neither?] → Explore: write candidates.md
```

**Correct tree (12 nodes):**
```
Selector
├── [tests failing?] → Fix them
├── [review loop ≥3?] → Break out to explore
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially (critique)
├── [uncommitted work?] → Review before committing (review)
├── [inbox messages?] → Read and act
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

Note the changes:
1. Added dead-code, insights, innovation-tier nodes
2. Changed `[neither?]` to `[always]` (matches code: `alwaysTrue` function)
3. Changed `├──` on last line to `└──` for correct tree formatting

## Tests

No new tests needed — wiki-only change. Run `bun test` to confirm.

## What NOT to change

- Do NOT modify `src/` code
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify `wiki/pages/behaviour-tree.md` (it's already correct)
- Do NOT restructure the pages beyond the tree diagrams

## Decision Rationale

Candidate 1 was chosen because incomplete tree diagrams in architecture.md (the system overview page) give readers a wrong mental model. Missing the review-loop circuit breaker and dead-code nodes is architecturally significant. Candidates 2-3 are low priority.
