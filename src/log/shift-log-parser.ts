import { readFile } from "fs/promises";
import { join } from "path";
import { REACTIVE_ACTIONS, PROACTIVE_ACTIONS } from "./action-classification";

/** Map prompt title keywords to action names */
const TITLE_TO_ACTION: [RegExp, string][] = [
  [/Fix Failing Tests/i, "fix-tests"],
  [/Fix Unresolved Critiques/i, "fix-critique"],
  [/Adversarial Review/i, "critique"],
  [/Continue Partial Work/i, "continue-work"],
  [/Review Uncommitted Work/i, "review"],
  [/Inbox Messages/i, "inbox"],
  [/Execute Work Item/i, "execute-work-item"],
  [/Remove Dead Code/i, "dead-code"],
  [/Prioritise/i, "prioritise"],
  [/Innovate/i, "innovate"],
  [/Evaluate Insight/i, "evaluate-insight"],
  [/Explore/i, "explore"],
];

/**
 * Parse action names from shift log entries.
 *
 * The shift log has entries like:
 *   - Action: Adversarial Review — Critique Previous Elf's Work
 *   - Action: Fix Failing Tests
 *
 * Returns recognized action names in order.
 */
export function parseShiftLogActions(logContent: string): string[] {
  const actions: string[] = [];
  const lines = logContent.split("\n");

  for (const line of lines) {
    const match = line.match(/^- Action:\s*(.+)/);
    if (!match) continue;
    const title = match[1].trim();
    for (const [pattern, action] of TITLE_TO_ACTION) {
      if (pattern.test(title)) {
        actions.push(action);
        break;
      }
    }
  }

  return actions;
}

/**
 * Compute process patterns from a list of action names.
 */
export function computeProcessPatterns(actions: string[]): { reactiveTicks: number; proactiveTicks: number; reactiveRatio: number; reviewLoopCount: number; innovationCycleCount: number } {
  let reactiveTicks = 0;
  let proactiveTicks = 0;

  for (const action of actions) {
    if (REACTIVE_ACTIONS.has(action)) reactiveTicks++;
    else if (PROACTIVE_ACTIONS.has(action)) proactiveTicks++;
  }

  const total = reactiveTicks + proactiveTicks;
  const reactiveRatio = total > 0 ? reactiveTicks / total : 0;

  // Detect review loops: sequences of critique/fix-critique alternating 3+ times
  const reviewActions = new Set(["critique", "fix-critique"]);
  let reviewLoopCount = 0;
  let consecutiveReviewActions = 0;
  for (const action of actions) {
    if (reviewActions.has(action)) {
      consecutiveReviewActions++;
    } else {
      if (consecutiveReviewActions >= 3) reviewLoopCount++;
      consecutiveReviewActions = 0;
    }
  }
  if (consecutiveReviewActions >= 3) reviewLoopCount++;

  const innovationCycleCount = actions.filter(a => a === "innovate").length;

  return { reactiveTicks, proactiveTicks, reactiveRatio, reviewLoopCount, innovationCycleCount };
}

/**
 * Read today's shift log and compute process patterns.
 * Returns undefined if no shift log exists.
 */
export async function getShiftProcessPatterns(repoRoot: string): Promise<{ reactiveTicks: number; proactiveTicks: number; reactiveRatio: number; reviewLoopCount: number; innovationCycleCount: number } | undefined> {
  const today = new Date().toISOString().slice(0, 10);
  const filepath = join(repoRoot, ".shoe-makers", "log", `${today}.md`);

  try {
    const content = await readFile(filepath, "utf-8");
    const actions = parseShiftLogActions(content);
    if (actions.length === 0) return undefined;
    return computeProcessPatterns(actions);
  } catch {
    return undefined;
  }
}
