# Candidates

## 1. Improve evaluate.test.ts quality score (94→higher)
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: `src/__tests__/evaluate.test.ts` is one of three files tied at 94/100 as the worst in the codebase. At 324 lines with many similar `makeState()` calls, it could benefit from parameterizing repetitive test cases for priority ordering. However, the tests are well-written and functional — this is purely cosmetic. The improvement would be marginal.

## 2. Improve prompts.test.ts quality score (94→higher)
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: `src/__tests__/prompts.test.ts` is 94/100. Similar pattern — large test file with repetitive structure. Could extract shared test setup or parameterize similar test cases. Marginal improvement.

## 3. Improve invariants.test.ts quality score (94→higher)
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: `src/__tests__/invariants.test.ts` is 94/100. Uses temporary directories with repeated helper functions (writeWikiPage, writeSourceFile, writeTestFile). Could extract to a shared test fixture module. Marginal improvement.
