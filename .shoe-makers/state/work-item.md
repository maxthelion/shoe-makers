# Reduce duplication in worst-scoring test files

skill-type: octoclean-fix

## Goal

Improve the health scores of the three worst files: `src/__tests__/prompt-builders.test.ts` (90), `src/__tests__/prompts-features.test.ts` (90), and `src/__tests__/setup.test.ts` (93) by reducing duplication and extracting shared helpers.

## Problem

`prompts-features.test.ts` defines its own `freshAssessment`, `makeState()`, `makeAssessment()`, and `makeStateWithAssessment()` — duplicating what already exists in `test-utils.ts`. The file is 424 lines when much of the setup boilerplate could use shared utilities.

`prompt-builders.test.ts` already imports `makeState` and `freshAssessment` from `test-utils.ts` — good. But it still has inline assessment construction patterns (lines 194-208, 226-235, 245-252, 291-300) that repeat `{ ...freshAssessment, invariants: { ...freshAssessment.invariants!, ... } }` and the full blackboard construction `{ assessment, priorities: null, currentTask: null, verification: null }`.

`setup.test.ts` defines its own `makeAssessment()` and `makeWorldState()` including an inline `Config` object. It also has a repetitive `logSpy`/`mockRestore` pattern in every test (14 occurrences).

## Changes to make

### 1. In `src/__tests__/prompts-features.test.ts`

- **Delete** the local `freshAssessment`, `makeState()`, `makeAssessment()`, `makeStateWithAssessment()` definitions (lines 7-108)
- **Import** `makeState`, `freshAssessment`, `emptyBlackboard` from `./test-utils`
- **Add** a `makeAssessment()` helper to `test-utils.ts` if not already there:
  ```ts
  export function makeAssessment(
    invariantOverrides: Partial<NonNullable<Assessment["invariants"]>> = {},
    extra: Partial<Assessment> = {},
  ): Assessment {
    return {
      ...freshAssessment,
      invariants: { ...freshAssessment.invariants!, ...invariantOverrides },
      ...extra,
    };
  }
  ```
- **Add** a `makeStateWithAssessment()` helper to `test-utils.ts`:
  ```ts
  export function makeStateWithAssessment(assessment: Assessment): WorldState {
    return makeState({ blackboard: { ...emptyBlackboard(), assessment } });
  }
  ```
- Update all call sites in the file to use the imported helpers

### 2. In `src/__tests__/prompt-builders.test.ts`

- **Replace** the inline assessment+blackboard construction patterns (lines 194-208, 226-235, etc.) with `makeStateWithAssessment(makeAssessment({ specifiedOnly: 5, implementedUntested: 2 }))` from test-utils
- This eliminates the `{ assessment, priorities: null, currentTask: null, verification: null }` repetition

### 3. In `src/__tests__/setup.test.ts`

- **Replace** the local `makeAssessment()` with the shared one from test-utils (note: this one has different defaults — `invariants: null`, `healthScore: null` — so either add an overload or use the shared one with explicit null overrides)
- The `logSpy` pattern appears 14 times. Extract a helper:
  ```ts
  function withLogSpy(fn: (logs: () => string[]) => void) {
    const logSpy = spyOn(console, "log");
    try {
      fn(() => logSpy.mock.calls.map((c: any[]) => c[0]));
    } finally {
      logSpy.mockRestore();
    }
  }
  ```

## Patterns to follow

- Follow the existing pattern in `test-utils.ts` — it already exports `makeState`, `freshAssessment`, `emptyBlackboard`
- Keep test assertions exactly as they are — only change the setup/teardown code
- Prefer shallow overrides (`makeState({ inboxCount: 3 })`) over deep object construction

## Tests to verify

- Run `bun test` — all 903 tests must still pass
- Run `bun run node_modules/octoclean/src/cli/index.ts scan && bun run node_modules/octoclean/src/cli/index.ts report` — worst file scores should improve

## What NOT to change

- Do not change any test assertions or test logic — only refactor setup code
- Do not rename any test descriptions
- Do not add or remove test cases
- Do not modify files outside of `src/__tests__/prompts-features.test.ts`, `src/__tests__/prompt-builders.test.ts`, `src/__tests__/setup.test.ts`, and `src/__tests__/test-utils.ts`
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chose candidate #1 (health improvement) over #2 (test coverage for untested modules) because the instruction says to "prefer implementation, improvement, and creative work over writing more tests." The health improvement is a concrete, measurable task — the octoclean scores for these files can verifiably improve. Candidate #2 (adding new tests) is lower priority when all invariants are met. Candidates #3 and #4 are low-impact.
