# Remove dead Blackboard fields (priorities, verification)

skill-type: dead-code

## Context

The `Blackboard` interface in `src/types.ts:43-48` defines two optional fields that are never used anywhere in the codebase:
- `priorities?: unknown | null` (line 45)
- `verification?: unknown | null` (line 47)

Grep for `.priorities` and `.verification` across `src/` returns zero results. The `readBlackboard()` function in `src/state/blackboard.ts:52` already constructs the return value without these fields.

## What to change

1. Remove `priorities?: unknown | null;` from the Blackboard interface in `src/types.ts`
2. Remove `verification?: unknown | null;` from the Blackboard interface in `src/types.ts`

The Blackboard interface should become:

```typescript
export interface Blackboard {
  assessment: Assessment | null;
  currentTask: CurrentTask | null;
}
```

## Files to modify

- `src/types.ts` — remove the two dead fields from Blackboard interface

## What NOT to change

- Do NOT modify test files
- Do NOT modify `src/state/blackboard.ts` (it already doesn't use these fields)
- Do NOT remove any other types or fields
- Do NOT modify any other files

## Tests to write

None needed. Run `bun test` to confirm existing tests pass. The fields were never used so removing them has no observable effect.

## Verification

- `bun test` passes
- `tsc --noEmit` passes (no compile errors from removal)
- Grep for `priorities` and `verification` on Blackboard confirms no remaining references

## Decision Rationale

Candidate #1 was chosen because it's the only actionable dead-code removal. Candidate #2 (test file health) requires modifying test files which the octoclean-fix skill forbids, and the health skill is implementation-focused. Candidate #3 (unused exports) was found to be invalid — `isAllHousekeeping` and `HOUSEKEEPING_PATHS` are used internally in `scheduler/housekeeping.ts` and in test files.
