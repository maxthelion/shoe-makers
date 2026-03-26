# Candidates

## 1. Consolidate duplicated process-pattern computation (work-item ready)
**Type**: health
**Impact**: high
**Reasoning**: Work-item at `.shoe-makers/state/work-item.md`. Refactor `src/log/shift-summary.ts:256-285` to delegate to `src/log/shift-log-parser.ts:52-81`. Eliminates DRY violation in review-loop detection logic. Blocked by review-loop-breaker this entire shift (10+ ticks). Execute next shift.

## 2. Add tests for buildWorldState()
**Type**: test
**Impact**: medium
**Reasoning**: `src/setup/world-state.ts` has zero test coverage for the function that assembles tree evaluation input.

## 3. Sync wiki verification permissions table with code
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` lines 26-27 diverged from `src/verify/permissions.ts:47,62`. Missing log/, archive/, config.yaml, package.json, bun.lock, bun.lockb.
