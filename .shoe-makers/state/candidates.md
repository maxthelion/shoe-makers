# Candidates

## 1. Add unit tests for computeProcessPatterns() and analyzeProcessPatterns()
**Type**: test
**Impact**: high
**Reasoning**: `src/log/shift-summary.ts:256-285` contains `analyzeProcessPatterns()` which computes `reactiveRatio`, `reviewLoopCount`, and tick classification — the exact values the `review-loop-breaker` and `review-loop-with-candidates` tree nodes depend on. This function has zero direct test coverage. The review-loop-breaker finding (`.shoe-makers/findings/review-loop-blocks-execution.md`) shows this logic is actively causing problems (blocking work-item execution). Testing it will expose whether the loop detection threshold (>=3 consecutive critique/fix-critique actions) is working correctly. Also test `computeProcessPatterns()` in `src/log/shift-log-parser.ts:52-81` which duplicates similar logic from parsed log strings. Existing test patterns in `src/__tests__/shift-summary.test.ts` show how to build `ShiftStep[]` fixtures.

## 2. Replace `as any` casts in prompt-helpers.test.ts with typed Partial<Assessment> fixtures
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-helpers.test.ts` has 16+ `as any` casts for Assessment objects passed to helper functions. Health score is 94 (one of the 3 worst files). Using `Partial<Assessment> as Assessment` or building a `makeAssessment()` factory that provides defaults would eliminate the casts while keeping tests readable. The pattern already exists in `src/__tests__/assess.test.ts` which uses typed fixtures. This is a straightforward health improvement with no risk.

## 3. "Walkable codebase" — consolidate process-pattern computation (Seaside lens)
**Type**: health
**Impact**: medium
**Reasoning**: Seaside, Florida's core principle is walkability — everything reachable without detours. The shoe-makers codebase has a "walkability" problem: process pattern computation exists in two places doing nearly identical work. `src/log/shift-summary.ts:256-285` computes `reviewLoopCount` and `reactiveRatio` from `ShiftStep[]` objects, while `src/log/shift-log-parser.ts:52-81` computes the same metrics from parsed log strings. Both classify actions using `REACTIVE_ACTIONS`/`PROACTIVE_ACTIONS` from `action-classification.ts`. A single `computeProcessPatterns(actions: string[])` function that accepts an action-name array would let both callers share one path — making the logic more "walkable" (one place to understand, test, and fix). This directly addresses the DRY violation noted in the codebase survey and would make the review-loop threshold easier to tune.
