# Candidates

## 1. Sync wiki and README with new commit-or-revert verification gate
**Type**: doc-sync
**Impact**: high
**Reasoning**: The commit-or-revert verification gate was just implemented in `src/verify/commit-or-revert.ts` and wired into `src/setup.ts`, but none of the documentation reflects this. `wiki/pages/verification.md` describes only the adversarial review model — it should also document that setup auto-reverts commits when tests fail or health regresses, before the review cycle even starts. `wiki/pages/architecture.md` should mention the pre-tree verification step. `README.md` Quality Assurance section (lines 46-51) should add a bullet about the automated verification gate. The finding `stale-verification-invariants.md` can now be marked resolved since the gate is implemented.

## 2. Improve code health of prompt-builders.test.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` scores 90/100 health. It has 51 test cases with duplicated assertion patterns — near-identical structures for checking permission violations, validation patterns, and output formats across reactive and three-phase prompt builders. Extracting shared assertion helpers (e.g., `expectPromptContainsAll`, violation checkers) would reduce duplication and improve readability. This is the second-worst file by health score.

## 3. Improve code health of prompts.test.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` scores 87/100 — the worst file in the codebase. It has a large flat test structure with repeated `makeState()` calls and long inline test case arrays. The `promptCases` array (lines 84-109) could be reorganized into grouped describes by action type. Shared state setup could be extracted to `beforeEach` blocks. This would reduce complexity and improve the health score.

## 4. Extract branch management from setup.ts
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/setup.ts` scores 91/100 health (third-worst). It contains branch management logic (`ensureBranch`, `checkoutOrCreateBranch` at lines 207-239) and wiki overview reading (lines 372-390) that could be extracted to separate modules. The verification gate wiring (lines 72-88) is already well-separated via the import. Extracting branch management to `src/scheduler/branch.ts` and wiki reading to a dedicated module would reduce setup.ts complexity.
