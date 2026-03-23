# Reduce invariants.test.ts complexity — improve health score

skill-type: octoclean-fix

## Context

`src/__tests__/invariants.test.ts` has the lowest health score (94/100) in the codebase at 339 lines. There are two main opportunities for improvement.

## What to change

### 1. De-duplicate `extractInvariantClaims` import (lines 110–145)

Three tests in the `extractInvariantClaims` describe block each independently do:
```typescript
const { extractInvariantClaims } = await import("../verify/extract-claims");
```

Extract this to a shared variable or move the import to the top level alongside the existing `extractClaims` import on line 6.

### 2. Simplify the "multiple claims from same page" test (lines 255–301)

This test creates 6 `writeSourceFile` calls for files that aren't directly relevant to the test (blackboard.ts, prioritise.ts, tick.ts, default-tree.ts). The test's purpose is to verify that claims from the same page can have different statuses — it only needs the evaluator source + test (matching one claim) while the LLM claim has no matching source.

Remove the extra `writeSourceFile` calls that don't affect the test outcome (lines 274-289). Keep only the ones needed for the evaluator claim to match.

### 3. Archive remaining resolved findings

Move `critique-2026-03-23-087.md` and `critique-2026-03-23-088.md` from `.shoe-makers/findings/` to `.shoe-makers/findings/archive/` using `git mv`.

## What NOT to change

- Do not change any test assertions or expected values
- Do not modify other test files
- Do not change files outside `src/__tests__/invariants.test.ts` and `.shoe-makers/findings/`

## Verification

- `bun test src/__tests__/invariants.test.ts` must pass with the same number of tests
- `bun test` full suite must pass
- The file should be shorter (target: under 310 lines)
