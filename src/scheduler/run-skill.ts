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

    case "implement-plan":
      return "Action: implement-plan — elf should read open plans and implement the most important one.";

    case "implement-spec":
      return "Action: implement-spec — elf should implement the most impactful specified-only invariant.";

    case "write-tests":
      return "Action: write-tests — elf should add tests for untested code.";

    case "document":
      return "Action: document — elf should update the wiki for undocumented code.";

    case "improve-health":
      return "Action: improve-health — elf should improve the worst code health file.";

    default:
      return `Unknown action: ${action}`;
  }
}
