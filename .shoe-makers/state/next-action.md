# Execute Work Item

A previous elf wrote a detailed work item in `.shoe-makers/state/work-item.md`. Read it and do exactly what it says.

1. Read `.shoe-makers/state/work-item.md`
2. Do the work described — implement, test, or fix as instructed
3. Run `bun test` to confirm nothing is broken
4. Commit your work
5. Delete `.shoe-makers/state/work-item.md` (the work is done)
6. Optionally, write a new `.shoe-makers/state/work-item.md` as a follow-up for the next elf (e.g. "review what I just built" or "write tests for this feature")

The work-item contains specific, detailed instructions with full context. Follow them precisely.

When wiki and code diverge, check which changed more recently. If the wiki is newer, change code to match — never revert the wiki. The wiki is always the source of truth.

## Skill: implement

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

## Validation

- `bun test passes`
- `tests cover the new functionality`
- `code follows existing conventions`

## Off-limits

- Do not change the behaviour tree routing logic without updating the wiki
- Do not modify unrelated modules
- Do not add external dependencies without justification

**Off-limits — do NOT modify these files:**
- `.shoe-makers/invariants.md` — only humans maintain the spec claims
- `.shoe-makers/state/` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)

## After completing

Run `bun run setup` again to get your next action.
