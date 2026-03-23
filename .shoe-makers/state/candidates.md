# Candidates

## 1. Extract detectPermissionViolations from setup.ts
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/setup.ts` (health score 95, 3rd worst file) handles too many responsibilities: branch setup, assessment, tree evaluation, prompt generation, permission detection, and log writing. The `detectPermissionViolations` function we recently added increases this. Extracting it to `src/verify/detect-violations.ts` would improve separation of concerns — it logically belongs with the other permission code in `src/verify/`. The `buildWorldState` function could also move to `src/state/world.ts` where related functions already live. This would make setup.ts a thin orchestrator.

## 2. Add Integration Test for Permission Violation Detection Flow
**Type**: test-coverage
**Impact**: medium
**Reasoning**: The `detectPermissionViolations` function in `src/setup.ts` is currently untested — it's only exercised indirectly through the full setup flow. An integration test could verify the end-to-end flow: given a mock `last-action.md` with a known action type and a set of changed files, verify that `buildCritiquePrompt` includes the correct violation warnings. The existing test infrastructure in `src/__tests__/prompts.test.ts` tests the prompt builder with explicit violations, but doesn't test the detection logic itself.

## 3. Add parseActionTypeFromPrompt Coverage for Inbox Variant Title
**Type**: test-coverage
**Impact**: low
**Reasoning**: The `parseActionTypeFromPrompt` function in `src/prompts/helpers.ts` is tested for all 9 action types, but the inbox action uses a different title format in `formatAction` (`"# Inbox Messages — Act on These First"`) vs the standard `buildInboxPrompt` (`"# Inbox Messages"`). Both should parse correctly since the regex is `^#\s*Inbox Messages/i`, but the variant with "— Act on These First" isn't explicitly tested.
