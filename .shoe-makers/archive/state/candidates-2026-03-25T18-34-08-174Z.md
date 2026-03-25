# Candidates

## 1. Consolidate world.test.ts (score 93, 350 lines)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` is the worst-scoring file at 93. It likely has beforeEach/afterEach temp-dir management patterns that could use `withTempDir` from test-utils, plus repeated test setups that could benefit from shared helpers. This is the same pattern that successfully improved the other test files from 90→94.

## 2. Refactor setup.ts (score 93, 349 lines)
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is tied for worst at 93 and is the largest non-test source file. It handles branch creation, assessment, tree evaluation, next-action writing, verification gate, and Wikipedia fetch — all in one file. Extracting helper functions could improve readability and health score. However, this is a more delicate refactor since it's the main orchestration script.

## 3. Check for stale evidence patterns in claim-evidence.yaml
**Type**: health
**Impact**: low
**Reasoning**: The recent test consolidation broke an invariant evidence pattern (test name contained "MUST use the Wikipedia article" which was used for evidence matching). This was caught and fixed, but there may be other fragile evidence patterns that depend on specific test names rather than test content. A systematic audit of claim-evidence.yaml test patterns against actual test files would catch these before they become problems.
