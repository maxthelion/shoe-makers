---
type: finding
date: 2026-03-22
status: open
---

# Finding: Dead code removal blocked by TDD enforcement

## Issue

The work item to remove dead code (`src/skills/verify.ts`) cannot be completed by the executor role because:

1. Deleting `src/skills/verify.ts` breaks `src/__tests__/verify.test.ts` (import fails)
2. The executor role (`execute-work-item`) is forbidden from writing to `src/__tests__/`
3. Both files must be deleted together for tests to pass

## Root cause

TDD enforcement prevents the executor from touching test files. This is correct for *new* code (write tests first, then implement). But for *dead code removal*, the source and test files are coupled — you can't delete one without the other.

## Possible resolutions

1. **Have `fix-tests` role clean up first**: A `fix-tests` elf deletes the orphaned test, then the executor deletes the source. But `fix-tests` fires when tests *fail*, not proactively.
2. **Add a `dead-code` action type**: A new role with permission to delete both source and test files. The `dead-code.md` skill exists but there's no corresponding action type or tree node.
3. **Human intervention**: A human deletes both files manually.
4. **Relax TDD for deletion**: Allow executor to *delete* (not create/modify) test files.

## Recommendation

Option 2 is most aligned with the architecture. The `dead-code` skill already exists in `.shoe-makers/skills/dead-code.md` but isn't wired into the behaviour tree or permission system.

## Status

Resolved.
