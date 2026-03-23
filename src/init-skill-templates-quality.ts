/**
 * Quality skill templates — low-risk skills that refactor or clean up source code.
 */

export const FIX_TESTS_SKILL = `---
name: fix-tests
description: Fix failing tests to restore a green build.
maps-to: fix
risk: low
---

## When to apply

Tests are failing (\`bun test\` exits non-zero).

## Instructions

1. Run \`bun test\` and capture the full output.
2. Read each failing test to understand what it expects.
3. Read the source code under test to find the root cause.
4. Fix the source code (or the test, if the test is wrong — but prefer fixing source).
5. Run \`bun test\` again to confirm the fix.
6. If multiple tests fail, fix them one at a time, re-running tests after each fix.

## Verification criteria

- \`bun test\` exits 0
- No tests were deleted or skipped
- Fix addresses root cause, not symptoms

## Permitted actions

- Modify source files referenced by failing tests
- Modify test files only if the test itself is incorrect
- Add missing imports or type definitions

## Off-limits

- Do not delete or skip failing tests
- Do not modify unrelated files
- Do not change the test framework or configuration
`;

export const HEALTH_SKILL = `---
name: health
description: Improve code health scores by reducing complexity and duplication.
maps-to: health
risk: low
---

## When to apply

Code health score is below 70/100, indicating significant quality issues.

## Instructions

1. Identify the lowest-quality areas: high complexity, duplication, poor naming, large functions.
2. Pick one area to improve (don't try to fix everything at once).
3. Apply safe refactorings:
   - Extract helper functions from large functions
   - Consolidate duplicated logic
   - Rename unclear variables and functions
   - Split files that are too large
   - Remove dead code (zero references only)
4. Run \`bun test\` after each change to ensure nothing breaks.
5. Keep refactorings small and behaviour-preserving.

## Verification criteria

- \`bun test\` passes
- No behaviour changes (refactoring only)
- Code is measurably simpler (fewer lines per function, less duplication)

## Permitted actions

- Refactor source files in \`src/\`
- Extract new helper modules
- Remove dead code with zero references

## Off-limits

- Do not change external interfaces or APIs
- Do not add new features during health improvement
- Do not modify tests to match refactored code (tests should still pass as-is)
- Do not remove code that has callers
`;

export const DEAD_CODE_SKILL = `---
name: dead-code
description: Remove dead code — unused exports, unreachable branches, stale modules.
maps-to: dead-code
risk: low
---

## When to apply

Code analysis reveals unused exports, unreachable code paths, or modules with no importers.

## Instructions

1. Identify dead code candidates:
   - Exports not imported anywhere
   - Functions/variables only referenced in their own file but not exported
   - Conditional branches that can never execute
   - Deprecated types or interfaces with no remaining usage
2. Verify each candidate is truly dead — check all files for references.
3. Remove the dead code.
4. Run \`bun test\` to confirm nothing depended on it.
5. Commit with a message listing what was removed and why it was dead.

## Verification criteria

- All tests pass after removal
- No import errors introduced
- Each removal is justified (truly unreferenced)

## Permitted actions

- Delete dead code from source files in \`src/\`
- Remove stale test files if they test removed features

## Off-limits

- Do not remove code that is referenced elsewhere
- Do not remove types that are part of public interfaces
- Do not modify wiki or documentation as part of this action
`;
