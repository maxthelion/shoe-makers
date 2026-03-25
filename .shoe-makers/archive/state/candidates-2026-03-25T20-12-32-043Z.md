# Candidates

## 1. Split setup.ts into focused modules
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is the largest file at 342 lines with multiple responsibilities: running assessment, evaluating the behaviour tree, writing the action file, and shift logging. The architecture wiki page (`wiki/pages/architecture.md`) emphasizes separation of concerns. Extracting the action-writing logic and assessment-formatting logic into separate modules would reduce complexity and make each piece independently testable. This directly improves maintainability of the orchestration layer.

## 2. Reduce `as any` usage in the three worst-scoring test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: The three worst-scoring files (`src/__tests__/prompt-builders.test.ts` at 94, `src/__tests__/prompt-helpers.test.ts` at 94, `src/__tests__/prompts-features.test.ts` at 94) are the only files below 95/100. `prompt-helpers.test.ts` contains 15+ inline `{...} as any` Assessment objects when the existing `makeAssessment()` helper in `test-utils.ts` already handles this pattern. Replacing the inline `as any` casts with `makeAssessment()` calls would improve type safety and potentially improve health scores.

## 3. Split shift-summary.ts into focused helpers
**Type**: health
**Impact**: low
**Reasoning**: `src/log/shift-summary.ts` (286 lines) contains trace analysis, process pattern detection, and narrative generation in one file. The trace analysis and narrative building are distinct concerns that could be separated. Lower priority since the file is internally well-structured, but it's the second-largest file after setup.ts.

## 4. Update wiki creative-exploration page to document corpus management
**Type**: doc-sync
**Impact**: low
**Reasoning**: The `src/creative/fallback-concepts.ts` module was just extracted from `wikipedia.ts`. The wiki page `wiki/pages/creative-exploration.md` should be checked to ensure it accurately describes the current file structure of the creative subsystem, including the new separation of data and logic. Minor documentation alignment.
