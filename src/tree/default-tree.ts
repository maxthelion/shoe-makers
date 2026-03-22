import type { TreeNode, WorldState } from "../types";

/**
 * The behaviour tree — reactive conditions for urgent work,
 * three-phase orchestration for proactive work.
 *
 * Selector
 * ├── [tests failing?] → Fix tests (direct)
 * ├── [unresolved critiques?] → Fix critiques (direct)
 * ├── [unreviewed commits?] → Review adversarially (direct)
 * ├── [uncommitted changes?] → Review before committing (direct)
 * ├── [inbox messages?] → Handle inbox (direct)
 * ├── [work-item.md exists?] → Execute the work item
 * ├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
 * ├── [neither?] → Explore: write candidates.md
 */

function testsFailing(state: WorldState): boolean {
  const assessment = state.blackboard.assessment;
  if (!assessment) return false;
  return assessment.testsPass === false || assessment.typecheckPass === false;
}

function hasUnresolvedCritiques(state: WorldState): boolean {
  return state.unresolvedCritiqueCount > 0;
}

function hasUnreviewedCommits(state: WorldState): boolean {
  return state.hasUnreviewedCommits;
}

function hasUnverifiedWork(state: WorldState): boolean {
  return state.hasUncommittedChanges;
}

function hasInboxMessages(state: WorldState): boolean {
  return state.inboxCount > 0;
}

function hasDeadCodeWorkItem(state: WorldState): boolean {
  return state.hasWorkItem && state.workItemSkillType === "dead-code";
}

function hasWorkItem(state: WorldState): boolean {
  return state.hasWorkItem;
}

function hasCandidates(state: WorldState): boolean {
  return state.hasCandidates;
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
    // Reactive zone — urgent, handled with direct prompts
    makeConditionAction("tests-failing", testsFailing, "fix-tests"),
    makeConditionAction("unresolved-critiques", hasUnresolvedCritiques, "fix-critique"),
    makeConditionAction("unreviewed-commits", hasUnreviewedCommits, "critique"),
    makeConditionAction("unverified-work", hasUnverifiedWork, "review"),
    makeConditionAction("inbox-messages", hasInboxMessages, "inbox"),
    // Three-phase orchestration — proactive work
    makeConditionAction("dead-code-work", hasDeadCodeWorkItem, "dead-code"),
    makeConditionAction("work-item", hasWorkItem, "execute-work-item"),
    makeConditionAction("candidates", hasCandidates, "prioritise"),
    makeConditionAction("explore", alwaysTrue, "explore"),
  ],
};
