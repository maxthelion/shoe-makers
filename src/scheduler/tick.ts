import type { WorldState, ActionType } from "../types";
import { evaluateWithTrace, type TraceEntry } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";

/** Result of a single tick evaluation */
export interface TickResult {
  timestamp: string;
  branch: string;
  skill: string | null;
  /** The action the tree decided on */
  action: ActionType | null;
  /** Tree evaluation trace showing which conditions were checked */
  trace: TraceEntry[];
}

/** Map skill names to action types */
const SKILL_TO_ACTION: Record<string, ActionType> = {
  "fix-tests": "fix-tests",
  "fix-critique": "fix-critique",
  critique: "critique",
  review: "review",
  inbox: "inbox",
  "execute-work-item": "execute-work-item",
  "dead-code": "dead-code",
  prioritise: "prioritise",
  explore: "explore",
};

/**
 * Execute one tick: evaluate the behaviour tree against world state.
 * Returns the tick result (which action to take, or null for sleep).
 *
 * This function is pure — it does not invoke the skill or produce side effects.
 */
export function tick(state: WorldState): TickResult {
  const { skill, trace } = evaluateWithTrace(defaultTree, state);
  const action = skill ? (SKILL_TO_ACTION[skill] ?? null) : null;

  return {
    timestamp: new Date().toISOString(),
    branch: state.branch,
    skill,
    action,
    trace,
  };
}
