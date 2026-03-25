# Candidates

## 1. Add drift-prevention test: action-classification sets vs default-tree actions
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/log/action-classification.ts` exports `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` sets used by shift log parsing and shift summary generation. These sets must stay in sync with the actions in `src/tree/default-tree.ts`, but no test enforces this. A test asserting that the union of `REACTIVE_ACTIONS` + `PROACTIVE_ACTIONS` covers all actions from the default tree would catch silent drift when new actions are added. The shift-summary test file (`src/__tests__/shift-summary.test.ts`) is the natural home for this test. This is a small, focused addition that prevents a class of bugs.

## 2. Add test coverage for prompt template builders (reactive.ts, three-phase.ts)
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` and `src/prompts/three-phase.ts` generate the action prompts for all tree actions. They're only tested indirectly through `generatePrompt()`. Direct unit tests for builders like `buildExplorePrompt` or `buildCritiquePrompt` would catch regressions in section generation (e.g., missing permission violation warnings, incorrect tier labels). Every elf depends on these prompts being correct.

## 3. Sync execute-work-item "Can write" in verification.md key constraints paragraph
**Type**: doc-sync
**Impact**: low
**Reasoning**: In `wiki/pages/verification.md:37`, the "Key constraints" section says "The `execute-work-item` role can write both source and tests because it handles varied skill types." This is accurate but could be more precise — the role also writes `CHANGELOG.md`, `README.md`, and `.shoe-makers/claim-evidence.yaml`. However, the paragraph is about the principle (broad permissions for varied work), not the exhaustive list, so this is low-impact. The table itself is now correct (fixed in `e4d406b`).
