# Candidates

## 1. Sync README tree diagram with actual behaviour tree
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README tree diagram is missing the `[review-loop ≥3?] → Explore` node that exists in `src/tree/default-tree.ts:103`. This circuit breaker is an important safety mechanism that prevents infinite review loops. The README should accurately reflect the tree since it's the first thing users see. The wiki page `behaviour-tree.md` likely also needs checking for consistency. Files affected: `README.md`, possibly `wiki/pages/behaviour-tree.md`.

## 2. Add test coverage for prompts/helpers.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/prompts/helpers.ts` contains business logic used by the behaviour tree — `isInnovationTier()`, `determineTier()`, `parseActionTypeFromPrompt()`, `findSkillForAction()`. These functions determine routing decisions. While `prompts.test.ts` covers `generatePrompt` and `parseActionTypeFromPrompt`, functions like `determineTier()`, `isInnovationTier()`, `findSkillForAction()`, `formatTopGaps()`, `formatCodebaseSnapshot()`, and `formatSkillCatalog()` are not directly unit tested. Adding targeted tests would catch regressions in tier routing logic.

## 3. Remove or integrate dead `skills/verify.ts` module
**Type**: dead-code
**Impact**: low
**Reasoning**: `src/skills/verify.ts` exports a `verify()` function that is only imported by its own test file (`src/__tests__/verify.test.ts`). It is never called by `setup.ts`, `shift.ts`, `tick.ts`, or any other production code. The wiki spec describes verification as a responsibility of the scheduler, and the current system handles verification differently (through the critique/review cycle in the behaviour tree). This module is either dead code that should be removed, or an incomplete feature that needs integration. Either way it currently contributes to confusion about the verification architecture.

## 4. Add test coverage for edge cases in schedule.ts midnight-wrap
**Type**: test
**Impact**: low
**Reasoning**: The wiki spec (`scheduled-tasks.md`) emphasizes midnight-wrap as a critical feature — shifts that start at 22:00 and end at 06:00 need the branch dated for the start of shift, not the current calendar date. While `schedule.test.ts` exists, verifying that `getShiftDate()` correctly returns yesterday's date when it's 2am on a midnight-wrap shift is important for correctness. A bug here would create wrong branch names and break the entire shift.
