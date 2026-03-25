# Candidates

## 1. Reduce repetition in prompt-builders.test.ts and prompts-features.test.ts
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: These are two of the three remaining worst-scoring files (94/100). `prompt-builders.test.ts` (339 lines) and `prompts-features.test.ts` (326 lines) have similar patterns that could benefit from shared helpers. The `prompts-features.test.ts` already defines local helpers (`expectPromptContains`, `makeSkillMap`, `makeSkill`) that could be moved to `test-utils.ts` for shared use. Reducing boilerplate would improve readability and health scores.

## 2. Reduce mock duplication in wikipedia.test.ts
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/wikipedia.test.ts` is now among the three worst files (94/100). It has duplicated `mockFetch` definitions (defined twice: lines 62-64 and 145-147), and repeated `mockSuccessfulFetch` patterns. Extracting the mock setup into shared test helpers would reduce the file's complexity.

## 3. Split setup.ts into focused modules
**Type**: health
**Impact**: low
**Reasoning**: `src/setup.ts` (342 lines) is the largest file. While internally well-organized with clear functions, extracting `formatAction()` (lines 274-315) and `readWikiOverview()` (lines 317-335) into a separate `src/scheduler/format-action.ts` module would reduce the file size. Lower priority since the functions are already well-separated.
