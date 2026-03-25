# Extract formatAction and readWikiOverview from setup.ts

skill-type: health

## Context

`src/setup.ts` (342 lines) is one of the three worst-scoring files at 94/100. It contains two pure functions that have no dependency on setup's orchestration state and can be cleanly extracted:

- `formatAction()` (lines 274-315): Generates the action markdown from a skill, state, inbox messages, and other context. A pure function.
- `readWikiOverview()` (lines 317-335): Reads wiki files and produces a summary string. A pure async function.

## What to do

1. Create `src/scheduler/format-action.ts` containing:
   - `formatAction()` — move the function as-is
   - `readWikiOverview()` — move the function as-is
   - Required imports: `generatePrompt` from `../prompts`, `ActionType` from `../types`, `SkillDefinition` from `../skills/registry`, `readFile` from `fs/promises`, `join` from `path`

2. Update `src/setup.ts`:
   - Remove `formatAction()` and `readWikiOverview()` function definitions
   - Add `import { formatAction, readWikiOverview } from "./scheduler/format-action"`
   - Re-export both functions: `export { formatAction, readWikiOverview } from "./scheduler/format-action"` (for backward compatibility — tests import `formatAction` from setup.ts: `src/__tests__/setup.test.ts`)

3. Check test imports — `src/__tests__/setup.test.ts` may import `formatAction` from `"../setup"`. The re-export ensures this still works.

## Files affected

- `src/setup.ts` — remove two functions, add import + re-export
- `src/scheduler/format-action.ts` — new file with the extracted functions

## Patterns to follow

- Same pattern as the FALLBACK_CONCEPTS extraction: move to new file, re-export from old file
- Keep the same function signatures — no API changes

## Tests to verify

Run `bun test` — all 888 tests must pass unchanged.

## What NOT to change

- Do not modify test files
- Do not change function signatures or behavior
- Do not modify `.shoe-makers/invariants.md`
- Do not extract other functions from setup.ts — keep this focused

## Decision Rationale

Chosen over test file improvements (#2 and #3) because setup.ts is a production file that appears in the worst files list, and the extraction is clean and zero-risk. The two test files (prompt-builders, prompts-features) are harder to improve without more invasive changes.
