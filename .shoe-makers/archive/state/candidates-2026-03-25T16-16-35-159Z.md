# Candidates

## 1. Improve prompts.test.ts health (octoclean score 87)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` remains the worst file in the codebase (score 87, 563 lines). It tests all 12 prompt builders in a single file. Splitting reactive prompt tests (fix-tests, fix-critique, critique, continue-work, review, inbox) into `reactive-prompts.test.ts` and three-phase prompt tests (explore, prioritise, execute-work-item, dead-code, innovate, evaluate-insight) into `three-phase-prompts.test.ts` would reduce per-file complexity. Similarly `prompt-builders.test.ts` (score 90, 413 lines) tests prompt formatting helpers and could be split. These are the two worst health files. Per `wiki/pages/verification.md`, keeping code health high is an explicit system goal.

## 2. Fix README innovation tier duplication
**Type**: doc-sync
**Impact**: low
**Reasoning**: `README.md` lines 33 and 37 describe the innovation tier twice with overlapping content. Line 33 says "At innovation tier (all invariants met, health good), the tree routes to Innovate instead of Explore..." and line 37 repeats "When all invariants are met and code health is good, the system enters the innovation tier...". This redundancy makes the README harder to scan. Per `wiki/pages/wiki-as-spec.md`, documentation should be authoritative and clear. The fix is simple: remove the duplicate paragraph (line 37) since line 33 already explains the concept in context.

## 3. Add tests for findValidationPatterns helper
**Type**: test-coverage
**Impact**: low
**Reasoning**: The `findValidationPatterns` function extracted to `src/prompts/helpers.ts` during the just-completed refactoring has no dedicated tests. It's used by critique prompts to look up skill-specific validation patterns. While the logic is simple (parse action type → look up skill type → find matching skill → return patterns), testing it would verify the integration between action types, skill types, and validation patterns. The function has 4 branches: no previous action, unrecognized action, no matching skill type, and successful pattern lookup.
