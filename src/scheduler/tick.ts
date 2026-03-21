import type { WorldState, TickType } from "../types";
import { evaluate } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";

/** Result of a single tick evaluation */
export interface TickResult {
  timestamp: string;
  branch: string;
  skill: string | null;
  tickType: TickType | null;
}

/** Map skill names to tick types */
const SKILL_TO_TICK: Record<string, TickType> = {
  assess: "assess",
  prioritise: "prioritise",
  work: "work",
  verify: "verify",
};

/**
 * Execute one tick: evaluate the behaviour tree against world state.
 * Returns the tick result (which skill to invoke, or null for sleep).
 *
 * This function is pure — it does not invoke the skill or produce side effects.
 */
export function tick(state: WorldState): TickResult {
  const { status, skill } = evaluate(defaultTree, state);

  return {
    timestamp: new Date().toISOString(),
    branch: state.branch,
    skill,
    tickType: skill ? (SKILL_TO_TICK[skill] ?? null) : null,
  };
}
