# Candidates

## 1. Improve health of setup.ts (score 93)
**Type**: octoclean-fix
**Impact**: high
**Reasoning**: `src/setup.ts` is the worst-scoring file at 93/100 and the most complex module (349 lines, main function 170+ lines). It handles branch setup, assessment, archiving, tree evaluation, and prompt generation in a single function. Extracting stages into smaller helper functions would improve readability, testability, and the overall health score. This is the single biggest lever to push health from 99 toward 100.

## 2. Remove dead Blackboard fields in types.ts
**Type**: dead-code
**Impact**: medium
**Reasoning**: `src/types.ts:45,47` defines `priorities?: unknown | null` and `verification?: unknown | null` on the Blackboard interface. These fields are never assigned or read anywhere in the codebase. They add confusion about whether they're intended for future use. Removing them cleans up the core type definitions. Related: `src/state/blackboard.ts` may reference these in its default construction.

## 3. Improve health of prompt-builders.test.ts (score 94)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` scores 94/100. Recent commits show a pattern of consolidating test files (e.g., `octoclean-fix: consolidate innovate and evaluate-insight tests`). This file likely has repetitive test setup or duplicated assertions that can be extracted into shared helpers using the existing `test-utils.ts` patterns.

## 4. Improve health of prompt-helpers.test.ts (score 94)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` scores 94/100. Similar to prompt-builders.test.ts, this test file may have duplicated setup patterns. Consolidating shared test fixtures and reducing repetitive mock construction would improve the score.

## 5. Improve health of prompts-features.test.ts (score 94)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/prompts-features.test.ts` scores 94/100. Part of the same cluster of prompt test files. Shares similar test patterns with the other prompt test files and could benefit from the same consolidation approach.
