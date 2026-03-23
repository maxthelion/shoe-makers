# Add root-level documentation files to executor canWrite

skill-type: bug-fix

## Problem

The executor role's `canWrite` in `src/verify/permissions.ts:52-55` only allows `src/`, `wiki/`, and `.shoe-makers/state/`. Root-level files like `CHANGELOG.md` and `README.md` trigger false permission violations when updated by doc-sync work items (documented in critique-145).

## What to do

In `src/verify/permissions.ts`, add `"CHANGELOG.md"` and `"README.md"` to the `execute-work-item` role's `canWrite` array:

```typescript
"execute-work-item": {
  role: "executor",
  canWrite: ["src/", "wiki/", ".shoe-makers/state/", "CHANGELOG.md", "README.md"],
  cannotWrite: [...ALWAYS_FORBIDDEN],
},
```

## Tests

Update `src/__tests__/permissions.test.ts` and/or `src/__tests__/tdd-enforcement.test.ts` to add assertions that the executor can write `CHANGELOG.md` and `README.md`.

## Files NOT to modify

- `src/verify/detect-violations.ts` — already fixed
- `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 chosen: minimal change (one line), directly addresses documented permission gap from critique-145, prevents future false violations for doc-sync work.
