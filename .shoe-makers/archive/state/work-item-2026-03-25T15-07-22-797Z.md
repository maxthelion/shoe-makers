# Implement commit-or-revert verification gate

skill-type: implement

## What to build

A `commitOrRevert` verification function in `src/verify/` that decides whether to keep or revert an elf's commit based on test results and health regression. This closes the last 2 specified-only invariants.

## Invariant gaps being closed

1. `verification.commit-or-revert` — claim-evidence requires source containing `"commit"` and `"revert"` strings, test containing `commit`
2. `spec.review-and-merge-with-confidence.verification-has-already-caught-and-reverted-bad-work-whats-` — requires source containing `verify`, `"commit"`, and `"revert"`

## Relevant wiki text

From `wiki/pages/architecture.md`:
> Each scheduled invocation does ONE thing and exits. The behaviour tree evaluates, picks an action, the elf does it, exits.

From `wiki/pages/verification.md`:
> Verification is not self-review. The executor and verifier must be different elves.

From `.shoe-makers/invariants.md` section 1.3:
> "Verification has already caught and reverted bad work — what's on the branch passed checks"

From `.shoe-makers/invariants.md` section 4:
> "Side effects (commit, push, merge) live in the tick loop, never in agents"

## Relevant code

- `src/verify/health-regression.ts` — existing pattern: pure function that checks before/after health, returns issue string or null
- `src/verify/detect-violations.ts` — existing pattern: reads git state, returns violation list
- `src/verify/violation-findings.ts` — existing pattern: writes findings when violations found
- `src/scheduler/housekeeping.ts` — existing pattern for post-commit operations (auto-commit, review marker)
- `src/setup.ts` — orchestrator that calls verification steps

## Exactly what to build

### 1. Create `src/verify/commit-or-revert.ts`

A pure function that takes verification results and returns a decision:

```typescript
export type VerifyDecision = "commit" | "revert";

export interface VerifyResult {
  decision: VerifyDecision;
  reason: string;
}

/**
 * Decide whether to keep ("commit") or revert the elf's latest work
 * based on test results and health regression.
 *
 * This is the automated verification gate described in the invariants:
 * "Verification has already caught and reverted bad work —
 *  what's on the branch passed checks"
 */
export function verify(testsPass: boolean, healthIssue: string | null): VerifyResult {
  if (!testsPass) {
    return { decision: "revert", reason: "Tests are failing" };
  }
  if (healthIssue) {
    return { decision: "revert", reason: healthIssue };
  }
  return { decision: "commit", reason: "Tests pass and health is stable" };
}
```

Key design choices:
- Pure function — no side effects, follows the pattern in `health-regression.ts`
- Returns `"commit"` or `"revert"` as literal strings — these satisfy the claim-evidence patterns
- The `verify` export name satisfies the second invariant's `[verify]` evidence pattern
- Takes simple inputs (boolean + string|null) so it's easy to test and call from setup

### 2. Create `src/__tests__/commit-or-revert.test.ts`

Tests for the verification gate:

```typescript
import { describe, test, expect } from "bun:test";
import { verify } from "../verify/commit-or-revert";

describe("commit-or-revert verification gate", () => {
  test("returns commit when tests pass and health is stable", () => {
    const result = verify(true, null);
    expect(result.decision).toBe("commit");
  });

  test("returns revert when tests fail", () => {
    const result = verify(false, null);
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("Tests");
  });

  test("returns revert when health regresses", () => {
    const result = verify(true, "Health dropped from 99 to 90");
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("Health");
  });

  test("tests failing takes priority over health", () => {
    const result = verify(false, "Health dropped");
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("Tests");
  });
});
```

### 3. Wire into `src/setup.ts`

Add a call to the verify function in setup after running the assessment. If the decision is "revert", log a warning and write a finding. The actual `git revert` is a side effect that setup can perform (setup is the scheduler, not an agent).

Look for where setup runs `bun test` and checks health. After those checks, call `verify(testsPass, healthIssue)`. If the result is "revert":
- Log `[setup] Verification gate: reverting last commit (reason: ...)`
- Run `git revert --no-edit HEAD` to undo the elf's last commit
- This ensures "what's on the branch passed checks" is mechanically true

**Important**: Only revert if the previous action was an elf work action (execute-work-item, fix-tests, fix-critique, dead-code, continue-work). Don't revert orchestration actions (explore, prioritise, innovate, evaluate-insight) since they only write state files.

## Patterns to follow

- `src/verify/health-regression.ts` — pure function returning issue description or null
- `src/verify/detect-violations.ts` — reading git state and returning structured results
- Export types from `src/types.ts` only if needed by multiple modules; otherwise keep types local
- Keep the function small and focused — the verify function itself should be < 20 lines

## What NOT to change

- Do NOT modify `src/tree/default-tree.ts` — the tree routing doesn't change
- Do NOT modify `src/verify/permissions.ts` — permission model is separate
- Do NOT modify `.shoe-makers/invariants.md` — human only
- Do NOT modify `src/scheduler/tick.ts` — tick remains pure
- Do NOT modify existing tests — only add new ones
- Do NOT add the revert logic to agents — it belongs in setup (scheduler layer)

## Decision Rationale

Candidate 1 (commit-or-revert) was chosen over health improvement (candidate 3) because:
- It closes the last 2 specified-only invariants, which the setup explicitly flagged
- The finding in `.shoe-makers/findings/stale-verification-invariants.md` has been open and needs resolution
- The implementation is small and well-scoped — a single pure function + tests + wiring
- Health improvement (score 99/100) is lower priority than closing spec gaps
- Candidates 2 and 5 (doc-sync) are lower impact; candidate 4 (test coverage) is subsumed by this work
