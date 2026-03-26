# Candidates

## 1. Consolidate duplicated process-pattern computation (blocked — needs execution)
**Type**: health
**Impact**: high
**Reasoning**: Work-item at `.shoe-makers/state/work-item.md` is ready. `src/log/shift-summary.ts:256-285` and `src/log/shift-log-parser.ts:52-81` have duplicated review-loop and reactive-ratio logic. The review-loop-breaker has prevented execution for 4+ consecutive explore→prioritise cycles this shift. This work-item should execute next shift when review loop count resets.

## 2. Add tests for buildWorldState()
**Type**: test
**Impact**: medium
**Reasoning**: `src/setup/world-state.ts` has zero test coverage. `buildWorldState()` maps 8 file-system checks to the `WorldState` object driving tree evaluation. Testing would catch bugs like incorrect boolean mapping that could cause wrong tree routing — the same class of issue as the current review-loop-breaker problem.

## 3. Sync wiki verification permissions table with code
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` lines 26-27 missing several paths from executor canWrite lists vs `src/verify/permissions.ts:47,62`. Known gap from previous critique, blocked this shift by review-loop-breaker.
