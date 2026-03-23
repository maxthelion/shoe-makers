# Fix stale EXCLUDED_TOP_LEVEL after template file split

skill-type: health

## Context

Finding `exclusion-list-stale-2026-03-23.md` documents that `src/verify/invariants.ts` has a stale `EXCLUDED_TOP_LEVEL` set. The set was not updated when `init-skill-templates.ts` was split into three files.

## What to do

1. Open `src/verify/invariants.ts` line 107-110
2. Replace the current `EXCLUDED_TOP_LEVEL`:
```typescript
const EXCLUDED_TOP_LEVEL = new Set([
  "types.ts", "index.ts", "tick.ts", "shift.ts", "task.ts", "setup.ts", "prompts.ts",
  "init.ts", "init-templates.ts", "init-skill-templates.ts", "run-init.ts", "schedule.ts",
]);
```
With:
```typescript
const EXCLUDED_TOP_LEVEL = new Set([
  "types.ts", "index.ts", "tick.ts", "shift.ts", "task.ts", "setup.ts", "prompts.ts",
  "init.ts", "init-templates.ts", "init-skill-templates-work.ts",
  "init-skill-templates-quality.ts", "init-skill-templates-docs.ts", "run-init.ts", "schedule.ts",
]);
```
3. Run `bun test` to confirm all tests pass
4. Mark the finding `exclusion-list-stale-2026-03-23.md` as resolved

## What NOT to change

- Do not modify wiki or `.shoe-makers/invariants.md`
- Do not modify test files
- Do not modify any other source files
