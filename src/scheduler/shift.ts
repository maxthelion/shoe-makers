import type { TickType, WorldState } from "../types";
import { readWorldState } from "../state/world";
import { tick, type TickResult } from "./tick";
import { runSkill } from "./run-skill";
import { appendToShiftLog, formatTickLog } from "../log/shift-log";
import { readBlackboard } from "../state/blackboard";

/** Result of a single step within a shift */
export interface ShiftStep {
  tick: TickResult;
  skillResult: string | null;
  error: string | null;
}

/** Result of a full shift (multiple ticks) */
export interface ShiftResult {
  steps: ShiftStep[];
  /** Why the shift stopped */
  outcome: "sleep" | "work" | "max-ticks" | "error";
  /** If outcome is "work", the instructions for the caller */
  workInstructions: string | null;
}

/** Options for running a shift */
export interface ShiftOptions {
  /** Maximum number of ticks to run before stopping (default: 10) */
  maxTicks?: number;
  /** Called after each tick for observability */
  onTick?: (step: ShiftStep) => void;
  /** Override how world state is read (for testing) */
  readState?: (repoRoot: string) => Promise<WorldState>;
  /** Override how skills are run (for testing) */
  runSkill?: (repoRoot: string, tickType: TickType) => Promise<string>;
  /** Override shift log writing (for testing) */
  writeLog?: (repoRoot: string, entry: string) => Promise<void>;
}

/**
 * Run a full shift: execute ticks in sequence until done.
 *
 * The shift runner loops through ticks, re-reading world state each time.
 * It stops when:
 * - The tree says "sleep" (nothing to do) → outcome: "sleep"
 * - The tree says "work" (caller must act on instructions) → outcome: "work"
 * - Max ticks reached (safety limit) → outcome: "max-ticks"
 * - An unrecoverable error occurs → outcome: "error"
 *
 * The idea: assess and prioritise are housekeeping — the shift runner handles
 * them automatically. Work requires the caller (elf/agent) to act, so the
 * shift pauses and returns instructions. Verify is also automatic (runs tests,
 * decides commit/revert).
 */
export async function shift(
  repoRoot: string,
  options: ShiftOptions = {}
): Promise<ShiftResult> {
  const maxTicks = options.maxTicks ?? 10;
  const getState = options.readState ?? readWorldState;
  const execSkill = options.runSkill ?? runSkill;
  const writeLog = options.writeLog ?? defaultWriteLog;
  const steps: ShiftStep[] = [];

  for (let i = 0; i < maxTicks; i++) {
    // Re-read world state each tick (skills mutate blackboard)
    const state = await getState(repoRoot);
    const result = tick(state);

    let skillResult: string | null = null;
    let error: string | null = null;

    if (!result.tickType) {
      // Tree says sleep — we're done
      const step: ShiftStep = { tick: result, skillResult: null, error: null };
      steps.push(step);
      options.onTick?.(step);
      await writeLog(repoRoot, formatEntry(state.branch, result, null, null));
      return { steps, outcome: "sleep", workInstructions: null };
    }

    if (result.tickType === "work") {
      // Work requires the caller to act — run the skill to get instructions,
      // then pause the shift and return them
      try {
        skillResult = await execSkill(repoRoot, result.tickType);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      const step: ShiftStep = { tick: result, skillResult, error };
      steps.push(step);
      options.onTick?.(step);
      await writeLog(repoRoot, formatEntry(state.branch, result, skillResult, error));

      if (error) {
        return { steps, outcome: "error", workInstructions: null };
      }

      // Read back the current-task instructions
      const blackboard = await readBlackboard(repoRoot);
      const instructions = blackboard.currentTask
        ? buildWorkSummary(blackboard.currentTask.priority.description, skillResult)
        : null;

      return { steps, outcome: "work", workInstructions: instructions };
    }

    // Housekeeping tick (assess, prioritise, verify) — run and continue
    try {
      skillResult = await execSkill(repoRoot, result.tickType);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const step: ShiftStep = { tick: result, skillResult, error };
    steps.push(step);
    options.onTick?.(step);
    await writeLog(repoRoot, formatEntry(state.branch, result, skillResult, error));

    if (error) {
      return { steps, outcome: "error", workInstructions: null };
    }
  }

  return { steps, outcome: "max-ticks", workInstructions: null };
}

/** Default log writer — appends to the shift log */
async function defaultWriteLog(repoRoot: string, entry: string): Promise<void> {
  await appendToShiftLog(repoRoot, entry);
}

/** Format a log entry */
function formatEntry(
  branch: string,
  result: TickResult,
  skillResult: string | null,
  error: string | null
): string {
  return formatTickLog({
    branch,
    tickType: result.tickType,
    skill: result.skill,
    result: skillResult,
    error,
  });
}

/** Build a summary of work instructions for the caller */
function buildWorkSummary(description: string, skillResult: string | null): string {
  const lines = [
    `The shift runner has set up a work task:`,
    "",
    `**Task**: ${description}`,
    "",
    skillResult ?? "",
    "",
    "Run `bun run task:status` for full task details.",
    "When done, run `bun run task:done` (or `bun run task:fail`), then run `bun run shift` again to verify.",
  ];
  return lines.join("\n");
}
