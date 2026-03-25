# Add permission enforcement tests for continue-work action

skill-type: test-coverage

## Context

`src/verify/permissions.ts` has a `continue-work` entry with executor-level permissions but `src/__tests__/permissions.test.ts` has no tests for it.

## What to do

Add tests to `src/__tests__/permissions.test.ts` following the existing executor pattern (see "execute-work-item" tests at lines 51-87):

1. `continue-work` can write source code (`src/...`)
2. `continue-work` can write wiki (`wiki/...`)
3. `continue-work` can write state files (`.shoe-makers/state/...`)
4. `continue-work` cannot write invariants (`.shoe-makers/invariants.md`)

## Pattern to follow

```typescript
test("continue-work can write source code", () => {
  expect(isFileAllowed("continue-work", "src/foo.ts")).toBe(true);
});
```

## Files to modify

- `src/__tests__/permissions.test.ts` — add 3-4 tests

## Files NOT to modify

- `.shoe-makers/invariants.md`
- Any source files in `src/` other than test files

## Decision Rationale

This completes the ContinueAgent feature by verifying its permission configuration. Quick, focused work.
