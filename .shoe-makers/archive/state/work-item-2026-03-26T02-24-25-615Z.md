skill-type: implement

# Implement commit-or-revert verification step — revert bad work on test/typecheck failure

## Wiki Spec

From `.shoe-makers/invariants.md` section 1.3:

> Verification has already caught and reverted bad work — what's on the branch passed checks

From `.shoe-makers/claim-evidence/06-verification.yaml`:

> verification.commit-or-revert:
>   source: ["commit"], ["revert"]
>   test: [commit], [revert]

The system should have a mechanism that reverts commits that break tests or typecheck, so the branch always has passing checks.

## Current Code

`src/setup.ts` lines 68-76: Setup runs `assess()` which checks tests and typecheck. If tests fail, the tree routes to `fix-tests` at the next tick. But there is no mechanism to actually revert the bad commits.

`src/scheduler/shift.ts` lines 48-98: The shift runner loops ticks. When a skill errors, it returns `outcome: "error"` but doesn't revert.

There is currently no `src/verify/commit-or-revert.ts` or similar module.

## What to Build

Create `src/verify/commit-or-revert.ts` with a function that:
1. Checks if tests pass and typecheck passes (using existing `assess` or simpler checks)
2. If both pass, returns `"commit"` (the work is good — keep it)
3. If either fails, returns `"revert"` and reverts to the last known-good commit (the last-reviewed-commit, or the commit before the elf's work)
4. The function should be callable from setup or the shift runner

The function signature should be something like:
```typescript
export async function verifyOrRevert(repoRoot: string): Promise<"commit" | "revert">
```

Create `src/__tests__/commit-or-revert.test.ts` with tests that verify:
- Returns `"commit"` when tests and typecheck pass
- Returns `"revert"` when tests fail
- Returns `"revert"` when typecheck fails
- The function is a pure decision (actual git revert is a side effect for the caller)

## Patterns to Follow

Follow `src/verify/health-regression.ts` as a pattern — it's a simple verification function that takes inputs and returns a result. Keep the function pure: it should return a decision, not execute the revert (separation of concerns — side effects belong in the scheduler).

For tests, follow `src/__tests__/health-regression.test.ts`.

## Tests to Write

In `src/__tests__/commit-or-revert.test.ts`:
1. Test that `verifyOrRevert` returns `"commit"` when tests pass and typecheck passes
2. Test that `verifyOrRevert` returns `"revert"` when tests fail
3. Test that `verifyOrRevert` returns `"revert"` when typecheck fails
4. Test that `verifyOrRevert` returns `"revert"` when both fail

## What NOT to Change

- Do not modify `src/setup.ts` — just create the new module; integration can happen in a follow-up
- Do not modify `src/scheduler/shift.ts`
- Do not modify `.shoe-makers/invariants.md`
- Do not wire the function into the setup flow yet — this tick creates the verification module only

## Decision Rationale

This is the top invariant gap (`verification.commit-or-revert`) and also closes the second gap ("Verification has already caught and reverted bad work"). Both are specified-only claims with no matching code. The other candidates (health improvement, evidence patterns) are lower impact and don't close architectural invariant gaps.
