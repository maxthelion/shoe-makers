# Candidates

## 1. Write finding about stale invariants referencing old verify model
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Two invariants are now specified-only: "commit or revert" (architecture) and "Verification has already caught and reverted bad work" (what-a-user-can-do). These reference the old `Verification` type and verify skill which were removed as dead code. The system now uses the behaviour tree's critique/review cycle instead of a verify-then-commit/revert model. Since `.shoe-makers/invariants.md` is human-only, the elf should write a finding suggesting the human update these invariants to reflect the current architecture.

## 2. Add test coverage for `prompts/helpers.ts` tier determination logic
**Type**: test
**Impact**: medium
**Reasoning**: `determineTier()` at `src/prompts/helpers.ts:120-125` uses `untestedCount >= 5` threshold. `isInnovationTier()` is called by the tree at `src/tree/default-tree.ts:67`. These routing-critical functions lack direct unit tests for edge cases: null assessment, boundary values (untestedCount=4 vs 5), both counts zero.

## 3. Add test coverage for schedule.ts midnight-wrap edge cases
**Type**: test
**Impact**: low
**Reasoning**: `getShiftDate()` in `src/schedule.ts` must handle midnight-wrap correctly for branch naming. Edge cases around midnight boundaries are critical.
