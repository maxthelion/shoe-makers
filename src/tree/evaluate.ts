import type { TreeNode, WorldState, NodeStatus } from "../types";

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
