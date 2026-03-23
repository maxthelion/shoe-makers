# Candidates

## 1. Add test coverage for missing skill templates
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/init-skill-templates.ts` (health score 92, the worst file) exports 9 skill templates but `src/__tests__/init-templates.test.ts` only tests 5 of them. The untested exports are `OCTOCLEAN_FIX_SKILL`, `BUG_FIX_SKILL`, `DEAD_CODE_SKILL`, and `DEPENDENCY_UPDATE_SKILL`. These are all imported and used in `src/init.ts` (lines 14-17, scaffolded to `.shoe-makers/skills/` at lines 57-60) but lack direct test assertions. Adding tests would improve the health score of the worst file and close an untested gap. Invariant `spec.how-it-does-the-work.skills-are-self-contained-markdown-files` covers skill definitions — tests should verify these templates contain required fields (title, when-to-apply, instructions, verification-criteria).

## 2. Reduce complexity in evaluate.test.ts via StateBuilder helper
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `src/__tests__/evaluate.test.ts` (health 94) has 31 tests all calling `makeState()` with inline overrides. A `StateBuilder` pattern (e.g. `StateBuilder.new().withTestsFailing().build()`) would reduce visual repetition and improve readability. This is purely a style improvement — no correctness issues. The file is 323 lines; a builder could save ~30 lines and make each test's intent clearer. Low priority since the tests are already good.

## 3. Reduce complexity in invariants.test.ts via test fixtures
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `src/__tests__/invariants.test.ts` (health 94) uses inline multi-line YAML strings for claim-evidence setup. Extracting these to a shared fixture constant would reduce line count and make the test data reusable. Same as #2: purely style, no correctness issues. Low priority.

## 4. Verify README accuracy against current capabilities
**Type**: doc-sync
**Impact**: medium
**Confidence**: medium
**Risk**: low
**Reasoning**: The explore agent checked README.md and found it generally accurate (bun run setup, bun run tick, bun run wiki all match). However, since session 1 added Wikipedia creative lens, insight lifecycle, and new config keys (insight-frequency), the README/CLAUDE.md may not mention these newer features. Worth a focused doc-sync pass to ensure the project documentation matches the current state. Wiki page `project-documentation` specifies README should reflect current capabilities.

## 5. Extract test helper makeState() into shared test-utils
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: Multiple test files define their own `makeState()` or `makeWorldState()` helpers (evaluate.test.ts, setup.test.ts, prompts.test.ts). These could be consolidated into a single shared helper in test-utils.ts to reduce duplication. However, each version has slightly different defaults tailored to what that test file needs, so this may not be a clean extraction. Needs investigation before committing.
