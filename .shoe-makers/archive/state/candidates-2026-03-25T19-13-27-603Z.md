# Candidates

## 1. Remove dead Blackboard fields in types.ts
**Type**: dead-code
**Impact**: medium
**Reasoning**: `src/types.ts:45` defines `priorities?: unknown | null` and `src/types.ts:47` defines `verification?: unknown | null` on the Blackboard interface. Grep confirms these are never accessed (`.priorities` and `.verification` appear nowhere in src/). They add confusion about whether they represent future work. Removing them simplifies the core type and the default construction in `src/state/blackboard.ts`.

## 2. Improve health of prompt-builders.test.ts (score 94)
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` scores 94/100 and is now the worst file. Recent commits show a successful pattern of consolidating test helpers (e.g., `octoclean-fix: parameterize file-existence checks in world.test.ts`). However, the health skill says "Do not modify test files — only refactor implementation". This candidate may need the generic `health` skill instead, or should be deferred until the test-coverage skill can address it.

## 3. Remove unused isAllHousekeeping and HOUSEKEEPING_PATHS re-exports
**Type**: dead-code
**Impact**: low
**Reasoning**: `src/scheduler/housekeeping.ts` exports `isAllHousekeeping` and `HOUSEKEEPING_PATHS`. After the setup.ts refactoring, `setup.ts` no longer imports these. Check if any other file still uses them — if not, these exports can be removed from the housekeeping module to reduce surface area. Files: `src/scheduler/housekeeping.ts`.
