/**
 * Commit-or-revert verification: decide whether to keep or revert elf work.
 *
 * After an elf finishes, check whether tests pass and typecheck passes.
 * If both pass, the work is good ("commit"). If either fails, the work
 * should be reverted to keep the branch clean ("revert").
 *
 * This function is pure — it returns a decision. The caller handles
 * the actual git revert if needed.
 */

export interface VerificationResult {
  decision: "commit" | "revert";
  testsPass: boolean;
  typecheckPass: boolean;
  reason: string;
}

export function verifyOrRevert(
  testsPass: boolean,
  typecheckPass: boolean,
): VerificationResult {
  if (testsPass && typecheckPass) {
    return {
      decision: "commit",
      testsPass,
      typecheckPass,
      reason: "Tests and typecheck pass — work is good",
    };
  }

  const failures: string[] = [];
  if (!testsPass) failures.push("tests failing");
  if (!typecheckPass) failures.push("typecheck failing");

  return {
    decision: "revert",
    testsPass,
    typecheckPass,
    reason: `Reverting: ${failures.join(", ")}`,
  };
}
