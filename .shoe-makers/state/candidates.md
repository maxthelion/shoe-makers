# Candidates

## 1. Complete freshAssessment consolidation in shift.test.ts
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `src/__tests__/shift.test.ts:13` defines a local `freshAssessment` that duplicates `test-utils.ts:14`. The `prompts.test.ts` copy is intentionally different (non-zero invariant gaps, lower health score) and should stay. Only `shift.test.ts` has a true duplicate. Saves ~18 lines. Follow-up to commit b95cc8e.

## 2. No other impactful work remaining
**Type**: health
**Impact**: none
**Confidence**: high
**Risk**: low
**Reasoning**: Health 100/100, 0 invariant gaps, 0 findings, 496 tests pass, typecheck clean, README accurate, all findings archived. The codebase is fully green with no spec-code gaps.
