# Candidates

## 1. Add "mixed reactive and explore" test for buildDescription arc narrative
**Type**: test-coverage
**skill-type**: test
**Impact**: medium
**Reasoning**: Critique-119 identified that the new `buildDescription` arc narrative has two code paths: "started reactive, then stabilised" (when reactive precedes explore) and "mixed reactive and explore" (otherwise). The first path is tested in `src/__tests__/shift-summary.test.ts` but the second path ("mixed reactive and explore") has zero test coverage. This is a concrete gap — untested code that was just added. The fix in `src/log/shift-summary.ts:155-163` handles the chronological ordering logic but only the happy path is verified. A test should create steps where explore traces come before reactive traces and assert the "mixed" description appears.

## 2. Add verify skill invariant re-check after work execution
**Type**: implement
**skill-type**: implement
**Impact**: high
**Reasoning**: The verify skill (`src/skills/verify.ts:21-24`) explicitly documents that the full version per wiki spec (`wiki/pages/verification.md`) should re-check invariants after changes, but currently only checks test pass/fail and health regression. Re-running the invariant pipeline after work would catch cases where code changes silently break spec assertions. The invariants checker already exists in `src/verify/` — it just needs to be called from the verify skill and any new failures surfaced as findings.

## 3. Surface permission violations as structured findings
**Type**: implement
**skill-type**: implement
**Impact**: high
**Reasoning**: Permission violation detection exists in `src/verify/detect-violations.ts` and is surfaced in the critique prompt (in `src/prompts/reactive.ts`), but violations aren't written as structured finding files. If a permission violation is detected, it should create a `.shoe-makers/findings/` file with severity "blocking" so the tree's `unresolved-critiques` condition catches it deterministically. Currently, violations only appear in the prompt text and rely on the LLM reviewer to notice and write the finding manually. This makes the quality gate more robust without adding LLM cost. Relevant spec: `.shoe-makers/invariants.md` section 1.5.

## 4. CHANGELOG creation and maintenance
**Type**: doc-sync
**skill-type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/invariants.md` section 3.5 states "The CHANGELOG tracks user-facing changes in Keep a Changelog format" but no CHANGELOG file exists in the repository. This is a spec-code inconsistency. Creating the initial CHANGELOG.md with entries derived from git history would align with the spec and provide users with a clear record of project evolution. The explore action should also flag CHANGELOG drift as a candidate in future cycles.

## 5. Test quality heuristic checker
**Type**: implement
**skill-type**: implement
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` describes verification checks that should include test quality assessment — "are tests trivial or real?" Currently no programmatic support exists; this relies entirely on the LLM reviewer. A lightweight checker in `src/verify/` could flag: test files that don't assert anything, test files that don't import the module under test, and test functions with only `expect(true).toBe(true)` patterns. This would surface test quality issues as structured data for the reviewer, making critiques more targeted.
