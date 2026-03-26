---
name: test-coverage
description: Add tests for implemented but untested code paths.
maps-to: test
risk: low
---

## When to apply

The invariants pipeline reports `implemented-untested` items — code that exists but lacks test coverage.

## Instructions

1. Identify the untested module or function.
2. Read the source code to understand its behaviour.
3. Read the relevant wiki page to understand the intended behaviour.
4. Write tests that verify both the happy path and edge cases.
5. Follow existing test patterns (see `src/__tests__/` for conventions).
6. Run `bun test` to confirm all tests pass.

## Verification criteria

- New tests exercise the previously untested code
- Tests verify behaviour described in the wiki spec
- `bun test` passes
- Tests are meaningful (not just "doesn't throw")

## Permitted actions

- Create new test files in `src/__tests__/`
- Modify existing test files to add coverage

## Validation

- `bun test passes`
- `tests verify behaviour described in the wiki spec`
- `tests are meaningful`

## Off-limits

- Do not modify source code (this skill is test-only)
- Do not change test infrastructure or configuration
- Do not add tests for trivial getters/setters
