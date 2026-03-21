---
name: implement
description: Implement a feature specified in the wiki but not yet built.
maps-to: implement
risk: medium
---

## When to apply

The invariants pipeline reports `specified-only` items — things described in the wiki spec that have no corresponding code.

## Instructions

1. Read the relevant wiki page(s) to understand the specification.
2. Read existing source code to understand the codebase structure and conventions.
3. Identify the most foundational piece to build (don't try to implement everything at once).
4. Write the implementation following existing patterns in the codebase.
5. Write tests that verify the behaviour described in the spec.
6. Run `bun test` to confirm all tests pass (both new and existing).
7. If the implementation changes or refines the design, update the relevant wiki page.

## Verification criteria

- New code matches the wiki specification
- Tests cover the new functionality
- `bun test` passes
- No existing tests broken
- Code follows existing conventions (file structure, naming, types)

## Permitted actions

- Create new source files in `src/`
- Create new test files in `src/__tests__/`
- Modify existing source files to wire in new functionality
- Update wiki pages if design was refined during implementation

## Off-limits

- Do not change the behaviour tree routing logic without updating the wiki
- Do not modify unrelated modules
- Do not add external dependencies without justification
