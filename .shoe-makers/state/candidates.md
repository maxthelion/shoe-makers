# Candidates

## 1. Improve health score of src/init-skill-templates.ts
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Health score 92 (worst in codebase). Large file of string template constants. Could split into individual skill template files or extract common sections shared across templates. File: `src/init-skill-templates.ts`.

## 2. Add dedicated tests for fix-critique and review prompts
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/__tests__/prompts.test.ts` now covers dead-code with dedicated tests but `fix-critique` and `review` action types only have coverage via the allActions loop. Adding dedicated tests verifying their specific content (e.g. fix-critique mentions resolving findings, review mentions correctness/tests/spec checks) follows the pattern established for other actions.

## 3. Extract duplicated fileExists utility
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `fileExists()` is defined identically in both `src/state/world.ts:114` and `src/init.ts`. Extracting to a shared `src/utils/fs.ts` module would eliminate duplication. Minor but clean improvement.
