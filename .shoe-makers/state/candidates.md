# Candidates

## 1. Extract formatAction and readWikiOverview from setup.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is now one of the three worst files (94/100) at 342 lines. `formatAction()` (lines 274-315, 42 lines) and `readWikiOverview()` (lines 317-335, 18 lines) are pure functions with no dependency on the rest of setup.ts's state. Moving them to a new `src/scheduler/format-action.ts` module would reduce setup.ts below 280 lines and improve its health score.

## 2. Reduce boilerplate in prompt-builders.test.ts
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` (339 lines, 94/100) has many tests that call prompt builders and check for string presence. The test structure is clean but verbose. Many tests could be slightly condensed without losing clarity. However, changes here are cosmetic since the file is already well-organized.

## 3. Reduce helper duplication in prompts-features.test.ts
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/prompts-features.test.ts` (326 lines, 94/100) defines local helpers (`expectPromptContains`, `makeSkillMap`, `makeSkill`) that could potentially be shared via test-utils. However, these helpers are specific to this file's testing pattern and moving them may not clearly improve the score.
