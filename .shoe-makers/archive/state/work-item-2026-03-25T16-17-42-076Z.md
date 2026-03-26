# Split prompts.test.ts to improve health score

skill-type: octoclean-fix

## Context

`src/__tests__/prompts.test.ts` is the worst file in the codebase (octoclean score 87, 563 lines). It tests all 12 prompt types in a single file. Splitting it into two focused files will improve the health score.

## What to do

Split `src/__tests__/prompts.test.ts` into two files:

### 1. `src/__tests__/prompts-core.test.ts` — Core prompt behavior (lines 1-230)

Should contain:
- Shared imports and test utilities (`freshAssessment`, `makeState`, `makeSkillMap`, `makeSkill`, `expectPromptContains`, `allActions`)
- `describe("generatePrompt")` — cross-cutting tests (all actions mention invariants, each returns non-empty prompt)
- `describe("generatePrompt includes skill content for work actions")` — skill body inclusion tests
- `describe("ACTION_TO_SKILL_TYPE matches real skill files")` — disk integration tests

### 2. `src/__tests__/prompts-features.test.ts` — Feature-specific prompt tests (lines 231-563)

Should contain:
- Shared utilities (copy `freshAssessment`, `makeState`, `makeAssessment`, `makeStateWithAssessment` — or extract into `test-utils.ts` if not already there)
- `describe("explore prompt process temperature")`
- `describe("explore and prioritise tier switching")`
- `describe("explore prompt skill catalog")`
- `describe("parseActionTypeFromPrompt")`
- `describe("critique prompt permission violations")`
- `describe("insight lifecycle in prompts")`
- `describe("innovate prompt")`
- `describe("evaluate-insight prompt")`

## Patterns to follow

- Both files should import from `../prompts` and `../types` like the original
- Use `emptyBlackboard` from `./test-utils`
- Keep all test logic identical — just split across files
- The helper functions `makeAssessment` and `makeStateWithAssessment` are only used in the second file (from line 232 onward), so they only need to be in `prompts-features.test.ts`
- `makeSkillMap` and `makeSkill` are used in both files, so define them in both (or add to test-utils.ts)

## What NOT to change

- Do NOT change any test logic or assertions
- Do NOT modify `src/prompts/` source code
- Do NOT delete the original file until both new files pass
- Do NOT modify `prompt-builders.test.ts` (separate concern)

## Verification

1. `bun test` must pass with same count (906 tests)
2. Delete the original `prompts.test.ts` after confirming
3. Both new files should be under 350 lines each

## Decision Rationale

Picked candidate #1 over #2 (README fix) because it addresses the worst health file in the codebase and improves a tracked metric. README duplication is cosmetic. The state says "prefer improvement" and this directly improves code health scores.
