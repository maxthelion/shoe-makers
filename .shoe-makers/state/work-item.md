# Remove dead code: prioritise.ts and work.ts

skill-type: dead-code

## Context

The system used to have a four-tick design where `prioritise.ts` and `work.ts` were active skills invoked by the scheduler. The architecture was refactored to a flat selector model where `setup.ts` generates prompts directly. The wiki (`behaviour-tree.md`) now describes this flat selector model.

These two modules and their test files have **zero production call sites** — they are only imported by their own tests:
- `src/skills/prioritise.ts` (165 lines) — imported only by `src/__tests__/prioritise.test.ts`
- `src/skills/work.ts` (107 lines) — imported only by `src/__tests__/work.test.ts`

Multiple adversarial reviews have flagged these as dead code.

## What to do

1. Delete `src/skills/prioritise.ts`
2. Delete `src/skills/work.ts`
3. Delete `src/__tests__/prioritise.test.ts`
4. Delete `src/__tests__/work.test.ts`
5. Search for any remaining imports/references to these files and remove them
6. Run `bun test` to confirm all remaining tests pass
7. Run `bun run typecheck` to confirm no type errors

## What NOT to change

- Do not modify wiki pages (the wiki already describes the current flat selector model)
- Do not modify `.shoe-makers/invariants.md`
- Do not modify any other source files unless they import from the deleted modules
- Do not remove `src/skills/verify.ts` — it was refactored to a pure function and may be used in future
- Do not remove `src/skills/assess.ts` — it IS actively used by `src/scheduler/run-skill.ts`

## Patterns to follow

Check `src/scheduler/run-skill.ts` to verify neither `prioritise` nor `work` are referenced there. If they are, remove those references too (they should be dead branches in a switch/map).

## Verification

- `bun test` passes
- `bun run typecheck` passes (or `npx tsc --noEmit`)
- No remaining imports of the deleted files anywhere in `src/`
