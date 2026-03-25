# Candidates

## 1. Add test for getShiftProcessPatterns async wrapper
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-log-parser.ts` exports `getShiftProcessPatterns()` (an async function that reads the shift log and computes process patterns). While the internal functions `parseShiftLogActions` and `computeProcessPatterns` have test coverage in `src/__tests__/shift-log-parser.test.ts`, the async wrapper `getShiftProcessPatterns` which does file I/O has no direct test. This function is used by `assess.ts` to detect reactive ratios and review loops — incorrect results could cause the tree to misroute between tiers. Files: `src/log/shift-log-parser.ts`, `src/__tests__/shift-log-parser.test.ts`.

## 2. Consolidate duplicated WorldState factory functions in test files
**Type**: health
**Impact**: low
**Reasoning**: Three test files independently define WorldState factory helpers: `makeState()` in `src/__tests__/test-utils.ts` (exported), a local `makeState()` in `src/__tests__/prompts.test.ts`, and `makeWorldState()` in `src/__tests__/setup.test.ts`. Consolidating into parameterized helpers in test-utils would reduce duplication when WorldState shape changes. Files: `src/__tests__/test-utils.ts`, `src/__tests__/prompts.test.ts`, `src/__tests__/setup.test.ts`.

## 3. Doc-sync: update wiki invariants.md page with claim-evidence examples
**Type**: doc-sync
**Impact**: low
**Reasoning**: The wiki page `wiki/pages/invariants.md` describes the invariants pipeline conceptually but doesn't show concrete examples of claim-evidence patterns from `.shoe-makers/claim-evidence.yaml`. Adding a few examples would help humans understand how to write new evidence rules when adding invariants. Per invariant 1.6 ("The wiki describes what the system is and does"). Files: `wiki/pages/invariants.md`, `.shoe-makers/claim-evidence.yaml`.
