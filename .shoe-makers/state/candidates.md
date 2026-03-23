# Candidates

## 1. Extract duplicated fileExists utility
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `fileExists()` is defined identically in `src/state/world.ts:114-121` and `src/init.ts` (near line 76). Extract to `src/utils/fs.ts` and import in both locations. Simple deduplication.

## 2. Add test for prioritise prompt skill-type metadata guidance
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: The prioritise prompt was updated in commit d26c4e5 to include `skill-type: <type>` guidance, but the existing `prompts.test.ts` test at line 136-140 doesn't verify this new content. A test like `expect(prompt).toContain("skill-type:")` would ensure the metadata guidance survives future edits.

## 3. Improve health of src/__tests__/evaluate.test.ts
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: Health score 94 (second worst). Large test file. Could extract `makeState` helper into a shared test utility since it's duplicated across multiple test files (`evaluate.test.ts`, `tick.test.ts`, `prompts.test.ts`, `shift.test.ts`).
