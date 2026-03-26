skill-type: test-coverage

# Add tests for verify/permissions.ts (role-based permission model)

## Wiki Spec

From `wiki/pages/verification.md`: "Role-based permissions — each action type has a defined set of files it may write. The critique action can only write findings; the executor can write src/ and wiki/; no elf can ever write invariants.md."

From `.shoe-makers/invariants.md` section 2.3: "Each action type has a defined canWrite and cannotWrite permission set. ALWAYS_FORBIDDEN files (.shoe-makers/invariants.md) are enforced regardless of action type."

## Current Code

`src/verify/permissions.ts` (137 lines) defines the permission model with three exported functions:
- `getPermissions(action, wikiDir?)` (line 99) — returns RolePermissions for an action type
- `isFileAllowed(action, filePath, wikiDir?)` (line 107) — checks a single file against permissions
- `checkPermissionViolations(action, changedFiles, wikiDir?)` (line 131) — filters violated files from a list

Also has:
- `ALWAYS_FORBIDDEN` (line 19) — files no elf can ever modify
- `buildRoleMap(wikiDir)` (line 27) — builds permission table for 12 action types
- `RolePermissions` interface (line 10) — defines role, canWrite, cannotWrite

There are **zero tests** for this module despite it being security-critical — it controls what every elf can modify.

An existing test file `src/__tests__/permissions.test.ts` exists but only tests the violation detection pipeline (`src/verify/detect-violations.ts`), not the core permission functions.

## What to Build

Create `src/__tests__/permissions-model.test.ts` (separate from the existing `permissions.test.ts` to avoid modifying existing tests). Test the core permission functions:

### Tests for `isFileAllowed`:
1. Reviewer (critique) can write `.shoe-makers/findings/critique-001.md` — true
2. Reviewer (critique) cannot write `src/foo.ts` — false
3. Reviewer (critique) cannot write `wiki/pages/arch.md` — false
4. Executor (execute-work-item) can write `src/tree/evaluate.ts` — true
5. Executor (execute-work-item) can write `wiki/pages/arch.md` — true
6. Executor (execute-work-item) can write `package.json` — true
7. Executor (execute-work-item) cannot write `.shoe-makers/invariants.md` — false (ALWAYS_FORBIDDEN)
8. Prioritiser (prioritise) can write `.shoe-makers/state/candidates.md` — true
9. Prioritiser (prioritise) cannot write `src/foo.ts` — false
10. Explorer (explore) can write `.shoe-makers/findings/note.md` — true
11. Explorer (explore) cannot write `src/foo.ts` — false
12. Dead-code remover (dead-code) can write `src/old.ts` — true
13. Dead-code remover (dead-code) cannot write `wiki/pages/arch.md` — false
14. No action can write `.shoe-makers/invariants.md` — test all 12 action types

### Tests for `checkPermissionViolations`:
15. Returns empty array when all files are allowed
16. Returns only violating files from a mixed list
17. Returns all files when none are allowed

### Tests for `getPermissions`:
18. Returns correct role name for each action type
19. Custom wikiDir changes wiki path in canWrite/cannotWrite

## Patterns to Follow

Follow the pattern in `src/__tests__/permissions.test.ts`:
- Import from `bun:test` (`describe`, `test`, `expect`)
- Import functions directly from `../verify/permissions`
- Simple assertion tests — no temp dirs needed since these are pure functions

## Tests to Write

See "What to Build" above — approximately 19 test cases organized in 3 describe blocks.

## What NOT to Change

- Do NOT modify `src/verify/permissions.ts` — only add tests
- Do NOT modify `src/__tests__/permissions.test.ts` — that tests detect-violations.ts
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any existing files

## Decision Rationale

Chose permissions.ts over invariants.ts (candidate #3) because: permissions.ts is the enforcement mechanism for cross-elf gatekeeping — it determines what each elf role can modify. A bug here could allow an elf to modify invariants.md or other protected files, undermining the entire verification system. The functions are pure (no I/O) making them trivially testable. Candidate #1 (assess.ts) was already completed in the previous tick.
