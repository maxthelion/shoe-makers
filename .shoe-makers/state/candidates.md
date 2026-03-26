# Candidates

## 1. Sync wiki verification spec with code permissions (log/ and archive/ paths)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The executor permissions in `wiki/pages/verification.md` (the permissions table) don't list `.shoe-makers/log/` or `.shoe-makers/archive/` in the executor's canWrite column, but `src/verify/permissions.ts:47,62` now includes both. This spec-code divergence was identified in critique-2026-03-26-043 and deferred because the critique-fixer role couldn't write wiki. A doc-sync skill can update the wiki table to match the code, closing the gap.

## 2. Replace `as any` casts in prompt-helpers.test.ts with typed test fixtures
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` has 16+ `as any` type assertions (lines 30, 43, 57, 71, 77, 86, 107, 119, 127, 135, 153, 170, 184, 204, 218, 231). This is the #2 worst health file at score 94. Replacing these with properly typed `Assessment` partial fixtures would improve type safety, catch real bugs, and raise the file's health score. The `Assessment` type is defined in `src/types.ts`.

## 3. Add unit tests for shift-summary process pattern detection
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` (286 lines) is the most complex file in the codebase. The `computeProcessPatterns()` function and its review-loop/reactive-ratio detection logic have no dedicated unit tests. This is high-risk: changes to process pattern detection could silently break the review-loop-breaker tree node. Adding focused tests for `computeProcessPatterns()` would improve confidence in the self-monitoring loop.

## 4. Update README skills list (shows 5 current + 4 planned, all 9 are implemented)
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README's skills section still lists only 5 "current" skills with 4 more as "planned", but all 9 skills are now implemented in `.shoe-makers/skills/`. The behaviour tree diagram in the README also doesn't show `review-loop-breaker` or `review-loop-with-candidates` nodes. These are minor doc inaccuracies that could confuse new contributors.

## 5. Extract shift-summary.ts summarizeShift() into smaller testable functions
**Type**: health
**Impact**: low
**Reasoning**: `src/log/shift-summary.ts:summarizeShift()` has grown to 100+ lines with nested loops and multiple state mutations. Extracting process pattern analysis, tick categorization, and tree depth analysis into separate pure functions would reduce complexity, improve the file's health score, and make the code easier to test (pairs with candidate #3).
