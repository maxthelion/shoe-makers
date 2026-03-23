/**
 * Work skill templates — medium-risk skills that modify source code
 * for features, bug fixes, and dependency updates.
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
