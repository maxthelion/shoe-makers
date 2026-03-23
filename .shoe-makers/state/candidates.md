# Candidates

The codebase is at peak health: 100/100 health score, 0 specified-only, 0 untested, 0 unspecified invariants, 496 tests passing. No urgent work remaining.

## 1. Consolidate test helper duplication across test files
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: Multiple test files define similar helpers like `emptyBlackboard()`, `makeState()`, `freshAssessment`. These could be extracted to a shared `src/__tests__/test-utils.ts` module. However, the health score is already 100/100 and the duplication aids test readability. Very low priority.

## 2. Review and archive stale findings
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: There are 178 findings accumulated. Many are from previous sessions and already marked resolved. A cleanup pass could archive old resolved findings to reduce clutter. However, the protocol says findings should be preserved for the review trail.

## 3. No-op — codebase is fully green
**Type**: health
**Impact**: none
**Confidence**: high
**Risk**: none
**Reasoning**: All metrics are at their best: health 100, invariants clean, tests green. The most productive use of remaining time is to push the branch and let humans review.
