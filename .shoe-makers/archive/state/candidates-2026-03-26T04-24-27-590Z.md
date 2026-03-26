# Candidates

## 1. Improve test isolation in world.test.ts checkUnreviewedCommits tests
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` (health score 88, worst file) lines 83-172: the `checkUnreviewedCommits` describe block writes to the actual repo's `.shoe-makers/state/last-reviewed-commit` with fragile beforeEach/afterEach save/restore guards. If tests are interrupted mid-run, the marker is left corrupted, potentially causing the behaviour tree to incorrectly detect unreviewed commits. The test should create an isolated temp git repo with commits (pattern already exists at lines 44-55 for `getCurrentBranch` tests). This would eliminate ~25 LOC of guard boilerplate and improve the health score.

## 2. Fix fragile Wikipedia observability test in setup.test.ts
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/setup.test.ts` (health score 91) lines 388-402: the "innovate observability" test reads the raw source code of `src/creative/wikipedia.ts` and `src/setup.ts` and asserts they contain specific string literals ("Wikipedia article fetched", "fetch failed", "appendToShiftLog", "fetchArticleForAction"). This is testing implementation details rather than behavior — it breaks on harmless refactors like changing log message text. Should be replaced with a behavioral test that verifies the integration contract between setup and the Wikipedia module.

## 3. Improve prompts-reactive.test.ts by expanding reactive action test coverage
**Type**: test
**Impact**: low
**Reasoning**: `src/__tests__/prompts-reactive.test.ts` is very small (24 LOC, 3 tests) after the prompts.test.ts split — it only covers critique permission violations. Additional reactive-domain tests could be added: verify fix-tests prompt includes test failure output section, verify inbox prompt formats each message with filename, verify review prompt includes commit range. This would make the domain split more meaningful and slightly improve coverage of reactive prompt edge cases. However, most reactive cases are already well-covered in the promptCases table in prompts-core.test.ts.
