# Candidates

## 1. Remove dead `skills/verify.ts` module
**Type**: dead-code
**Impact**: medium
**Reasoning**: `src/skills/verify.ts` (84 lines) exports a `verify()` function that is never imported by any production code — only by its test file `src/__tests__/verify.test.ts`. The wiki spec describes verification as handled by the critique/review cycle in the behaviour tree, which is how the system actually works. This dead module creates confusion about the verification architecture. It references `clearCurrentTask` and `clearPriorities` from the blackboard, which are also likely dead code paths. Removing it along with its test file cleans up the codebase. Related: `src/state/blackboard.ts` exports `clearCurrentTask`, `clearPriorities`, `writeVerification` which may only be used by verify.ts.

## 2. Add test coverage for `prompts/helpers.ts` tier determination
**Type**: test
**Impact**: medium
**Reasoning**: `src/prompts/helpers.ts` contains `determineTier()` and `isInnovationTier()` which directly influence the behaviour tree's routing decision at `src/tree/default-tree.ts:67`. `isInnovationTier` is called by `innovationTier()` in the tree — if it has a bug, the system would either never reach innovation tier or reach it prematurely. While `prompts.test.ts` covers prompt generation, these helper functions lack direct unit tests for edge cases: what happens when assessment is null, when specifiedOnly=0 but implementedUntested=4 vs 5, etc. The threshold `untestedCount >= 5` in `determineTier` is a magic number that deserves test coverage.

## 3. Add test coverage for schedule.ts midnight-wrap edge cases
**Type**: test
**Impact**: low
**Reasoning**: The wiki spec (`scheduled-tasks.md`) emphasizes midnight-wrap as critical. `src/schedule.ts:getShiftDate()` must return yesterday's date when it's e.g. 2am on a midnight-wrap shift (start: 22, end: 6). While `schedule.test.ts` exists, edge cases around the midnight boundary (23:59 → 00:01) and timezone handling are important for branch naming correctness. A bug here creates wrong branch names.

## 4. Consolidate duplicate action-type mappings
**Type**: health
**Impact**: low
**Reasoning**: Action-type-to-string mappings exist in multiple places: `SKILL_TO_ACTION` in `src/scheduler/tick.ts`, `TITLE_TO_ACTION` in `src/prompts/helpers.ts`, `ACTION_TO_SKILL_TYPE` also in helpers.ts, and title patterns in `src/log/shift-log-parser.ts`. While they serve slightly different purposes (skill→action vs prompt→action vs action→skill-type), the duplication means adding a new action type requires updating 3-4 files. A shared constant or type-safe enum could reduce this risk.
