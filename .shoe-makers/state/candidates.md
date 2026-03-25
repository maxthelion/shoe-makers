# Candidates

## 1. Add test coverage for world state reader utility functions
**Type**: test
**Impact**: high
**Reasoning**: `src/state/world.ts` exports several async functions that are only tested indirectly through integration: `checkHasWorkItem` (line 124), `checkHasCandidates` (line 131), `readWorkItemSkillType` (line 138), `countInsights` (line 145), and `hasUncommittedChanges` (line 23). These are the foundation of the behaviour tree's decision-making — if any returns a wrong value, the tree routes to the wrong action. Direct unit tests would catch regressions that integration tests might miss. Per wiki `verification.md`, critical-path code should have explicit test coverage. Files: `src/state/world.ts`, `src/__tests__/world.test.ts`.

## 2. Rename misleading "sleep" test in shift.test.ts
**Type**: health
**Impact**: low
**Reasoning**: The adversarial review (critique-211) flagged that `src/__tests__/shift.test.ts` has a test titled "returns sleep when tree produces no action" that doesn't actually test the sleep path — it tests onTick with maxTicks: 1. The verbose comments explain this but the title is misleading for future developers. Should be renamed to "onTick callback works with single tick" or similar. This is a quick fix from the advisory finding. Files: `src/__tests__/shift.test.ts`.

## 3. Consolidate duplicated WorldState factory functions in test files
**Type**: health
**Impact**: medium
**Reasoning**: Three test files independently define WorldState factory helpers: `makeState()` in `src/__tests__/test-utils.ts` (exported), a local `makeState()` in `src/__tests__/prompts.test.ts`, and `makeWorldState()` in `src/__tests__/setup.test.ts`. These have slightly different defaults but mostly duplicate the same structure. Consolidating them into parameterized helpers in test-utils would reduce duplication and make tests easier to maintain. Per wiki `architecture.md`, the system should avoid unnecessary duplication. Files: `src/__tests__/test-utils.ts`, `src/__tests__/prompts.test.ts`, `src/__tests__/setup.test.ts`.

## 4. Add direct unit tests for reactive prompt builders
**Type**: test
**Impact**: medium
**Reasoning**: The prompt builders in `src/prompts/reactive.ts` (buildFixTestsPrompt, buildCritiquePrompt, buildReviewPrompt, etc.) are only tested indirectly via `generatePrompt()` in `src/__tests__/prompts.test.ts`. The `buildCritiquePrompt` function (line 27) has a conditional path for permission violations that may not be fully exercised. Direct tests would verify each builder in isolation, including edge cases like empty violation arrays. Files: `src/prompts/reactive.ts`, `src/__tests__/prompts.test.ts`.

## 5. Doc-sync: update wiki skills.md to list all implemented skills
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Per wiki `skills.md`, the listed skills should match what's implemented. The wiki says "Current skills: fix-tests, implement, test-coverage, doc-sync, health. Planned: octoclean-fix, bug-fix, dependency-update, dead-code removal." But the skills directory now has all of these implemented (octoclean-fix.md, bug-fix.md, dead-code.md, dependency-update.md all exist in `.shoe-makers/skills/`). The wiki should be updated to move planned skills to current. Per invariant 1.6 ("The wiki describes what the system is and does"), keeping wiki in sync with reality is important. Files: `wiki/pages/skills.md`.
