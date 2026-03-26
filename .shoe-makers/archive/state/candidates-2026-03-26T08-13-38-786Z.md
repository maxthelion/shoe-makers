# Candidates

## 1. Execute pending doc-sync work-item (wiki permissions table update)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: A work-item already exists at `.shoe-makers/state/work-item.md` for syncing `wiki/pages/verification.md` lines 26-27 with `src/verify/permissions.ts:47,62`. The executor should update the wiki permissions table to add `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, `bun.lockb` to the executor's canWrite column. This closes the spec-code gap from critique-2026-03-26-043.

## 2. Replace `as any` casts in prompt-helpers.test.ts with typed fixtures
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` has 16+ `as any` casts across lines 30-231. Score 94, #2 worst health file. Typed `Partial<Assessment>` fixtures would improve type safety and raise health score.

## 3. Add unit tests for shift-summary computeProcessPatterns()
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` (286 lines) most complex file. `computeProcessPatterns()` untested. Review-loop-breaker tree node depends on its output.
