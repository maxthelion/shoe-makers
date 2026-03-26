# Candidates

## 1. Remove dead code: action-constants.ts is an outdated duplicate of action-classification.ts
**Type**: dead-code
**Impact**: medium
**Reasoning**: `src/log/action-constants.ts` is an outdated duplicate of `src/log/action-classification.ts`. The constants file is missing `"continue-work"` in REACTIVE_ACTIONS (making it stale/incorrect). It's only imported by its own test file `src/__tests__/action-constants.test.ts` — no production code uses it. The correct version (`action-classification.ts`) is used by `src/log/shift-summary.ts` and `src/log/shift-log-parser.ts`. Both the dead file and its test file (12 LOC total) should be deleted.

## 2. Improve test isolation in world.test.ts checkUnreviewedCommits tests
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` (health score 88) lines 83-172: the `checkUnreviewedCommits` tests write to the actual repo's `.shoe-makers/state/last-reviewed-commit` file with fragile beforeEach/afterEach guards to save/restore the marker. If tests are interrupted, the marker is left corrupted, affecting the behaviour tree's unreviewed-commits detection. Should refactor to use isolated temp git repos (pattern already exists in the same file at lines 44-55 for `getCurrentBranch`). Would save ~25-30 LOC of guard boilerplate and improve the health score.

## 3. Fix fragile Wikipedia observability test in setup.test.ts
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/setup.test.ts` lines 388-402: tests Wikipedia fetch observability by reading source code of `src/creative/wikipedia.ts` and asserting it contains specific log message strings ("Wikipedia article fetched", "fetch failed"). This breaks if log messages are refactored even if functionality is unchanged. Should be replaced with a behavioral test that mocks `fetchArticleForAction` and verifies `appendToShiftLog` is called. File is health score 91, second-worst in codebase.
