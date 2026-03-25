# Candidates

## 1. Add drift-prevention test for `generatePrompt` switch exhaustiveness
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/index.ts:26-54` has a switch on `ActionType` in `generatePrompt` that must handle all action types. Unlike `runSkill` (which has a `default` case), `generatePrompt` has no default — a missing case would cause a TypeScript error. However, the TypeScript check isn't running in this environment (`tsc` blocked by missing deps). A runtime drift test that verifies `generatePrompt` returns a non-empty string for every tree skill would catch this even without typecheck. Add to `src/__tests__/prompts.test.ts`.

## 2. Add test for `archiveConsumedStateFiles` edge cases
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/archive/state-archive.ts` archives state files consumed by each action. `src/__tests__/state-archive.test.ts` exists but could test the edge case where no state files exist for a given skill type, and verify that only the expected files are archived for each action type (e.g., explore consumes candidates but not work-item). This documents the archiving contract.

## 3. Add test for `isInnovationTier` edge cases with boundary invariant counts
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/helpers.ts:134-137` checks `isInnovationTier` — the gate that determines whether to route to `innovate` or `explore`. The underlying `determineTier` (line 122-127) uses the condition `specOnlyCount > 0 || untestedCount >= 5`. The boundary case of exactly 5 untested claims is important — it's the threshold that blocks innovation tier. A test verifying this boundary would document the design decision. Currently tested indirectly through tree tests but not directly.
