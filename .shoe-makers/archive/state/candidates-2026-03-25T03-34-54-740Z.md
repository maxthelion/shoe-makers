# Candidates

## 1. Doc-sync: fix stale reference to claim-evidence location in wiki invariants page
**Type**: doc-sync
**Impact**: high
**Reasoning**: `wiki/pages/invariants.md` line 59 says "The claim-to-evidence mapping is manually curated in `src/verify/invariants.ts`" but this is wrong. The evidence mapping was moved to `.shoe-makers/claim-evidence.yaml` and is parsed by `src/verify/parse-evidence.ts`. This is a factual error in the spec — the wiki is the source of truth and it's pointing to the wrong file. Per invariant 1.6 ("If the spec is accurate enough, the application could be rebuilt from scratch"), this must be corrected. Files: `wiki/pages/invariants.md`.

## 2. Consolidate duplicated WorldState factory functions in test files
**Type**: health
**Impact**: low
**Reasoning**: Three test files independently define WorldState factory helpers. `makeState()` in `src/__tests__/test-utils.ts` (exported), a local `makeState()` in `src/__tests__/prompts.test.ts`, and `makeWorldState()` in `src/__tests__/setup.test.ts` all duplicate the same structure with slight variations. Consolidating into the shared test-utils would reduce maintenance when WorldState changes. Files: `src/__tests__/test-utils.ts`, `src/__tests__/prompts.test.ts`, `src/__tests__/setup.test.ts`.

## 3. Add tests for archive/state-archive edge cases
**Type**: test
**Impact**: low
**Reasoning**: `src/archive/state-archive.ts` has 7 tests but doesn't test archiving multiple files simultaneously or the interaction with the `action` parameter when an unrecognized action type is passed. These are minor edge cases. Files: `src/archive/state-archive.ts`, `src/__tests__/state-archive.test.ts`.
