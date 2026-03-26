# Candidates

## 1. Consolidate duplicated process-pattern computation (existing work-item)
**Type**: health
**Impact**: high
**Reasoning**: Work-item already exists at `.shoe-makers/state/work-item.md`. `src/log/shift-summary.ts:256-285` (`analyzeProcessPatterns`) and `src/log/shift-log-parser.ts:52-81` (`computeProcessPatterns`) contain identical review-loop detection and reactive-ratio logic. Consolidating into the `computeProcessPatterns` function (which is more complete — includes `innovationCycleCount`) eliminates a DRY violation in code that directly controls the review-loop-breaker tree node. Both functions already have comprehensive tests, so refactoring is low-risk. This is the highest-impact improvement available.

## 2. Add tests for buildWorldState() — the tree's input assembler
**Type**: test
**Impact**: medium
**Reasoning**: `src/setup/world-state.ts` exports `buildWorldState()` which assembles the complete `WorldState` object that drives every tree evaluation. It maps 8 parallel file-system checks to boolean flags the behaviour tree reads. It has **zero test coverage** — no test file exists. This is the most critical untested function since incorrect world state means the tree routes to wrong actions. A test fixture with a temp directory and known state files would verify correct mapping. Pattern: follow `src/__tests__/state-archive.test.ts` which uses `mkdtemp` + file fixtures.

## 3. Sync wiki verification permissions table with code (doc-sync)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` lines 26-27 list executor permissions missing `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml` (for `continue-work`) and additionally `package.json`, `bun.lock`, `bun.lockb` (for `execute-work-item`). Code at `src/verify/permissions.ts:47,62` has the correct lists. This gap was flagged in a previous critique. Previous work-item existed for this but was blocked by review-loop-breaker across multiple cycles.
