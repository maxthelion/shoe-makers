# Candidates

## 1. Doc-sync: Fix incomplete tree diagrams in architecture.md and verification.md
**Type**: doc-sync
**Impact**: high
**Reasoning**: `wiki/pages/architecture.md` lines 25-35 shows only 9 tree nodes but the actual tree in `src/tree/default-tree.ts` lines 102-114 has 12. Missing: review-loop breaker (line 103), uncommitted changes/review (line 106), and dead-code (line 109). `wiki/pages/verification.md` lines 123-134 is also missing dead-code, insights, and innovation-tier nodes, and uses imprecise "neither?" instead of "always" for the fallback. `wiki/pages/behaviour-tree.md` already has the correct full tree. These incomplete diagrams give readers an inaccurate mental model of the system — the review-loop circuit breaker is architecturally significant.

## 2. Doc-sync: Fix remaining stale "PRIORITISE tick" in observability.md (if any)
**Type**: doc-sync
**Impact**: low
**Reasoning**: After the last round of fixes, check if any remaining stale terminology exists across all wiki pages. Previous fixes caught most instances but there may be edge cases in pages not previously scanned (e.g. architecture.md, behaviour-tree.md, scheduled-tasks.md).

## 3. Add unit tests for buildInnovatePrompt and buildEvaluateInsightPrompt
**Type**: test-coverage
**Impact**: low
**Reasoning**: These two prompt builders in `src/prompts/three-phase.ts` are only tested indirectly via `generatePrompt()` in `src/__tests__/prompts.test.ts`. All 9 other builders have direct unit tests. Adding direct tests would be consistent but is low priority since indirect coverage exists.
