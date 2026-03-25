# Remove unused blackboard exports and buildProcessSuggestions

skill-type: dead-code

## What to remove

### From `src/state/blackboard.ts`:

**Remove these exported functions** (dead after `skills/verify.ts` was deleted):
- `writeVerification()` (line 87-89) — only in tests
- `clearCurrentTask()` (line 108-110) — only in tests
- `clearPriorities()` (line 115-117) — only in tests
- `writePriorities()` (line 73-75) — only in tests

**Also remove the now-unused private helper if it becomes unreferenced:**
- `clearFile()` (line 94-103) — only used by `clearCurrentTask` and `clearPriorities`

**Remove the `Verification` import** from the import block (line 8) — no longer needed after removing `writeVerification`.

**Remove from FILES constant** (lines 15-17):
- `priorities: "priorities.json"` — only used by dead functions
- `verification: "verification.json"` — only used by dead functions

**Keep `currentTask` in FILES** because `writeCurrentTask` (used by `src/task.ts`) needs it.

**Simplify `readBlackboard()`** (lines 51-60):
- Remove reading of `priorities` and `verification` files (legacy, no consumers)
- Keep reading `assessment` and `currentTask` (used by task.ts)

**Keep these exports** (they have production callers):
- `readBlackboard()` — used by setup.ts, skills/verify was just one consumer
- `writeAssessment()` — used by skills/assess.ts
- `writeCurrentTask()` — used by src/task.ts

### From `src/log/shift-summary.ts`:

**Remove `buildProcessSuggestions()`** (line 296 to end of function) — exported but only used in tests.

### From `src/types.ts`:

**Remove unused types** if they're no longer referenced after the above changes:
- `PriorityList` — check if it's still used anywhere
- `Verification` — check if it's still used anywhere

### Update tests

**`src/__tests__/blackboard.test.ts`**: Remove tests for the deleted functions. Keep tests for `readBlackboard`, `writeAssessment`, `writeCurrentTask`.

**`src/__tests__/shift-summary.test.ts`**: Remove tests for `buildProcessSuggestions`.

## Steps

1. Remove the dead functions from `blackboard.ts`
2. Remove `clearFile` helper if unreferenced
3. Simplify `readBlackboard` to only read `assessment` and `currentTask`
4. Update `FILES` constant to remove unused entries
5. Update imports (remove `Verification`, `PriorityList` if unused)
6. Remove `buildProcessSuggestions` from `shift-summary.ts`
7. Update `types.ts` — remove `Verification` and `PriorityList` types IF no production code uses them. Check `Blackboard` interface too.
8. Update test files to remove tests for deleted functions
9. Run `bun test` to confirm all remaining tests pass
10. Commit

## What NOT to change

- Do NOT modify `src/task.ts` — it correctly uses `writeCurrentTask`
- Do NOT delete `writeCurrentTask` — it's live
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages
- Be careful with `Blackboard` interface in types.ts — if it references `PriorityList`, `Verification`, etc., update the interface shape but keep it working with `readBlackboard`

## Decision Rationale

Chose dead-code cleanup over test-coverage candidates because guidance says prefer improvement over tests. These dead exports were left behind when `skills/verify.ts` was deleted and create confusion about the blackboard API surface.
