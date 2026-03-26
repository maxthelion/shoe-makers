# Candidates

## 1. Sync wiki verification permissions table with code (executor log/ and archive/ paths)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Work-item already exists at `.shoe-makers/state/work-item.md` with full details. `wiki/pages/verification.md` lines 26-27 are missing `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, `bun.lockb` from the executor's canWrite column. Code at `src/verify/permissions.ts:47,62` has all these paths. This closes the gap from critique-2026-03-26-043.

## 2. Replace `as any` casts in prompt-helpers.test.ts with typed fixtures
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` has 16+ `as any` casts. Score 94, #2 worst health file. Typed `Partial<Assessment>` fixtures would catch bugs and raise health.

## 3. Add unit tests for shift-summary computeProcessPatterns()
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` (286 lines) is the most complex file. `computeProcessPatterns()` has no unit tests. The review-loop-breaker tree node depends on it.
