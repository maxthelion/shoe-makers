# Candidates

## 1. Reduce setup.ts complexity (octoclean score 91)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/setup.ts` is flagged as the 3rd worst file (score 91) at 397 lines. The `main()` function handles branch setup, assessment, gate checks (health regression + commit-or-revert), permission violation detection, finding archival, state file archival, tree evaluation, and prompt writing — too many concerns in one function. Extracting branch setup, verification gates, and violation detection into separate modules would improve readability and testability. The spec page `wiki/pages/verification.md` describes these as distinct responsibilities. This is a pure refactoring — no behavior change needed.

## 2. Improve prompts.test.ts health (octoclean score 87)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is the worst file in the codebase (score 87) at 563 lines. It tests all 12 prompt builders in a single file. Splitting it by prompt category — reactive prompts (fix-tests, fix-critique, critique, continue-work, review, inbox) and three-phase prompts (explore, prioritise, execute-work-item, dead-code, innovate, evaluate-insight) — would reduce per-file complexity and make test maintenance easier. `src/__tests__/prompt-builders.test.ts` (score 90, 413 lines) could similarly benefit from splitting. These are the two worst-scoring files.

## 3. Add test coverage for deferred tests in init.test.ts
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/__tests__/init.test.ts` tests the init system but has incomplete edge case coverage. The init module (`src/init.ts`) handles scaffolding `.shoe-makers/` structure including protocol, config, skills, and schedule — getting init right is important for new users per `wiki/pages/integration.md`. Adding tests for permission errors, partial existing structures, and idempotent re-runs would strengthen confidence. `src/__tests__/health-scan.test.ts` also has conditional skips (skipIf octoclean unavailable) — these are appropriate given the external dependency, not a gap to fix.

## 4. Sync README innovation section (minor duplication)
**Type**: doc-sync
**Impact**: low
**Reasoning**: `README.md` lines 33-37 describe the innovation tier twice — once in the tree explanation paragraph and again in a standalone paragraph immediately after. The second paragraph ("When all invariants are met...") repeats information from lines 33 ("At innovation tier..."). This duplication could confuse readers. A small edit to merge or deduplicate would improve clarity. Per `wiki/pages/wiki-as-spec.md`, documentation should be clear and non-redundant.

## 5. Creative insight: Antifragile test selection
**Type**: health
**Impact**: low
**Reasoning**: Through the **antifragility** lens: the current test suite (890 tests) runs all tests on every assessment. An antifragile system would learn from failures — tests that have never caught a regression are less valuable than tests that have. While implementing test prioritization is over-engineering for now, a simpler antifragile pattern exists: the `worstFiles` tracking already identifies fragile code areas. The system could weight candidates higher when they touch files that have historically needed fixes (observable via shift logs). This is a speculative improvement — noting it here but ranking it lowest as the current system works well at health 99/100.
