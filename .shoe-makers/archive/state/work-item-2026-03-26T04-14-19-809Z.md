skill-type: health

# Split prompts.test.ts into domain-focused test files

## Wiki Spec

From `wiki/pages/verification.md` (lines 1-48): The verification spec describes role-based permissions with clear domains — reactive actions (fix-tests, fix-critique, critique, review, continue-work, inbox), orchestration actions (execute-work-item, prioritise, explore, dead-code), and creative actions (innovate, evaluate-insight). Tests should mirror this domain structure for maintainability.

## Current Code

`src/__tests__/prompts.test.ts` (508 LOC, health score 87 — worst file in codebase):
- Lines 1-109: Core `generatePrompt` tests — all 12 ActionTypes tested in data-driven loops, plus `promptCases` table
- Lines 111-173: Skill integration tests (makeSkill, skill maps, dead-code skill, non-work actions)
- Lines 175-198: ACTION_TO_SKILL_TYPE mapping tests (disk-loaded skills)
- Lines 200-293: Explore prompt specifics — creative lens (200-218), process temperature (220-250), tier switching (252-276), skill catalog (278-293)
- Lines 295-333: parseActionTypeFromPrompt tests
- Lines 335-354: Critique permission violations tests
- Lines 356-393: Insight lifecycle tests
- Lines 395-462: Innovate prompt tests
- Lines 464-497: Evaluate-insight prompt tests
- Lines 499-508: Exhaustiveness test

Shared test utilities used: `makeState()` (local), `makeAssessment`/`makeStateWith` from `test-utils.ts`, `expectPromptContains` helper (local).

## What to Build

Split `src/__tests__/prompts.test.ts` into three domain-focused files:

1. **`src/__tests__/prompts-core.test.ts`** (~170 LOC):
   - Move the shared helpers: `makeState()`, `expectPromptContains()`, `makeSkillMap()`, `makeSkill()`
   - Export `makeState`, `expectPromptContains`, `makeSkillMap`, `makeSkill` so sibling files can import them
   - Move: `generatePrompt` describe block (lines 43-108), skill integration describe block (lines 131-173), ACTION_TO_SKILL_TYPE describe block (lines 175-198), parseActionTypeFromPrompt describe block (lines 295-333), exhaustiveness describe block (lines 499-508)

2. **`src/__tests__/prompts-reactive.test.ts`** (~80 LOC):
   - Import shared helpers from `prompts-core.test.ts`
   - Move: critique permission violations describe block (lines 335-354)
   - Note: Most reactive action tests are already in the `promptCases` table in core — only the critique permission violations need their own file because they test a distinct feature

3. **`src/__tests__/prompts-creative.test.ts`** (~250 LOC):
   - Import shared helpers from `prompts-core.test.ts`
   - Move: explore creative lens (lines 200-218), explore process temperature (lines 220-250), explore/prioritise tier switching (lines 252-276), explore skill catalog (lines 278-293), insight lifecycle (lines 356-393), innovate prompt (lines 395-462), evaluate-insight prompt (lines 464-497)

After splitting, delete the original `prompts.test.ts`.

## Patterns to Follow

Follow the existing test file organization pattern:
- Each file imports from `bun:test` (`describe`, `test`, `expect`)
- Each file imports the functions it tests from their source modules
- Helper functions that are file-local use plain `function` declarations
- Shared helpers are imported from `./test-utils`
- New shared helpers specific to prompts testing should be in a `prompts-test-helpers.ts` file or exported from `prompts-core.test.ts`

Look at how `src/__tests__/world.test.ts` and `src/__tests__/evaluate.test.ts` are structured for patterns.

## Tests to Write

No new tests needed — this is a pure refactor of existing tests. All 66 existing tests must pass after the split. Run `bun test` to verify all tests still pass and no tests were lost.

Verify: `bun test` should report the same total test count before and after.

## What NOT to Change

- Do NOT modify any source code in `src/` (only test files)
- Do NOT change test logic or assertions — only move tests between files
- Do NOT modify `src/__tests__/test-utils.ts` (use it as-is)
- Do NOT rename any describe blocks or test labels
- Do NOT add, remove, or modify any test cases
- Do NOT touch `.shoe-makers/invariants.md`

## Decision Rationale

Candidate 3 chosen over candidates 1 and 2 because:
- **Highest health impact**: prompts.test.ts is the worst file (87) vs world.test.ts (88) and setup.test.ts (91)
- **Structural improvement**: Splitting creates better domain organization matching the spec's reactive/orchestration/creative domains
- **Largest file**: At 508 LOC it's the biggest test file, so splitting has the most benefit for maintainability
- **Low risk**: Pure file reorganization with no logic changes — easy to verify by test count
- Candidates 1 and 2 are lower-impact fixes (fragile test pattern, test isolation) that can be addressed in future cycles
