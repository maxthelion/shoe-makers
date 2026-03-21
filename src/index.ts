import { readWorldState } from "./state/world";
import { tick } from "./scheduler/tick";
import { appendToShiftLog, formatTickLog } from "./log/shift-log";
import { generatePrompt } from "./prompts";

/**
 * Entry point: run one tick of the behaviour tree.
 *
 * Evaluates the tree against world state and outputs a focused prompt
 * telling the elf what to do.
 */
async function main() {
  const repoRoot = process.cwd();

  console.log("[tick] Reading world state...");
  const state = await readWorldState(repoRoot);

  console.log(`[tick] Branch: ${state.branch}`);
  console.log(`[tick] Inbox: ${state.inboxCount} message(s)`);
  console.log(`[tick] Assessment: ${state.blackboard.assessment ? "present" : "none"}`);

  const result = tick(state);

  if (result.action) {
    console.log(`[tick] Tree decided: ${result.action}`);
    const prompt = generatePrompt(result.action, state);
    console.log("\n---\n");
    console.log(prompt);
  } else {
    console.log("[tick] Tree decided: sleep (nothing to do)");
  }

  // Write to shift log
  const logEntry = formatTickLog({
    branch: state.branch,
    tickType: result.action,
    skill: result.skill,
    result: result.action ? `Action: ${result.action}` : null,
    error: null,
  });
  await appendToShiftLog(repoRoot, logEntry);

  console.log(`\n[tick] Complete at ${result.timestamp}`);
}

main().catch((err) => {
  console.error("[tick] Fatal error:", err);
  process.exit(1);
});
