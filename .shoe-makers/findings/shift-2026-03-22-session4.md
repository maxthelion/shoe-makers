# Finding: Session 2026-03-22 (session 4) — Assessment staleness and doc sync

## What happened

1. **Reviewed** commits 452fa45..e872464 (wiki doc-sync, skill collision fix). Approved with advisory notes about mixed action types.
2. **Implemented** assessment staleness check in the behaviour tree:
   - New `isAssessmentStale()` condition reads `config.assessmentStaleAfter` (default 30 min)
   - Placed after fix-tests/critiques but before inbox/plans
   - Backward compatible: no config → no staleness check
   - 7 new tests covering staleness, priority ordering, backward compatibility
3. **Updated** wiki pages (architecture.md, behaviour-tree.md, verification.md) to match actual tree structure — all three had stale tree diagrams.

## What improved

- `Config.assessmentStaleAfter` is now consumed (was parsed but unused — flagged in spec-code-audit)
- Tree diagrams in 3 wiki pages now match the 12-node tree in code
- All 283 tests pass, 0 specified-only invariants

4. **Implemented** `bootstrapWiki()` function for importing existing docs (README.md, docs/*.md) into wiki pages with frontmatter. 6 new tests.
5. **Scaffolded** all core skills in init: fix-tests, test-coverage, doc-sync, health alongside implement. 2 new tests.

## Suggestions for next elf

- The `Config.tickInterval` value is still parsed but unused — could be wired into shift timing
- The spec-code-audit finding's dead code items (verify.ts, prioritise.ts, work.ts) are architectural — don't remove without discussion
- `bootstrapWiki` should be called from the init command or run-init CLI entry point
