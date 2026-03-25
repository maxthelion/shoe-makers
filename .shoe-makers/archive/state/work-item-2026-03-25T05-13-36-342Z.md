# Work Item: Fix logAssessment displaying null typecheckPass as "FAIL"

skill-type: bug-fix

## Problem

In `src/setup.ts`, `logAssessment()` at line 254 displays the typecheck status incorrectly when `typecheckPass` is `null`:

```typescript
if (assessment.typecheckPass !== undefined) {
    console.log(`[setup] Typecheck: ${assessment.typecheckPass ? "pass" : "FAIL"}`);
}
```

When `runTypecheck()` in `src/skills/assess.ts:43-58` returns `null` (indicating an environment issue like missing `bun-types`), the display logic treats it as a failure:
- `null !== undefined` → `true` (enters the if block)
- `null ? "pass" : "FAIL"` → `"FAIL"` (falsy value)

This displays `[setup] Typecheck: FAIL` when it should display `[setup] Typecheck: skipped`.

The tree itself handles `null` correctly (`assessment.typecheckPass === false` in `default-tree.ts:26`), so this is a display bug, not a logic bug. But it confused a previous setup run into logging "FAIL" which was misleading.

## Fix

In `src/setup.ts`, change the `logAssessment` function's typecheck display logic:

```typescript
// Before:
if (assessment.typecheckPass !== undefined) {
    console.log(`[setup] Typecheck: ${assessment.typecheckPass ? "pass" : "FAIL"}`);
}

// After:
if (assessment.typecheckPass === true) {
    console.log("[setup] Typecheck: pass");
} else if (assessment.typecheckPass === false) {
    console.log("[setup] Typecheck: FAIL");
} else if (assessment.typecheckPass === null) {
    console.log("[setup] Typecheck: skipped");
}
```

This explicitly handles all three states: `true`, `false`, and `null` (skip undefined — don't log anything).

## Files to modify

- `src/setup.ts` — the `logAssessment()` function (~line 254)

## Tests

The existing test file `src/__tests__/setup.test.ts` already has tests for `logAssessment`. Check that:
1. There's a test for `typecheckPass: null` displaying "skipped"
2. There's a test for `typecheckPass: false` displaying "FAIL"
3. There's a test for `typecheckPass: true` displaying "pass"
4. There's a test for `typecheckPass: undefined` displaying nothing

If any of these are missing, add them. Follow the existing test patterns in that file.

## What NOT to change

- Do not change `runTypecheck()` in `src/skills/assess.ts` — it correctly returns `null` for env issues
- Do not change the tree condition in `default-tree.ts` — it correctly uses `=== false`
- Do not change any invariants or wiki pages

## Decision Rationale

Candidate #1 (shift-summary tests) was inaccurate — that file already has 296 LOC of comprehensive tests. Candidate #5 (stale invariants) requires human action. Candidate #4 (this bug) is the most concrete, immediately fixable issue that was actively causing confusing output during setup runs.
