# Candidates

## 1. Fix fragile Wikipedia observability test in setup.test.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/__tests__/setup.test.ts` tests Wikipedia fetch observability by reading the source code of `src/creative/wikipedia.ts` and asserting it contains a specific log message string (source inspection pattern). This is fragile — if the log message changes, the test breaks even though functionality works fine. Should mock `appendToShiftLog()` instead. This is in one of the 3 worst health files (score 91). Fixing this improves both test quality and maintainability.

## 2. Improve test isolation in world.test.ts to avoid repo state pollution
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` (health score 88) writes `.shoe-makers/state/last-reviewed-commit` to the actual repo directory during tests, with beforeEach/afterEach cleanup. If tests are interrupted, this pollutes the repo state and can interfere with the behaviour tree's unreviewed-commits detection. Tests should use isolated temp directories for all file I/O operations, similar to how other test files handle it. This would improve both reliability and the health score.

## 3. Reduce complexity in prompts.test.ts by splitting into domain-focused test files
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` (health score 87, worst file) has 508 LOC covering all 12 ActionTypes with loop-based parameterized tests plus helper function tests. Splitting into `prompts-reactive.test.ts`, `prompts-orchestration.test.ts`, and `prompts-creative.test.ts` would reduce per-file complexity, improve the health score, and make test failures easier to diagnose. Each sub-file would be under 200 LOC.
