skill-type: doc-sync

# Sync README.md behaviour tree diagram with actual tree

## Wiki Spec

`wiki/pages/behaviour-tree.md` (lines 19-34) documents the full tree:

```
Selector
├── [tests failing?]                  → Fix tests (direct prompt)
├── [review-loop ≥3 + candidates?]    → Prioritise (consume existing candidates)
├── [review-loop ≥3?]                 → Break out to explore (circuit breaker)
├── [unresolved critiques?]           → Fix critiques (direct prompt)
├── [partial work?]                   → Continue partial work (direct prompt)
├── [unreviewed commits?]             → Review adversarially (direct prompt)
├── [uncommitted changes?]            → Review uncommitted work (direct prompt)
├── [inbox messages?]                 → Handle inbox (direct prompt)
├── [dead-code work-item?]            → Remove dead code
├── [work-item.md exists?]            → Execute it
├── [candidates.md exists?]           → Prioritise: pick one, write work-item.md
├── [insights exist?]                 → Evaluate insight (generous disposition)
├── [innovation tier?]                → Innovate: write insight from creative brief
└── [always]                          → Explore: write candidates.md
```

## Current Code

`src/tree/default-tree.ts` (lines 103-124) defines the tree with these nodes in order:
1. tests-failing → fix-tests
2. review-loop-with-candidates → prioritise
3. review-loop-breaker → explore
4. unresolved-critiques → fix-critique
5. partial-work → continue-work
6. unreviewed-commits → critique
7. unverified-work → review
8. inbox-messages → inbox
9. dead-code-work → dead-code
10. work-item → execute-work-item
11. candidates → prioritise
12. insights → evaluate-insight
13. innovation-tier → innovate
14. explore → explore

## What to Build

Update `README.md` lines 12-24 to match the actual tree. The current README tree is:

```
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
├── [innovation tier?]       → Innovate: creative brief with Wikipedia lens
└── [always true]            → Explore: assess the codebase, write candidates.md
```

Changes needed:
1. Split `[review-loop ≥3?]` into two lines: `[review-loop ≥3 + candidates?] → Prioritise (consume candidates)` and `[review-loop ≥3?] → Break out to explore`
2. Add `[partial work?] → Continue partial work` after `[unresolved critiques?]`
3. Keep descriptions concise like the existing style

The updated tree should be:

```
Selector
├── [tests failing?]                  → Fix tests
├── [review-loop ≥3 + candidates?]   → Prioritise (consume candidates)
├── [review-loop ≥3?]                → Break out to explore
├── [unresolved critiques?]          → Fix issues flagged by reviewer
├── [partial work?]                  → Continue partial work
├── [unreviewed commits?]            → Adversarial review of previous elf's work
├── [uncommitted changes?]           → Review uncommitted work
├── [inbox messages?]                → Handle human instructions
├── [dead-code work-item?]           → Remove dead code
├── [work-item.md exists?]           → Execute the detailed work item
├── [candidates.md exists?]          → Prioritise: pick one, write work-item.md
├── [insights exist?]                → Evaluate insight (generous disposition)
├── [innovation tier?]               → Innovate: creative brief with Wikipedia lens
└── [always true]                    → Explore: assess the codebase, write candidates.md
```

## Patterns to Follow

- Match the existing README formatting style (indentation with box-drawing chars)
- Keep descriptions short and readable
- Don't change any other content in the README

## Tests to Write

No tests needed — this is a documentation-only change. Run `bun test` to ensure nothing breaks.

## What NOT to Change

- Do NOT modify any source code files
- Do NOT modify wiki pages (the wiki is already correct)
- Do NOT modify `.shoe-makers/invariants.md`
- Only change the tree diagram section in `README.md` (lines 12-24)

## Decision Rationale

Candidate #1 (README tree sync) was chosen because:
- It's the project's public face — visitors see the README first
- The discrepancy is concrete and verifiable
- The fix is low-risk (documentation only)
- The wiki page is already correct, so the README just needs to match
- Candidates #2 (TypeScript v6) requires more investigation and carries regression risk
- Candidates #3 and #4 are lower impact (internal findings and test coverage for already-working code)
- Candidate #5 is trivial cleanup
