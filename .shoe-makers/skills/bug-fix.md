---
name: bug-fix
description: Fix bugs found in findings, issues, or discovered during exploration.
maps-to: bug-fix
risk: medium
---

## When to apply

A finding or issue describes a bug, or the explore action discovered incorrect behaviour.

## Instructions

1. Read the finding or issue describing the bug.
2. Reproduce the bug — understand exactly what's wrong.
3. Write a test that demonstrates the bug (it should fail).
4. Fix the bug with a minimal, targeted change.
5. Run `bun test` to confirm the fix and that nothing else broke.
6. Update the finding status to resolved if applicable.
7. Commit with a message explaining what was broken and why.

## Verification criteria

- The bug test now passes
- All existing tests still pass
- The fix is minimal — no unrelated changes
- The finding is updated to reflect the fix

## Permitted actions

- Modify source files in `src/`
- Create new test files in `src/__tests__/`
- Update findings in `.shoe-makers/findings/`

## Off-limits

- Do not modify unrelated modules
- Do not add features beyond the bug fix
- Do not refactor surrounding code as part of the fix
