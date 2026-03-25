# Candidates

## 1. Remove stale action-constants.ts (dead code with inconsistent data)
**Type**: dead-code
**Impact**: medium
**Reasoning**: `src/log/action-constants.ts` is a stale duplicate of `src/log/action-classification.ts`. The stale file is missing `"continue-work"` from REACTIVE_ACTIONS, making it inconsistent with the ActionType definition in `src/types.ts`. Production code (`shift-summary.ts`, `shift-log-parser.ts`) imports from `action-classification.ts`. The stale file is only imported by its own test (`src/__tests__/action-constants.test.ts`). Both the stale file and its test should be deleted. This is a clear dead-code removal that also eliminates a data consistency bug.

## 2. Remove backward-compat re-exports from setup.ts
**Type**: dead-code
**Impact**: low
**Reasoning**: `src/setup.ts` line 159 re-exports `isAllHousekeeping` and `HOUSEKEEPING_PATHS` from `./scheduler/housekeeping` with the comment "Re-export for backward compatibility with existing test imports." Tests should import directly from the source module. This is a minor cleanup but removes unnecessary coupling and makes setup.ts simpler.

## 3. Add tests for findValidationPatterns helper
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/helpers.ts:findValidationPatterns` was extracted in this shift's refactoring but has no dedicated tests. It has 4 code branches that should be verified. Small gap from the refactoring work.
