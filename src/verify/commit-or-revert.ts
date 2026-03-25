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
