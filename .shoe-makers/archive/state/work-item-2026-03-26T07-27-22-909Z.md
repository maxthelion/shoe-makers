skill-type: health

# Improve code health of worst-scoring test files

## Wiki Spec

From `wiki/pages/verification.md`: Code health is tracked via octoclean. Health scores should not regress.

## Current Code

Setup reports health at 99/100 with worst files:
- `src/__tests__/assess.test.ts` (94)
- `src/__tests__/prompt-helpers.test.ts` (94)
- `src/__tests__/invariants.test.ts` (95)

These are the only files pulling health below 100.

## What to Build

Improve the code health score of `src/__tests__/assess.test.ts` by reducing complexity:

1. Read `src/__tests__/assess.test.ts` and identify complexity hotspots
2. Run `npx octoclean scan src/__tests__/assess.test.ts` to see specific issues
3. Extract repeated test setup patterns into shared helpers
4. Reduce cognitive complexity by breaking large describe blocks into smaller focused ones
5. Run `bun test` to confirm nothing breaks
6. Run `npx octoclean scan src/__tests__/assess.test.ts` to verify improvement

## Patterns to Follow

Look at `src/__tests__/world-critiques.test.ts` for clean test structure patterns.

## Tests to Write

No new tests — this is a refactor of existing tests.

## What NOT to Change

- Do NOT modify any source code in `src/` (only test files)
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change test behaviour — only refactor structure
- Do NOT modify `src/__tests__/prompt-helpers.test.ts` or `src/__tests__/invariants.test.ts` — focus on assess.test.ts only

## Decision Rationale

All 5 original candidates were stale (modules already have tests). Instead, addressing the octoclean health score warnings — these are the only files preventing 100/100 health.
