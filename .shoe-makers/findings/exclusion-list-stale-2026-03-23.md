# Finding: EXCLUDED_TOP_LEVEL in invariants.ts needs updating after template file split

**Date**: 2026-03-23
**Severity**: low
**Type**: health

## Description

`src/verify/invariants.ts` line 107-110 has an `EXCLUDED_TOP_LEVEL` set that excludes top-level source files from unspecified-directory detection. After the split of `init-skill-templates.ts` into three files, this set is stale:

- Still lists `init-skill-templates.ts` (deleted)
- Missing `init-skill-templates-work.ts`, `init-skill-templates-quality.ts`, `init-skill-templates-docs.ts`

This causes the assessment to report 3 false-positive "unspecified" entries (the 4th, `utils`, is a genuine directory that could use wiki coverage).

## Suggested fix

Update `EXCLUDED_TOP_LEVEL` in `src/verify/invariants.ts`:
```typescript
const EXCLUDED_TOP_LEVEL = new Set([
  "types.ts", "index.ts", "tick.ts", "shift.ts", "task.ts", "setup.ts", "prompts.ts",
  "init.ts", "init-templates.ts", "init-skill-templates-work.ts",
  "init-skill-templates-quality.ts", "init-skill-templates-docs.ts", "run-init.ts", "schedule.ts",
]);
```

This is a one-line source change that a health or fix elf can make.
