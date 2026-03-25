# Fix logAssessment to distinguish null vs false typecheck

skill-type: health

## What to change

In `src/setup.ts:logAssessment()` (line 259-261), the typecheck logging treats `null` the same as `false`:

```typescript
if (assessment.typecheckPass !== undefined) {
  console.log(`[setup] Typecheck: ${assessment.typecheckPass ? "pass" : "FAIL"}`);
}
```

When `typecheckPass` is `null` (returned by `runTypecheck()` when type definitions are missing), this shows "FAIL" which is misleading — it's not a code error, it's an environment issue.

## Fix

Replace line 260 with logic that distinguishes three cases:
- `true` → "pass"
- `false` → "FAIL"
- `null` → "skipped"

```typescript
if (assessment.typecheckPass !== undefined) {
  const label = assessment.typecheckPass === null ? "skipped" : assessment.typecheckPass ? "pass" : "FAIL";
  console.log(`[setup] Typecheck: ${label}`);
}
```

## Update existing tests

Check `src/__tests__/setup.test.ts` for any tests of `logAssessment` that need updating.

## What NOT to change

- Do NOT modify `src/skills/assess.ts` — the `runTypecheck` function correctly returns null already
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages

## Decision Rationale

Chose this over test-only candidates because the guidance says "prefer improvement over tests." This makes the setup log output more informative and less alarming, helping both humans and elves understand the codebase state.
