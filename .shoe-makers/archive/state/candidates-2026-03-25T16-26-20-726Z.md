# Candidates

## 1. Remove backward-compat re-exports from setup.ts
**Type**: dead-code
**Impact**: low
**Reasoning**: `src/setup.ts` line 159 re-exports `isAllHousekeeping` and `HOUSEKEEPING_PATHS` from `./scheduler/housekeeping` with the comment "Re-export for backward compatibility with existing test imports." The test file `src/__tests__/setup.test.ts` should import directly from `../scheduler/housekeeping` instead. This removes unnecessary coupling and makes setup.ts cleaner — one fewer concern in an already-refactored file.

## 2. Add tests for findValidationPatterns helper
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/helpers.ts:findValidationPatterns` (line 140+) was extracted in this shift but has no dedicated tests. It has 4 branches: null previousAction, unrecognized action type, no matching skill type, and successful pattern lookup. Adding a few targeted tests would close the coverage gap from the refactoring.

## 3. Remove stale backward-compat re-export comment pattern
**Type**: health
**Impact**: low
**Reasoning**: After removing the action-constants.ts dead code this shift, the pattern of backward-compat re-exports in setup.ts (line 159) is the last remaining instance. Cleaning it up would eliminate the last "backward compatibility" comment in the codebase, making imports cleaner. This overlaps with candidate #1 but framed as health improvement rather than dead-code.
