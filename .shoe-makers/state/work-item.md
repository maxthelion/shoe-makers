# Extract shared test helpers to test-utils.ts

skill-type: health

## Context

Four test files duplicate identical helper functions:
- `emptyBlackboard()` — defined in `evaluate.test.ts:6`, `shift.test.ts:12`, `prompts.test.ts:7`, `tick.test.ts:5`
- `freshAssessment` — defined in `evaluate.test.ts:15`, `shift.test.ts:21`, `prompts.test.ts:16`, `tick.test.ts:14`
- `makeState()` — defined in `evaluate.test.ts:34`, `tick.test.ts:33`, `prompts.test.ts:35`

## What to build

Create `src/__tests__/test-utils.ts` that exports:
- `emptyBlackboard(): Blackboard`
- `freshAssessment: Assessment` (as a frozen constant)
- `makeState(overrides?: Partial<WorldState>): WorldState`

Then update each test file to import from `test-utils.ts` instead of defining its own copy.

## Patterns to follow

- The existing helpers are identical across files — pick any one as the canonical implementation
- `evaluate.test.ts` has the most complete `makeState()` with overrides support — use that version
- Export as named exports, not default
- Keep `failingTestsBlackboard()` in `evaluate.test.ts` since it's only used there

## Tests to write

No new tests needed — this is a pure refactoring. All 496 existing tests must continue to pass.

## What NOT to change

- Do not change test logic or assertions
- Do not add new test cases
- Do not modify source code (only test files)
- Do not change `init-templates.test.ts` — its helpers are different (SKILL_TEMPLATES list)
- Do not move file-specific helpers that are only used in one test file
