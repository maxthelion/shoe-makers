# Improve evaluate.test.ts quality score

skill-type: health

## Context

`src/__tests__/evaluate.test.ts` scores 94/100, tied for worst file. The file is 324 lines with many similar `makeState()` override patterns. The octoclean score may be penalizing file length. We can reduce the file size by parameterizing the priority ordering tests which follow a repetitive pattern.

## What to do

1. Read `src/__tests__/evaluate.test.ts`
2. Identify groups of tests that follow the same pattern but with different inputs
3. Use `test.each` or a loop to parameterize repetitive cases (e.g. the priority ordering tests)
4. Run `bun test` to confirm all tests still pass
5. Check that no test coverage is lost — same assertions, just less boilerplate

## What NOT to change

- Do not modify source code in `src/` (only test files)
- Do not modify wiki or `.shoe-makers/invariants.md`
- Do not remove any test coverage — only consolidate identical patterns
- Do not change test names or descriptions in ways that reduce clarity
