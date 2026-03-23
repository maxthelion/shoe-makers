import type { WorldState } from "../types";
import { readWorldState } from "../state/world";
import { tick, type TickResult } from "./tick";
import { runSkill } from "./run-skill";
import { appendToShiftLog, formatTickLog } from "../log/shift-log";
import { summarizeShift, type ShiftSummary } from "../log/shift-summary";
import { buildSuggestions } from "../skills/assess";
import { formatTrace } from "../tree/evaluate";

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
  outcome: "sleep" | "action" | "max-ticks" | "error";
  /** Summary of improvement categories covered */
  summary: ShiftSummary;
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
  runSkill?: (repoRoot: string, tickType: string) => Promise<string>;
  /** Override shift log writing (for testing) */
  writeLog?: (repoRoot: string, entry: string) => Promise<void>;
}

/**
 * Run a full shift: execute ticks in sequence until done.
 *
 * With the game-style tree, most actions produce a prompt for the elf.
 * Only "explore" runs programmatically (refreshes assessment).
 * The shift runner loops explore ticks automatically and stops when
 * a non-explore action is selected (the elf must act).
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
    const state = await getState(repoRoot);
    const result = tick(state);

    let skillResult: string | null = null;
    let error: string | null = null;

    if (!result.action) {
      // Tree says sleep — nothing to do (shouldn't happen with explore at bottom)
      const step: ShiftStep = { tick: result, skillResult: null, error: null };
      steps.push(step);
      options.onTick?.(step);
      await writeLog(repoRoot, formatEntry(state.branch, result, null, null, state));
      return { steps, outcome: "sleep", summary: summarizeShift(steps) };
    }

    // Run the action
    try {
      skillResult = await execSkill(repoRoot, result.action);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const step: ShiftStep = { tick: result, skillResult, error };
    steps.push(step);
    options.onTick?.(step);
    await writeLog(repoRoot, formatEntry(state.branch, result, skillResult, error, state));

    if (error) {
      return { steps, outcome: "error", summary: summarizeShift(steps) };
    }

    // Explore runs programmatically — loop to re-evaluate tree.
    // All other actions need the elf, so return.
    if (result.action !== "explore") {
      return { steps, outcome: "action", summary: summarizeShift(steps) };
    }
  }

  return { steps, outcome: "max-ticks", summary: summarizeShift(steps) };
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
  error: string | null,
  state: WorldState
): string {
  return formatTickLog({
    branch,
    tickType: result.action,
    skill: result.skill,
    result: skillResult,
    error,
    suggestions: buildSuggestions(state.blackboard.assessment),
    trace: result.trace.length > 0 ? formatTrace(result.trace) : undefined,
  });
}
