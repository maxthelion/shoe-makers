/**
 * Skill template strings for the init scaffolding.
 * Split from init-templates.ts to keep file sizes manageable.
 */

export const IMPLEMENT_SKILL = `---
name: implement
description: Implement a feature specified in the wiki but not yet built.
maps-to: implement
risk: medium
---

## When to apply

The invariants pipeline reports \`specified-only\` items — things described in the wiki spec that have no corresponding code.

## Instructions

1. Read the relevant wiki page(s) to understand the specification.
2. Read existing source code to understand the codebase structure and conventions.
3. Identify the most foundational piece to build.
4. Write the implementation following existing patterns in the codebase.
5. Write tests that verify the behaviour described in the spec.
6. Run \`bun test\` to confirm all tests pass (both new and existing).

## Verification criteria

- New code matches the wiki specification
- Tests cover the new functionality
- \`bun test\` passes
- No existing tests broken
- Code follows existing conventions

## Permitted actions

- Create new source files in \`src/\`
- Create new test files in \`src/__tests__/\`
- Modify existing source files to wire in new functionality
- Update wiki pages if design was refined during implementation

## Off-limits

- Do not change the behaviour tree routing logic without updating the wiki
- Do not modify unrelated modules
- Do not add external dependencies without justification
`;

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

export const TEST_COVERAGE_SKILL = `---
name: test-coverage
description: Add tests for implemented but untested code paths.
maps-to: test
risk: low
---

## When to apply

The invariants pipeline reports \`implemented-untested\` items — code that exists but lacks test coverage.

## Instructions

1. Identify the untested module or function.
2. Read the source code to understand its behaviour.
3. Read the relevant wiki page to understand the intended behaviour.
4. Write tests that verify both the happy path and edge cases.
5. Follow existing test patterns (see \`src/__tests__/\` for conventions).
6. Run \`bun test\` to confirm all tests pass.

## Verification criteria

- New tests exercise the previously untested code
- Tests verify behaviour described in the wiki spec
- \`bun test\` passes
- Tests are meaningful (not just "doesn't throw")

## Permitted actions

- Create new test files in \`src/__tests__/\`
- Modify existing test files to add coverage

## Off-limits

- Do not modify source code (this skill is test-only)
- Do not change test infrastructure or configuration
- Do not add tests for trivial getters/setters
`;

export const DOC_SYNC_SKILL = `---
name: doc-sync
description: Sync wiki pages with code changes to keep spec accurate.
maps-to: doc-sync
risk: low
---

## When to apply

The invariants pipeline reports \`unspecified\` items — code that exists but isn't documented in the wiki. Or wiki pages are stale relative to recent code changes.

## Instructions

1. Identify what's in code but not in the wiki (or what's changed since the wiki was last updated).
2. Read the relevant source files to understand current behaviour.
3. Update the wiki page(s) to accurately reflect the implementation.
4. Preserve the wiki page's frontmatter (title, category, tags, summary).
5. Keep wiki pages factual and concise — describe what IS, not what should be.

## Verification criteria

- Updated wiki pages accurately describe the current code
- Frontmatter is preserved and correct
- No speculative content added (only document what's built)

## Permitted actions

- Modify existing wiki pages
- Create new wiki pages if a topic warrants its own page

## Off-limits

- Do not modify source code (this skill is docs-only)
- Do not remove wiki content that describes planned/future features (mark as "not yet implemented" instead)
- Do not change page categories or tags without reason
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

export const OCTOCLEAN_FIX_SKILL = `---
name: octoclean-fix
description: Fix code health issues identified by octoclean — reduce complexity, improve structure.
maps-to: octoclean-fix
risk: medium
---

## When to apply

The assessment shows a health score below threshold, and octoclean has identified specific files with poor scores.

## Instructions

1. Read the assessment to find the worst files by health score.
2. Run \`npx tsx node_modules/octoclean/src/cli/index.ts scan\` to get detailed metrics.
3. For each file, identify the primary issue: cyclomatic complexity, cognitive complexity, file length, or duplication.
4. Apply targeted fixes:
   - High cyclomatic complexity → extract helper functions, simplify conditionals
   - High cognitive complexity → reduce nesting, use early returns
   - Long files → split into focused modules
   - Duplication → consolidate into shared utilities
5. Run \`bun test\` to confirm nothing broke.
6. Commit with a clear message explaining what was improved and why.

## Verification criteria

- Health score does not regress (and ideally improves)
- All tests pass
- Changes are focused on the identified files
- Refactoring preserves behaviour

## Permitted actions

- Modify source files in \`src/\`
- Create new helper/utility files if needed for extraction

## Off-limits

- Do not modify test files — only refactor implementation
- Do not change public APIs without updating callers
- Do not modify high-fan-in files without checking all import sites
- Do not add external dependencies
`;

export const BUG_FIX_SKILL = `---
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
5. Run \`bun test\` to confirm the fix and that nothing else broke.
6. Update the finding status to resolved if applicable.
7. Commit with a message explaining what was broken and why.

## Verification criteria

- The bug test now passes
- All existing tests still pass
- The fix is minimal — no unrelated changes
- The finding is updated to reflect the fix

## Permitted actions

- Modify source files in \`src/\`
- Create new test files in \`src/__tests__/\`
- Update findings in \`.shoe-makers/findings/\`

## Off-limits

- Do not modify unrelated modules
- Do not add features beyond the bug fix
- Do not refactor surrounding code as part of the fix
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

export const DEPENDENCY_UPDATE_SKILL = `---
name: dependency-update
description: Update outdated dependencies, run tests, check for breaking changes.
maps-to: dependency-update
risk: medium
---

## When to apply

Dependencies are outdated — check with \`bun outdated\` or by reviewing \`package.json\` against the latest published versions. Prioritise security updates and patches over major version bumps.

## Instructions

1. Run \`bun outdated\` (or equivalent) to identify outdated dependencies.
2. Update **one dependency at a time** — never batch multiple updates in a single change.
3. For each update:
   a. Check the changelog for breaking changes before updating.
   b. Prefer patch and minor updates over major version bumps.
   c. Run \`bun install\` to update the lockfile.
   d. Run \`bun test\` to confirm nothing breaks.
   e. If tests fail, investigate whether it's a breaking change. Fix if straightforward, otherwise revert and note the issue as a finding.
4. Commit each successful update separately with a clear message (e.g. "Update typescript from 5.8.0 to 5.9.3").
5. If a major version update is needed, read the migration guide first and only proceed if the required changes are small and well-understood.

## Verification criteria

- \`bun test\` passes after each update
- No new TypeScript errors (\`bun run typecheck\` or \`npx tsc --noEmit\`)
- Only \`package.json\` and lockfile changed (unless a breaking API change required source modifications)
- Each update is a separate commit

## Permitted actions

- Modify \`package.json\` (version bumps)
- Modify \`bun.lockb\` or other lockfiles
- Modify source files in \`src/\` if a breaking API change requires it
- Write findings if an update is blocked or risky

## Off-limits

- Do not update multiple unrelated dependencies in a single commit
- Do not update devDependencies and runtime dependencies together — separate commits
- Do not remove dependencies without confirming they are unused
- Do not add new dependencies — this skill is for updating existing ones only
- Do not modify \`.shoe-makers/invariants.md\`
`;
