# Candidates

## 1. Execute pending doc-sync work-item (wiki permissions table update)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Work-item exists at `.shoe-makers/state/work-item.md`. Updates `wiki/pages/verification.md` lines 26-27 to match `src/verify/permissions.ts:47,62`. Blocked by review-loop-breaker this shift — will execute next shift.

## 2. Replace `as any` casts in prompt-helpers.test.ts with typed fixtures
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` 16+ `as any` casts. Score 94. Typed `Partial<Assessment>` fixtures improve safety.

## 3. Add unit tests for shift-summary computeProcessPatterns()
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` most complex file. `computeProcessPatterns()` untested. Review-loop-breaker depends on it.
