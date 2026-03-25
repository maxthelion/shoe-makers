# Candidates

## 1. Rename misleading shift test + add actual sleep path test
**Type**: test
**Impact**: medium
**Reasoning**: Critique-211 (advisory) flagged that `src/__tests__/shift.test.ts` has a test titled "returns sleep when tree produces no action" that doesn't test the sleep path. The test should be renamed to "onTick callback works with single tick limit". Additionally, a proper sleep path test could be written by importing `tick` directly and verifying that a custom empty tree returns `{ action: null }`, then testing that the shift function handles it correctly. Files: `src/__tests__/shift.test.ts`.

## 2. Doc-sync: update invariants.md wiki page to match current verification model
**Type**: doc-sync
**Impact**: high
**Reasoning**: The existing finding `invariant-update-2026-03-25.md` documents that two invariants ("commit or revert" and "Verification has already caught and reverted bad work") reference the old verify model that was removed. While elves can't modify `.shoe-makers/invariants.md`, the wiki page `wiki/pages/invariants.md` describes the invariants pipeline and can be updated to accurately describe the current verification model (adversarial review via critique cycle, not automated commit/revert). This would close the spec-code gap from the wiki side. Files: `wiki/pages/invariants.md`, `wiki/pages/verification.md`.

## 3. Add tests for prompt builders with permission violations
**Type**: test
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts:buildCritiquePrompt()` (line 27) accepts an optional `permissionViolations` parameter. When violations are present, it appends a warning section. The `src/__tests__/prompts.test.ts` tests `generatePrompt("critique", ...)` but the permission violation path may not be fully exercised. Adding a test that passes violations and verifies the warning text appears would strengthen coverage of this security-relevant code path. Files: `src/prompts/reactive.ts`, `src/__tests__/prompts.test.ts`.

## 4. Consolidate test helper WorldState factories
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/prompts.test.ts` defines its own `makeState()` (line 28) and `src/__tests__/setup.test.ts` defines `makeWorldState()` (line 32), both duplicating the exported `makeState()` from `src/__tests__/test-utils.ts`. These could be consolidated by making the test-utils version accept overrides for assessment and config. Reduces maintenance burden when WorldState shape changes. Files: `src/__tests__/test-utils.ts`, `src/__tests__/prompts.test.ts`, `src/__tests__/setup.test.ts`.
