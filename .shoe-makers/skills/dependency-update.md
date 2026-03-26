---
name: dependency-update
description: Update outdated dependencies, run tests, check for breaking changes.
maps-to: dependency-update
risk: medium
---

## When to apply

Dependencies are outdated — check with `bun outdated` or by reviewing `package.json` against the latest published versions. Prioritise security updates and patches over major version bumps.

## Instructions

1. Run `bun outdated` (or equivalent) to identify outdated dependencies.
2. Update **one dependency at a time** — never batch multiple updates in a single change.
3. For each update:
   a. Check the changelog for breaking changes before updating.
   b. Prefer patch and minor updates over major version bumps.
   c. Run `bun install` to update the lockfile.
   d. Run `bun test` to confirm nothing breaks.
   e. If tests fail, investigate whether it's a breaking change. Fix if straightforward, otherwise revert and note the issue as a finding.
4. Commit each successful update separately with a clear message (e.g. "Update typescript from 5.8.0 to 5.9.3").
5. If a major version update is needed, read the migration guide first and only proceed if the required changes are small and well-understood.

## Verification criteria

- `bun test` passes after each update
- No new TypeScript errors (`bun run typecheck` or `npx tsc --noEmit`)
- Only `package.json` and lockfile changed (unless a breaking API change required source modifications)
- Each update is a separate commit

## Permitted actions

- Modify `package.json` (version bumps)
- Modify `bun.lockb` or other lockfiles
- Modify source files in `src/` if a breaking API change requires it
- Write findings if an update is blocked or risky

## Validation

- `bun test passes after each update`
- `each update is a separate commit`
- `only package.json and lockfile changed`

## Off-limits

- Do not update multiple unrelated dependencies in a single commit
- Do not update devDependencies and runtime dependencies together — separate commits
- Do not remove dependencies without confirming they are unused
- Do not add new dependencies — this skill is for updating existing ones only
- Do not modify `.shoe-makers/invariants.md`
