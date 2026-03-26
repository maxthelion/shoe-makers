---
name: fix-tests
description: Fix failing tests to restore a green build.
maps-to: fix
risk: low
---

## When to apply

Tests are failing (`bun test` exits non-zero).

## Instructions

1. Run `bun test` and capture the full output.
2. Read each failing test to understand what it expects.
3. Read the source code under test to find the root cause.
4. Fix the source code (or the test, if the test is wrong — but prefer fixing source).
5. Run `bun test` again to confirm the fix.
6. If multiple tests fail, fix them one at a time, re-running tests after each fix.

## Verification criteria

- `bun test` exits 0
- No tests were deleted or skipped
- Fix addresses root cause, not symptoms

## Permitted actions

- Modify source files referenced by failing tests
- Modify test files only if the test itself is incorrect
- Add missing imports or type definitions

## Validation

- `bun test exits 0`
- `no tests were deleted or skipped`

## Off-limits

- Do not delete or skip failing tests
- Do not modify unrelated files
- Do not change the test framework or configuration
