import type { TickType } from "../types";
import { assess } from "../skills/assess";
import { prioritise } from "../skills/prioritise";
import { work } from "../skills/work";
import { verify } from "../skills/verify";

/**
 * Invoke the skill for a given tick type.
 * Returns a human-readable log of what happened.
 *
 * Skills that aren't yet implemented return a "not implemented" message
 * rather than failing — this lets the system run with partial skill coverage.
 */
export async function runSkill(
  repoRoot: string,
  tickType: TickType
): Promise<string> {
  switch (tickType) {
    case "assess": {
      const result = await assess(repoRoot);
      return `Assessment complete. Tests: ${result.testsPass ? "pass" : "FAIL"}. Plans: ${result.openPlans.length}. Git activity: ${result.recentGitActivity.length} recent commits.`;
    }

    case "prioritise": {
      const priorities = await prioritise(repoRoot);
      return `Prioritisation complete. ${priorities.items.length} candidate(s) ranked. Top: ${priorities.items[0]?.description ?? "none"}.`;
    }

    case "work": {
      const workResult = await work(repoRoot);
      return `Work started: "${workResult.task.priority.description}" (${workResult.task.priority.type}, rank ${workResult.task.priority.rank}).`;
    }

    case "verify": {
      const verification = await verify(repoRoot);
      return `Verification: tests ${verification.testsPass ? "pass" : "FAIL"}, review ${verification.reviewPassed ? "passed" : "FAILED"}. Action: ${verification.action}. ${verification.issues.length > 0 ? "Issues: " + verification.issues.join("; ") : ""}`;
    }
  }
}
