---
type: finding
date: 2026-03-22
status: open
---

# Finding: Test-only work items can't be executed through three-phase cycle

## Issue

Work item "Fix typecheck — add workItemSkillType to test fixtures" requires modifying only test files (`src/__tests__/*.ts`). But the three-phase cycle (explore → prioritise → execute) routes through `execute-work-item`, which has TDD enforcement blocking test file writes.

The typecheck errors (`npx tsc --noEmit` fails) should trigger the `fix-tests` action directly, but the behaviour tree's `testsFailing` condition only checks `assessment.testsPass` (runtime test results from `bun test`), not TypeScript compile errors.

## Root cause

Two issues:
1. The tree has no condition for "typecheck failing" — it only checks `bun test` runtime results
2. Test-only work items shouldn't go through the three-phase cycle — they should be handled by `fix-tests` directly

## Possible resolutions

1. Add a `typecheckPassing` field to Assessment and WorldState, checked by the tree
2. Have the `fix-tests` elf run `npx tsc --noEmit` as well as `bun test`
3. Allow the executor to make typecheck-fixing changes to test files (weaker TDD)

## Recommendation

Option 2 is simplest: expand `fix-tests` to cover typecheck errors. The `assess` skill could add a `typecheckPass` field alongside `testsPass`.

## Status

Resolved.
