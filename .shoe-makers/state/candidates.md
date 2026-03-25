# Candidates

## 1. Doc-sync: update wiki skills.md reference to "work skill" terminology
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/skills.md` line 17 refers to "the work skill" picking tasks and including skill instructions: "makes them available to the work skill. Each skill's `maps-to` field links it to a priority item type, so when the work skill picks a task..." The current system uses three-phase orchestration (explore → prioritise → execute-work-item), not a single "work skill". The sentence should reference the execute-work-item action and the prompt generation system instead. Per invariant 1.6, the wiki should describe what the system IS, not what it WAS. Files: `wiki/pages/skills.md`.

## 2. Consolidate duplicated WorldState factory functions in test files
**Type**: health
**Impact**: low
**Reasoning**: Three test files independently define WorldState factory helpers: `makeState()` in `src/__tests__/test-utils.ts`, a local `makeState()` in `src/__tests__/prompts.test.ts`, and `makeWorldState()` in `src/__tests__/setup.test.ts`. Consolidating into parameterized shared helpers would reduce maintenance when the WorldState type changes. Files: `src/__tests__/test-utils.ts`, `src/__tests__/prompts.test.ts`, `src/__tests__/setup.test.ts`.

## 3. Add test for fileExists utility function
**Type**: test
**Impact**: low
**Reasoning**: `src/utils/fs.ts` exports `fileExists()` (6 lines) which is used by `world.ts` for `checkHasWorkItem` and `checkHasCandidates`. While these higher-level functions now have tests, the underlying `fileExists` utility has no direct test. A simple test would verify it returns true/false correctly. Files: `src/utils/fs.ts`, needs test in `src/__tests__/`.
