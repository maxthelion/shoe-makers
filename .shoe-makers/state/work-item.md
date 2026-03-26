skill-type: health

# Split setup.test.ts into focused test files for health improvement

## Wiki Spec

No specific wiki requirement for test file structure. The codebase convention is to keep test files focused on a single domain (see world.test.ts split and prompts.test.ts split precedents).

## Current Code

`src/__tests__/setup.test.ts` (402 lines, score 91) is the worst-scoring file after the world.test.ts split. It tests 4 exported functions from `src/setup.ts`:

1. **logAssessment** (lines 42-223): 13 tests for console log output — tests pass, fail, typecheck, health score, worst files, invariants, suggestions, uncertainties
2. **readInboxMessages** (lines 226-260): 4 tests for inbox directory reading
3. **formatAction** (lines 262-309, 372-386): 8 tests for prompt formatting
4. **readNotes** (lines 311-369): 4 tests for note file reading
5. **innovate observability** (lines 388-402): 1 test checking source files

The file has shared helpers (`makeAssessment`, `makeWorldState`) and a shared `tempDir` setup.

## What to Build

Split `src/__tests__/setup.test.ts` into 2 files:

1. **`src/__tests__/setup-log-assessment.test.ts`** — All `logAssessment` tests (13 tests, ~182 lines). This is the largest group and benefits most from isolation. Needs: `makeAssessment` helper, `spyOn`.

2. **`src/__tests__/setup-actions.test.ts`** — All remaining tests: `readInboxMessages` (4), `formatAction` (8), `readNotes` (4), innovate observability (1) = 17 tests (~220 lines). Needs: `tempDir` setup, `makeWorldState` helper, `makeAssessment` helper.

3. **Delete** `src/__tests__/setup.test.ts` after the split.

Each file must:
- Import only the functions it tests from `../setup`
- Copy the shared helpers (`makeAssessment`, `makeWorldState`) it needs
- Include its own `beforeEach`/`afterEach` for temp dir setup/teardown
- Keep the exact same test cases — no changes to test logic

## Patterns to Follow

- `src/__tests__/world-git.test.ts`, `world-state-files.test.ts`, `world-critiques.test.ts` — the recent split precedent
- `src/__tests__/prompts-core.test.ts`, `prompts-creative.test.ts`, `prompts-reactive.test.ts` — earlier split

## Tests to Write

No new tests. All existing 30 tests from `setup.test.ts` must pass after the split. Total test count (950) must remain unchanged.

## What NOT to Change

- Do NOT modify any test logic or assertions
- Do NOT modify `src/setup.ts`
- Do NOT add or remove any test cases
- Do NOT modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate 2 from the explore list — next highest-impact health improvement after the world.test.ts split. setup.test.ts is now the worst-scoring file (91). Splitting it will raise the health floor.
