# Candidates

## 1. Add test coverage for `prompts/helpers.ts` tier determination logic
**Type**: test
**Impact**: medium
**Reasoning**: `determineTier()` at `src/prompts/helpers.ts:120-125` uses `untestedCount >= 5` threshold to determine if there are gaps. `isInnovationTier()` at line 132-134 is called by the behaviour tree (`src/tree/default-tree.ts:67`). Direct unit tests for edge cases are missing: null assessment, boundary values (untestedCount=4 vs 5, specifiedOnly=0 vs 1), both counts zero. Also untested: `findSkillForAction()`, `formatTopGaps()`, `formatCodebaseSnapshot()`, `formatSkillCatalog()`.

## 2. Add test coverage for schedule.ts midnight-wrap edge cases
**Type**: test
**Impact**: low
**Reasoning**: `getShiftDate()` in `src/schedule.ts` must handle midnight-wrap correctly (start: 22, end: 6 means at 2am, use yesterday's date for the branch). Edge cases around midnight boundaries affect branch naming correctness.

## 3. Push branch to remote
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The shoemakers/2026-03-25 branch has accumulated significant work this session: doc-sync for README + 2 wiki pages, dead code removal (verify.ts, blackboard exports), finding about stale invariants. Pushing to remote preserves the work and makes it available for human review in the morning.
