# Candidates

## 1. Fix execute-work-item permissions row in verification.md
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The `execute-work-item` row in `wiki/pages/verification.md:27` lists `src/`, `wiki/`, `.shoe-makers/state/` as writable paths, but the code in `src/verify/permissions.ts:60-64` includes three additional paths: `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md`. This was noted in critique-2026-03-25-228 as a pre-existing inconsistency. The wiki spec should match the code. This is the same type of gap just fixed for `continue-work` — the executor role's full permissions aren't documented.

## 2. Add test coverage for prompt template builders (reactive.ts, three-phase.ts)
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` (6 exports) and `src/prompts/three-phase.ts` (6 exports) generate the action prompts for all tree actions. They're only tested indirectly through `generatePrompt()` in `src/__tests__/prompts.test.ts`. Direct unit tests for individual builders (e.g., `buildExplorePrompt`, `buildCritiquePrompt`) would catch regressions like missing sections or incorrect parameter handling. These functions are on the critical path — every elf action depends on them.

## 3. Add drift-prevention test for action-classification constants
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/log/action-classification.ts` exports `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` sets consumed by `shift-log-parser.ts` and `shift-summary.ts`. No tests verify these sets match the actions in `default-tree.ts`. A test asserting the union of both sets equals the set of all tree actions would prevent silent misclassification when new actions are added. The keystone species lens is relevant here: these small constant sets are a keystone — if they drift from the tree, the entire shift summary and log parsing silently degrades.
