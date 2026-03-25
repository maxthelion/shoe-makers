# Remove stale action-constants.ts and its test

skill-type: dead-code

## Context

`src/log/action-constants.ts` is a stale duplicate of `src/log/action-classification.ts`. The stale file is missing `"continue-work"` from its REACTIVE_ACTIONS set, making it inconsistent with `src/types.ts` (which defines `ActionType` including `"continue-work"` on line 31). Production code uses `action-classification.ts`.

## What to do

1. Delete `src/log/action-constants.ts` (6 lines, dead code)
2. Delete `src/__tests__/action-constants.test.ts` (30 lines, tests the dead code)
3. Verify no other files import from `action-constants`

The production imports are in:
- `src/log/shift-summary.ts` → imports from `./action-classification` (correct)
- `src/log/shift-log-parser.ts` → imports from `./action-classification` (correct)

## Verification

1. `grep -r "action-constants" src/` should return nothing after deletion
2. `bun test` must pass (test count will drop by 3)
3. No import errors

## What NOT to change

- Do NOT modify `src/log/action-classification.ts` — it's correct
- Do NOT modify any other source files
- Do NOT modify `src/__tests__/action-classification.test.ts` if it exists

## Decision Rationale

Picked candidate #1 over #2 (re-export cleanup) and #3 (test coverage) because it removes dead code with a data inconsistency bug. Dead code that silently disagrees with production code is worse than simple unused code — it could mislead future work.
