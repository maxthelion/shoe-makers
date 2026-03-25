import type { TreeNode, WorldState, NodeStatus } from "../types";

/** A single entry in the tree evaluation trace */
export interface TraceEntry {
  /** The condition name (e.g., "tests-failing") */
  condition: string;
  /** Whether the condition passed */
  passed: boolean;
  /** The skill that would have been invoked */
  skill: string;
  /** Optional annotation (e.g., "2 unknowns: typecheckPass, healthScore") */
  note?: string;
}

/**
 * Evaluate a behaviour tree node against the current world state.
 * Returns the name of the skill to invoke, or null if nothing to do.
 *
 * Selector: try each child in order, return first success.
 * Sequence: run each child in order, fail on first failure.
 * Condition: check the condition, return success/failure.
 * Action: return success and the skill name.
 */
export function evaluate(
  node: TreeNode,
  state: WorldState
): { status: NodeStatus; skill: string | null } {
  switch (node.type) {
    case "selector": {
      for (const child of node.children ?? []) {
        const result = evaluate(child, state);
        if (result.status === "success") {
          return result;
        }
      }
      return { status: "failure", skill: null };
    }

    case "sequence": {
      for (const child of node.children ?? []) {
        const result = evaluate(child, state);
        if (result.status === "failure") {
          return { status: "failure", skill: null };
        }
        if (result.status === "success" && result.skill) {
          return result;
        }
      }
      return { status: "success", skill: null };
    }

    case "condition": {
      if (!node.condition) {
        return { status: "failure", skill: null };
      }
      const passed = node.condition.check(state);
      return { status: passed ? "success" : "failure", skill: null };
    }

    case "action": {
      return { status: "success", skill: node.skill ?? null };
    }
  }
}

/**
 * Evaluate a behaviour tree and return a trace of condition checks.
 *
 * Builds the trace in a single pass rather than evaluating conditions twice.
 * Assumes a flat tree shape: root selector → sequence[condition, ..., action].
 * Non-matching children are evaluated via `evaluate()` without tracing.
 */
export function evaluateWithTrace(
  node: TreeNode,
  state: WorldState
): { status: NodeStatus; skill: string | null; trace: TraceEntry[] } {
  const trace: TraceEntry[] = [];

  if (node.type !== "selector" || !node.children) {
    const result = evaluate(node, state);
    return { ...result, trace };
  }

  // Walk selector children, building trace as we go
  for (const child of node.children) {
    if (child.type === "sequence" && child.children && child.children.length >= 2) {
      const condNode = child.children[0];
      const actNode = child.children[child.children.length - 1];
      const skill = actNode.skill ?? child.name;

      if (condNode.type === "condition" && condNode.condition) {
        const passed = condNode.condition.check(state);
        trace.push({ condition: child.name, passed, skill });

        if (passed) {
          // Condition passed — evaluate the rest of the sequence for the skill result
          const result = evaluate(child, state);
          if (result.status === "success") {
            return { ...result, trace };
          }
        }
        continue;
      }
    }

    // Non-standard child shape — fall back to normal evaluate
    const result = evaluate(child, state);
    if (result.status === "success") {
      return { ...result, trace };
    }
  }

  return { status: "failure", skill: null, trace };
}

/**
 * Format a trace as human-readable lines with check/cross markers.
 */
export function formatTrace(trace: TraceEntry[]): string {
  return trace
    .map((entry) => {
      if (entry.passed) {
        return `  ✓ ${entry.condition} → ${entry.skill}`;
      }
      const suffix = entry.note ? ` (${entry.note})` : "";
      return `  ✗ ${entry.condition}${suffix}`;
    })
    .join("\n");
}
