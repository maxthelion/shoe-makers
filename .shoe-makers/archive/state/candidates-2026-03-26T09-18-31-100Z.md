# Candidates

## 1. Consolidate duplicated process-pattern computation (ready to execute)
**Type**: health
**Impact**: high
**Reasoning**: Work-item exists at `.shoe-makers/state/work-item.md` with full instructions. `src/log/shift-summary.ts:256-285` and `src/log/shift-log-parser.ts:52-81` contain identical review-loop detection logic. Refactor `analyzeProcessPatterns` to delegate to `computeProcessPatterns`. Both have comprehensive tests. Low risk, high maintainability gain.

## 2. Add tests for buildWorldState()
**Type**: test
**Impact**: medium
**Reasoning**: `src/setup/world-state.ts` exports `buildWorldState()` with zero test coverage. This function assembles the `WorldState` that drives every tree evaluation — incorrect mapping means wrong actions. Test with temp directory + known state files following `src/__tests__/state-archive.test.ts` pattern.

## 3. Sync wiki verification permissions table with code
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` lines 26-27 missing `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, `bun.lockb` from executor canWrite lists. Code at `src/verify/permissions.ts:47,62` is correct. Known spec-code gap from previous critique.
