# Candidates

## 1. Update wiki tick-types.md to reflect current architecture
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/tick-types.md` references an old state model with `priorities.json`, `current-task.json`, and `verification.json` — files that `src/state/blackboard.ts:48-49` acknowledges as "legacy files from the old tick-type model." The wiki should reflect the current three-phase orchestration (explore/prioritise/execute) rather than the old tick-type model. This is spec-code misalignment where the spec is stale.

## 2. Remove unused blackboard exports and `buildProcessSuggestions`
**Type**: dead-code
**Impact**: medium
**Reasoning**: Three functions in `src/state/blackboard.ts` are now dead code after `skills/verify.ts` was removed: `writeVerification()` (line 87), `clearCurrentTask()` (line 108), `clearPriorities()` (line 115). They're only referenced in `src/__tests__/blackboard.test.ts`. Additionally, `buildProcessSuggestions()` in `src/log/shift-summary.ts` (line 296) is exported but only used in its test file. Removing these dead exports and their tests reduces the public API surface and prevents future confusion.

## 3. Add test coverage for `prompts/helpers.ts` tier determination
**Type**: test
**Impact**: medium
**Reasoning**: `src/prompts/helpers.ts` contains `determineTier()` and `isInnovationTier()` which directly influence the behaviour tree's routing at `src/tree/default-tree.ts:67`. The threshold `untestedCount >= 5` in `determineTier` (line 124) is a critical boundary — off-by-one here would cause premature or delayed innovation tier routing. While `prompts.test.ts` covers prompt generation, these helper functions lack direct unit tests.

## 4. Add test coverage for schedule.ts midnight-wrap edge cases
**Type**: test
**Impact**: low
**Reasoning**: `src/schedule.ts:getShiftDate()` must return yesterday's date when it's past midnight but before shift end on a midnight-wrap schedule (start: 22, end: 6). Edge cases around 23:59→00:01 transitions are critical for branch naming correctness. A bug here would create wrong branch names breaking the entire shift.
