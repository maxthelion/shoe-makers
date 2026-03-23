# Extract prompt builders into src/prompts/ modules

skill-type: octoclean-fix

## Context

`src/prompts.ts` is the lowest-scoring file in the codebase at 93/100. It contains 361 lines with 16 functions — all prompt builder logic in a single file. The codebase already uses directory-based organisation for `src/skills/`, `src/state/`, `src/tree/`, etc.

## What to build

Split `src/prompts.ts` into a `src/prompts/` directory:

### File structure

```
src/prompts/
  index.ts          — re-exports generatePrompt and ACTION_TO_SKILL_TYPE (public API unchanged)
  helpers.ts        — OFF_LIMITS, findSkillForAction, formatSkillSection, formatTopGaps, formatCodebaseSnapshot, formatSkillCatalog, determineTier, TierInfo
  reactive.ts       — buildFixTestsPrompt, buildFixCritiquePrompt, buildCritiquePrompt, buildReviewPrompt, buildInboxPrompt
  three-phase.ts    — buildExplorePrompt, buildPrioritisePrompt, buildExecutePrompt, buildDeadCodePrompt
```

### Steps

1. Create `src/prompts/` directory
2. Create `src/prompts/helpers.ts` — move helper functions and constants:
   - `OFF_LIMITS` constant
   - `ACTION_TO_SKILL_TYPE` map (export it)
   - `findSkillForAction` function
   - `formatSkillSection` function
   - `formatTopGaps` function
   - `formatCodebaseSnapshot` function
   - `formatSkillCatalog` function
   - `determineTier` function and `TierInfo` interface
3. Create `src/prompts/reactive.ts` — move reactive prompt builders:
   - `buildFixTestsPrompt`
   - `buildFixCritiquePrompt`
   - `buildCritiquePrompt`
   - `buildReviewPrompt`
   - `buildInboxPrompt`
   - Import `OFF_LIMITS` from helpers
4. Create `src/prompts/three-phase.ts` — move three-phase prompt builders:
   - `buildExplorePrompt`
   - `buildPrioritisePrompt`
   - `buildExecutePrompt`
   - `buildDeadCodePrompt`
   - Import helpers from `./helpers`
5. Create `src/prompts/index.ts` — the switch statement and re-exports:
   - Import all builders from reactive and three-phase
   - Import `ACTION_TO_SKILL_TYPE` and `findSkillForAction` from helpers
   - Export `generatePrompt` and `ACTION_TO_SKILL_TYPE`
6. Delete `src/prompts.ts`
7. Run `bun test` — all existing tests in `src/__tests__/prompts.test.ts` must pass without changes (they import from `../prompts` which resolves to `../prompts/index.ts`)

### Patterns to follow

- Look at `src/skills/registry.ts` and `src/state/blackboard.ts` for how other modules export from directories
- Keep all function signatures identical — this is a pure refactor
- Each file should have its own imports (don't re-export types through the barrel)

### Tests to write

No new tests needed — this is a pure refactor. All 20+ existing prompt tests must pass unchanged. The import path `../prompts` resolves to `../prompts/index.ts` automatically.

After refactoring, run `bun test` to verify. If any test fails, it means an export was missed.

### What NOT to change

- Do NOT modify `src/__tests__/prompts.test.ts` — the tests must work as-is
- Do NOT change any function signatures or behaviour
- Do NOT modify any other files outside the prompts module
- Do NOT add new features or change prompt text
- Do NOT modify `.shoe-makers/invariants.md`
