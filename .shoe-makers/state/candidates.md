# Candidates

## 1. Extract housekeeping functions from setup.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` (431 lines, health score 90) is the second-worst file. The `autoCommitHousekeeping` (47 lines) and `isAllHousekeeping` functions handle git auto-commits for archive/log changes — they're self-contained and could move to `src/scheduler/housekeeping.ts` or similar. This would reduce setup.ts by ~60 lines. The functions are already tested in `src/__tests__/auto-commit-housekeeping.test.ts`. Similarly, `ensureBranch` + `checkoutOrCreateBranch` (~33 lines) could move to `src/scheduler/branch.ts`. Combined, this would reduce setup.ts from 431 to ~340 lines. Wiki page `architecture.md` specifies separation of concerns — the setup script should orchestrate, not implement.

Files: `src/setup.ts` (extract from), `src/scheduler/housekeeping.ts` (new), `src/__tests__/auto-commit-housekeeping.test.ts` (update import)

## 2. Reduce prompts.test.ts size without losing evidence
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` (739 lines, health score 87) is the worst-scoring file. It has significant overlap with `src/__tests__/prompt-builders.test.ts` (363 lines). However, many duplicated tests provide evidence for invariant claims via specific string patterns. To safely consolidate: move the evidence-bearing tests to prompt-builders.test.ts (which tests builders directly), then remove them from prompts.test.ts. Key patterns to preserve: "never revert the wiki", "MUST use the Wikipedia article", "divergent/creative mode", "constructive/convergent mode", "Start with the article title". Check claim-evidence.yaml before removing ANY test.

Files: `src/__tests__/prompts.test.ts`, `src/__tests__/prompt-builders.test.ts`, `.shoe-makers/claim-evidence.yaml`

## 3. Add buildContinueWorkPrompt to prompt-builders.test.ts
**Type**: test
**Impact**: low
**Reasoning**: `buildContinueWorkPrompt` (in `src/prompts/reactive.ts`) is the only prompt builder not directly tested in `prompt-builders.test.ts`. It's currently only tested through the `generatePrompt` dispatcher in `prompts.test.ts`. Adding a direct test in prompt-builders would complete the pattern where every builder has targeted tests.

Files: `src/__tests__/prompt-builders.test.ts`, `src/prompts/reactive.ts`

## 4. Consolidate world.test.ts temp dir setup
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/world.test.ts` (400 lines, health score 91) has 7 separate `describe` blocks each with their own `beforeEach`/`afterEach` for temp directory management. Consolidating to a shared setup helper (like the existing `test-utils.ts` pattern) would reduce boilerplate and improve the score.

Files: `src/__tests__/world.test.ts`
