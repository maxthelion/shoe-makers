import { shift, type ShiftStep } from "./scheduler/shift";
import { loadConfig } from "./config/load-config";

/**
 * Entry point for `bun run shift`.
 *
 * Evaluates the game-style behaviour tree. If the tree says "explore",
 * runs the assessment automatically and re-evaluates. For all other
 * actions, outputs the action for the elf to execute.
 */
async function main() {
  const repoRoot = process.cwd();
  const config = await loadConfig(repoRoot);
  let tickCount = 0;

  console.log("[shoe-makers] Starting shift...\n");

  const result = await shift(repoRoot, {
    maxTicks: config.maxTicksPerShift,
    onTick(step: ShiftStep) {
      tickCount++;
      const tick = step.tick;
      if (tick.action) {
        console.log(`[tick ${tickCount}] ${tick.action}: ${step.skillResult ?? step.error ?? "done"}`);
      } else {
        console.log(`[tick ${tickCount}] sleep — nothing to do`);
      }
    },
  });

  console.log(`\n[shoe-makers] Shift complete. Outcome: ${result.outcome}`);
  console.log(`[shoe-makers] ${result.steps.length} tick(s) executed.\n`);

  if (result.outcome === "action" && result.workInstructions) {
    console.log("--- Action ---\n");
    console.log(result.workInstructions);
    console.log("\n--- End Action ---");
  }

  if (result.outcome === "error") {
    const lastError = result.steps[result.steps.length - 1]?.error;
    console.error(`[shoe-makers] Error: ${lastError}`);
    process.exit(1);
  }

  if (result.outcome === "max-ticks") {
    console.warn("[shoe-makers] Warning: reached max ticks limit. Something may be cycling.");
  }
}

main().catch((err) => {
  console.error("[shoe-makers] Fatal error:", err);
  process.exit(1);
});
