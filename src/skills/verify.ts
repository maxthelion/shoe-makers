import { execSync } from "child_process";
import type { Verification } from "../types";
import { readBlackboard, writeVerification, clearCurrentTask, clearPriorities } from "../state/blackboard";

/**
 * The verify skill: check completed work, then commit or flag for revert.
 *
 * Bootstrap version runs:
 * 1. Test suite (`bun test`)
 * 2. Basic review (checks the task was marked done)
 *
 * The full version (per wiki spec) would also run:
 * - Octoclean diff (health score regression check)
 * - LLM-based adversarial review
 * - Architectural contract check
 * - Invariant re-check
 */
export async function verify(repoRoot: string): Promise<Verification> {
  const blackboard = await readBlackboard(repoRoot);

  if (!blackboard.currentTask) {
    throw new Error("Nothing to verify — no current task.");
  }

  if (blackboard.currentTask.status === "in-progress") {
    throw new Error(
      "Task is still in progress. Mark it as done or failed before verifying."
    );
  }

  const issues: string[] = [];

  // 1. Run tests
  const testsPass = runTests(repoRoot);
  if (!testsPass) {
    issues.push("Test suite failed.");
  }

  // 2. Basic review — check that the task completed (not failed)
  const taskCompleted = blackboard.currentTask.status === "done";
  if (!taskCompleted) {
    issues.push(`Task status is "${blackboard.currentTask.status}", not "done".`);
  }

  const reviewPassed = taskCompleted && issues.length === 0;
  const action = reviewPassed ? "commit" : "revert";

  const verification: Verification = {
    timestamp: new Date().toISOString(),
    taskDescription: blackboard.currentTask.priority.description,
    testsPass,
    reviewPassed,
    issues,
    action,
  };

  await writeVerification(repoRoot, verification);

  // Clear current task and priorities after verification.
  // The task is complete (committed or reverted), so remove it.
  // Clearing priorities forces re-assess → re-prioritise before new work,
  // which is correct because the world changed.
  await clearCurrentTask(repoRoot);
  await clearPriorities(repoRoot);

  return verification;
}

function runTests(repoRoot: string): boolean {
  try {
    execSync("bun test", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
