# Candidates

## 1. Consolidate duplicated process-pattern computation (existing work-item)
**Type**: health
**Impact**: high
**Reasoning**: Work-item already exists at `.shoe-makers/state/work-item.md`. `src/log/shift-summary.ts:256-285` duplicates the review-loop detection and reactive/proactive classification logic from `src/log/shift-log-parser.ts:52-81`. Refactor `analyzeProcessPatterns` to delegate to `computeProcessPatterns`. Both have comprehensive tests. Low risk, high maintainability gain. Has been blocked by review-loop-breaker for 10+ ticks.

## 2. Sync wiki verification permissions table with code
**Type**: doc-sync
**Impact**: high
**Reasoning**: `wiki/pages/verification.md:26-27` permissions table diverges from `src/verify/permissions.ts:45-49,60-64`. Code grants `continue-work` and `execute-work-item` access to `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, `bun.lockb` — none of which appear in the wiki table. The wiki is the source of truth for reviewers; mismatches mean permission violations go undetected. Update wiki table to match code (the code permissions are intentional — agents need to write logs and archives).

## 3. Add integration tests for buildWorldState()
**Type**: test
**Impact**: medium
**Reasoning**: `src/setup/world-state.ts` has zero test coverage. This function orchestrates 8 parallel I/O operations that feed the entire behaviour tree. Its composed utilities are individually tested, but the integration — field mapping, error handling, default values — is not. A bug here silently breaks all tree routing. Files: `src/setup/world-state.ts` (45 lines), no existing test file.
