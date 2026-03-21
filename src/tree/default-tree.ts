import type { TreeNode, WorldState } from "../types";

/**
 * The game-style behaviour tree.
 *
 * A selector with conditions checked in priority order. First match wins.
 * The agent works on that action until the condition is resolved, then the
 * tree falls through to the next applicable action.
 *
 * Selector
 * ├── [tests failing?] → Fix them
 * ├── [unverified work on branch?] → Review the diff adversarially
 * ├── [inbox messages?] → Read and act on them
 * ├── [open plans?] → Implement the most important one
 * ├── [specified-only invariants?] → Implement the most impactful one
 * ├── [untested code?] → Write tests
 * ├── [undocumented code?] → Update the wiki
 * ├── [code health below threshold?] → Fix the worst file
 * ├── [nothing?] → Explore deeper (refresh assessment)
 */

function testsFailing(state: WorldState): boolean {
  return state.blackboard.assessment?.testsPass === false;
}

function hasUnresolvedCritiques(state: WorldState): boolean {
  return state.unresolvedCritiqueCount > 0;
}

function hasUnreviewedCommits(state: WorldState): boolean {
  return state.hasUnreviewedCommits;
}

function hasUnverifiedWork(state: WorldState): boolean {
  // Uncommitted changes on the branch need reviewing before commit
  return state.hasUncommittedChanges;
}

function hasInboxMessages(state: WorldState): boolean {
  return state.inboxCount > 0;
}

function hasOpenPlans(state: WorldState): boolean {
  return (state.blackboard.assessment?.openPlans.length ?? 0) > 0;
}

function hasSpecGaps(state: WorldState): boolean {
  return (state.blackboard.assessment?.invariants?.specifiedOnly ?? 0) > 0;
}

function hasUntestedCode(state: WorldState): boolean {
  return (state.blackboard.assessment?.invariants?.implementedUntested ?? 0) > 0;
}

function hasUndocumentedCode(state: WorldState): boolean {
  return (state.blackboard.assessment?.invariants?.unspecified ?? 0) > 0;
}

function healthBelowThreshold(state: WorldState): boolean {
  const score = state.blackboard.assessment?.healthScore;
  return score !== null && score !== undefined && score < 70;
}

function alwaysTrue(_state: WorldState): boolean {
  return true;
}

function makeConditionAction(
  name: string,
  check: (state: WorldState) => boolean,
  skill: string
): TreeNode {
  return {
    type: "sequence",
    name,
    children: [
      {
        type: "condition",
        name: `${name}-check`,
        condition: { name: `${name}-check`, check },
      },
      { type: "action", name: `${name}-action`, skill },
    ],
  };
}

export const defaultTree: TreeNode = {
  type: "selector",
  name: "root",
  children: [
    makeConditionAction("tests-failing", testsFailing, "fix-tests"),
    makeConditionAction("unresolved-critiques", hasUnresolvedCritiques, "fix-critique"),
    makeConditionAction("unreviewed-commits", hasUnreviewedCommits, "critique"),
    makeConditionAction("unverified-work", hasUnverifiedWork, "review"),
    makeConditionAction("inbox-messages", hasInboxMessages, "inbox"),
    makeConditionAction("open-plans", hasOpenPlans, "implement-plan"),
    makeConditionAction("spec-gaps", hasSpecGaps, "implement-spec"),
    makeConditionAction("untested-code", hasUntestedCode, "write-tests"),
    makeConditionAction("undocumented-code", hasUndocumentedCode, "document"),
    makeConditionAction("low-health", healthBelowThreshold, "improve-health"),
    makeConditionAction("explore", alwaysTrue, "explore"),
  ],
};
