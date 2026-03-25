# Candidates

## 1. Improve code health of prompts.test.ts (87 → target 95+)
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is the worst-scoring file at 87/100. It has a large flat `promptCases` array (lines 84-109) with 25+ inline test tuples and repeated `makeState()` calls. Refactoring options: group tests by action type into nested `describe` blocks, extract the `promptCases` table-driven test pattern into a helper, reduce duplication in state construction. This is the highest-leverage health improvement since it's the worst file.

## 2. Improve code health of prompt-builders.test.ts (90 → target 95+)
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` scores 90/100 with 51 test cases across 6 builder functions. Duplicated assertion patterns for permission violations and validation patterns could be extracted into shared helpers. Tests for reactive and three-phase builders follow near-identical structures.

## 3. Extract branch management from setup.ts (91 → target 95+)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/setup.ts` at 91/100 contains `ensureBranch` and `checkoutOrCreateBranch` (lines 207-239) plus `readWikiOverview` (lines 372-390) that could be extracted. Moving branch management to `src/scheduler/branch.ts` would make setup.ts more focused on orchestration.

## 4. Add invariant for the new verification gate
**Type**: doc-sync
**Impact**: low
**Reasoning**: The commit-or-revert verification gate is now implemented and documented but has no matching invariant in `.shoe-makers/invariants.md`. A finding should be written suggesting the human add an invariant for this new capability. **Note: requires human action to add to invariants.md — elf should write a finding.**
