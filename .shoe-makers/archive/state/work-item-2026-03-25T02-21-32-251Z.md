# Update tick-types.md tree diagram to match implementation

skill-type: doc-sync

## What needs to change

`wiki/pages/tick-types.md` (lines 13-23) has an outdated behaviour tree diagram missing several nodes that exist in `src/tree/default-tree.ts:97-116`.

## Missing nodes in the tree diagram

The current diagram is missing:
1. **`[review-loop ≥3?] → Break out to explore`** — circuit breaker (between tests failing and unresolved critiques)
2. **`[dead-code work-item?] → Remove dead code`** — special-case dead-code items (between inbox and work-item)
3. **`[insights exist?] → Evaluate insight`** — evaluate creative proposals
4. **`[innovation tier?] → Innovate`** — creative work at innovation tier
5. The fallback should say `[always] → Explore: write candidates.md` not `[neither?] → Explore`

## Exact change required

Replace lines 13-23 (the tree diagram) with:
```
Selector
├── [tests failing?] → Fix them
├── [review-loop ≥3?] → Break out to explore (circuit breaker)
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially
├── [uncommitted changes?] → Review before committing
├── [inbox messages?] → Read and act
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight (generous disposition)
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

## What NOT to change

- Do NOT modify any `src/` files or tests
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the wiki page's frontmatter (keep `last-modified-by: elf`)
- Do NOT rewrite other sections — only update the tree diagram

## Tests

No code tests needed (doc-sync). Verify the updated diagram matches `src/tree/default-tree.ts:97-116`.

## Decision Rationale

Chose wiki doc-sync over dead-code and test-coverage candidates because:
- Guidance says prefer improvement over tests
- The tick-types wiki page is a key spec page that should accurately reflect the implementation
- Quick, safe, no risk of breaking anything
- Completes the doc-sync work started with README.md and behaviour-tree.md
