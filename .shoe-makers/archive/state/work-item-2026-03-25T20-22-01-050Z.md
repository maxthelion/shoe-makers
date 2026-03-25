# Check for outdated dependencies

skill-type: dependency-update

## Context

The project uses `bun@1.3.11`, `typescript@5.9.3`, and `@types/bun@1.3.11`. The remaining health improvement candidates (test file verbosity reductions) are marginal and risk reducing readability. A dependency check is a different kind of useful work.

## What to do

1. Run `bun outdated` to check for available updates
2. If updates are available, update them one at a time with `bun update <package>`
3. After each update, run `bun test` to verify all tests still pass
4. Run `bunx tsc --noEmit` to verify type checking still passes
5. If any update breaks tests or types, revert it and skip that package
6. Commit successful updates

## What NOT to change

- Do not modify source code
- Do not modify `.shoe-makers/invariants.md`
- Do not add new dependencies
- Do not update bun itself (runtime version is controlled externally)

## Decision Rationale

Chosen over test file verbosity reductions (#1, #2) which are marginal improvements that risk making tests less readable. Dependency updates are a concrete, useful task that may improve security and performance.
