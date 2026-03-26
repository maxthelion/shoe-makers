# Candidates

## 1. Implement structured critique skill template with pre-filled context
**Type**: implement
**Impact**: high
**Reasoning**: The `wiki/pages/structured-skills.md` spec and inbox message `structured-skills.md` describe semi-deterministic skill templates where setup pre-fills mechanical parts. The critique skill is the #1 priority because format compliance wastes the most ticks. Currently `src/prompts/critique.ts` generates a free-form prompt. The spec says setup should: (1) auto-number the critique filename and include it in the prompt, (2) pre-fill the diff and commit range from `last-reviewed-commit..HEAD`, (3) define exact output sections (Changes Reviewed, Assessment, Issues Found, Status), (4) include the status format regex so the elf can't get the format wrong. Implementation: update `src/setup.ts` to gather diff/commit-range when action is `critique`, pass it to `buildCritiquePrompt`, and update the prompt to include pre-filled sections with `[YOUR JUDGEMENT HERE]` placeholders.

## 2. Reduce prompts.test.ts further — extract describe blocks to separate files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is still the worst file at 87. It has 739 lines testing `generatePrompt`, `parseActionTypeFromPrompt`, `determineTier`, `isInnovationTier`, `findSkillForAction`, `formatTopGaps`, `formatCodebaseSnapshot`, and `formatSkillCatalog`. The helper-function tests (`determineTier`, `isInnovationTier`, `findSkillForAction`, formatters) belong in `src/__tests__/prompt-helpers.test.ts` which already exists but was created separately. Moving these would reduce `prompts.test.ts` to ~350 lines (just `generatePrompt` integration tests) and consolidate helper tests in one file.

## 3. Add RESOLVED_PATTERN export test and archive directory handling
**Type**: test-coverage
**Impact**: low
**Reasoning**: `RESOLVED_PATTERN` is exported from `src/state/world.ts` and used by `countUnresolvedCritiques`. The archive directory (`findings/archive/`) contains resolved findings but the `countUnresolvedCritiques` function only reads direct children of `findings/`. If someone accidentally puts an unresolved critique in the archive, it would be ignored — which is correct but untested. Low priority since the behavior is already correct.
