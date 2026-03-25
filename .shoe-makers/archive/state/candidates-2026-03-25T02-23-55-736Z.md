# Candidates

## 1. Remove unused blackboard exports (writeVerification, clearCurrentTask, clearPriorities)
**Type**: dead-code
**Impact**: medium
**Reasoning**: After removing `skills/verify.ts`, three functions in `src/state/blackboard.ts` are now dead code — `writeVerification()` (line 87), `clearCurrentTask()` (line 108), `clearPriorities()` (line 115). They're only referenced in `src/__tests__/blackboard.test.ts`. Additionally, `buildProcessSuggestions()` in `src/log/shift-summary.ts` (line 296) is exported but only used in its test file. Removing these dead exports reduces confusion about the API surface. The `Verification`, `CurrentTask`, `PriorityList` types in `types.ts` can stay since they're part of the data model, but the blackboard reading of legacy files (`priorities`, `currentTask`, `verification`) in `readBlackboard()` could also be cleaned up.

## 2. Add test coverage for `prompts/helpers.ts` tier determination logic
**Type**: test
**Impact**: medium
**Reasoning**: `determineTier()` at `src/prompts/helpers.ts:120-125` uses the threshold `untestedCount >= 5` to determine if there are gaps. `isInnovationTier()` at line 132-134 is called by the behaviour tree (`src/tree/default-tree.ts:67`). Edge cases: null assessment, specifiedOnly=0 but implementedUntested=4 vs 5, both zero. These routing-critical functions deserve direct unit tests. `findSkillForAction()`, `formatTopGaps()`, `formatCodebaseSnapshot()`, and `formatSkillCatalog()` are also untested.

## 3. Add test coverage for schedule.ts midnight-wrap edge cases
**Type**: test
**Impact**: low
**Reasoning**: `getShiftDate()` in `src/schedule.ts` must handle the midnight-wrap case correctly — when it's 2am with schedule start:22/end:6, it should return yesterday's date for the branch name. Edge cases around midnight boundaries affect branch naming correctness.
