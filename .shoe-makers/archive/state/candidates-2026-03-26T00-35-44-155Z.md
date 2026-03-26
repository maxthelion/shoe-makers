# Candidates

## 1. Implement structured critique skill template
**Type**: implement
**Impact**: high
**Reasoning**: The inbox message `structured-skills.md` and `wiki/pages/structured-skills.md` spec describe semi-deterministic skill templates. The critique skill is the #1 priority because format compliance wastes the most ticks here. Currently `src/prompts/critique.ts` generates a free-form prompt. The spec says setup should: auto-number the critique filename, pre-fill the diff and commit range, define exact output sections (Changes Reviewed, Assessment, Issues Found, Status), and include the status format regex. This would require: (1) adding context-gathering to setup (diff, commit range, last-action summary), (2) updating the critique prompt to include pre-filled sections, (3) adding a `## Validation` section to the critique skill file. The prompt builder `buildCritiquePrompt` in `src/prompts/critique.ts` is the file to modify.

## 2. Add tests for src/setup/ extracted modules
**Type**: test-coverage
**Impact**: medium
**Reasoning**: The setup.ts split created `src/setup/branch.ts`, `src/setup/world-state.ts`, `src/setup/format-action.ts`, and `src/setup/housekeeping.ts`. These modules are tested indirectly through `src/__tests__/setup.test.ts` but have no dedicated tests. `format-action.ts:formatAction()` handles inbox, skill-based, and null-skill cases. `housekeeping.ts:autoCommitHousekeeping()` has git side effects that need mocking. `world-state.ts:buildWorldState()` calls 8 async functions in parallel. Adding targeted tests for `formatAction` and `readWikiOverview` (both pure-ish functions) would improve health score and catch regressions.

## 3. Implement claim-evidence directory reference in extract-claims
**Type**: implement
**Impact**: low
**Reasoning**: The claim-evidence split (just completed) updated `loadClaimEvidence` to support multi-file loading but the `extract-claims.ts` module still references claim evidence conceptually as a single entity. No code change is actually needed since `extract-claims.ts` receives evidence as a parameter — it doesn't load files. This is a non-issue upon closer inspection.

## 4. Add world.test.ts coverage for edge cases
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` (score 91) is the second-worst file. It tests world state reader functions (`checkUnreviewedCommits`, `countUnresolvedCritiques`, etc.) but the actual functions in `src/state/world.ts` have edge cases around missing `.shoe-makers/state/` directories, empty last-reviewed-commit files, and git errors. Adding edge case tests would improve the health score from 91 toward 95+.
