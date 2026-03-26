# Candidates

## 1. Sync wiki verification permissions table with code (log/, archive/, config.yaml, package.json paths)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` lines 26-27 still show the old executor canWrite lists. The code in `src/verify/permissions.ts:47,62` includes `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, `bun.lockb` — none of which appear in the wiki table. This was identified in critique-2026-03-26-043 and a work-item already exists at `.shoe-makers/state/work-item.md` with full details. The prioritise elf should consume that existing work-item rather than creating a new one.

## 2. Replace `as any` casts in prompt-helpers.test.ts with typed test fixtures
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` has 16+ `as any` type assertions (lines 30, 43, 57, 71, 77, 86, 107, 119, 127, 135, 153, 170, 184, 204, 218, 231). This is the #2 worst health file at score 94. Replacing these with properly typed `Partial<Assessment>` fixtures would improve type safety and raise the file's health score. The `Assessment` type is defined in `src/types.ts`.

## 3. Add unit tests for shift-summary process pattern detection
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` (286 lines) is the most complex file. The `computeProcessPatterns()` function and its review-loop/reactive-ratio detection have no dedicated unit tests. The review-loop-breaker tree node depends on this logic — if it breaks, the tree can get stuck in infinite critique loops. Adding focused unit tests for `computeProcessPatterns()` would catch regressions.
