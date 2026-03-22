import type { ActionType } from "../types";
import { assess } from "../skills/assess";

/**
 * Invoke the skill for a given action type.
 * Returns a human-readable log of what happened.
 *
 * Most actions produce a prompt for the elf — only "explore" runs
 * programmatic assessment. The elf IS the intelligence for everything else.
 */
export async function runSkill(
  repoRoot: string,
  action: string
): Promise<string> {
  switch (action as ActionType) {
    case "explore": {
      const result = await assess(repoRoot);
      return `Explore complete. Tests: ${result.testsPass ? "pass" : "FAIL"}. Plans: ${result.openPlans.length}. Invariants: ${result.invariants?.specifiedOnly ?? "?"} specified-only, ${result.invariants?.implementedUntested ?? "?"} untested.`;
    }

    case "fix-tests":
      return "Action: fix-tests — elf should run tests and fix failures.";

    case "fix-critique":
      return "Action: fix-critique — elf should read unresolved critique findings and fix the issues.";

    case "critique":
      return "Action: critique — elf should adversarially review unreviewed commits.";

    case "review":
      return "Action: review — elf should review uncommitted changes adversarially.";

    case "inbox":
      return "Action: inbox — elf should read and act on inbox messages.";

    case "execute-work-item":
      return "Action: execute-work-item — elf should read work-item.md and do the work described.";

    case "dead-code":
      return "Action: dead-code — elf should identify and remove dead code, including stale test files.";

    case "prioritise":
      return "Action: prioritise — elf should read candidates.md, pick one, and write a detailed work-item.md.";

    default:
      return `Unknown action: ${action}`;
  }
}
