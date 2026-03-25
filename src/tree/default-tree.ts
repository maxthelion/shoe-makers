import type { TreeNode, WorldState } from "../types";
import { isInnovationTier } from "../prompts/helpers";

/**
 * The behaviour tree — reactive conditions for urgent work,
 * three-phase orchestration for proactive work.
 *
 * Selector
 * ├── [tests failing?] → Fix tests
 * ├── [review loop ≥3?] → Break out to explore
 * ├── [unresolved critiques?] → Fix critiques
 * ├── [unreviewed commits?] → Review adversarially
 * ├── [uncommitted changes?] → Review before committing
 * ├── [inbox messages?] → Handle inbox
 * ├── [dead-code work-item?] → Remove dead code
 * ├── [work-item.md exists?] → Execute the work item
 * ├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
 * ├── [insights exist?] → Evaluate insight (generous disposition)
 * ├── [innovation tier?] → Innovate: write insight from creative brief
 * └── [always true] → Explore: write candidates.md
 */

function testsFailing(state: WorldState): boolean {
  const assessment = state.blackboard.assessment;
  if (!assessment) return false;
  return assessment.testsPass === false || assessment.typecheckPass === false;
}

function inReviewLoop(state: WorldState): boolean {
  const loopCount = state.blackboard.assessment?.processPatterns?.reviewLoopCount ?? 0;
  return loopCount >= 3;
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

function hasInsights(state: WorldState): boolean {
  return state.insightCount > 0;
}

function innovationTier(state: WorldState): boolean {
  if (!isInnovationTier(state.blackboard.assessment)) return false;
  // Cap innovation cycles per shift to avoid diminishing-returns loops
  const maxCycles = state.config?.maxInnovationCycles ?? 3;
  const cycleCount = state.blackboard.assessment?.processPatterns?.innovationCycleCount ?? 0;
  return cycleCount < maxCycles;
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
    makeConditionAction("review-loop-breaker", inReviewLoop, "explore"),
    makeConditionAction("unresolved-critiques", hasUnresolvedCritiques, "fix-critique"),
    makeConditionAction("unreviewed-commits", hasUnreviewedCommits, "critique"),
    makeConditionAction("unverified-work", hasUnverifiedWork, "review"),
    makeConditionAction("inbox-messages", hasInboxMessages, "inbox"),
    // Three-phase orchestration — proactive work
    makeConditionAction("dead-code-work", hasDeadCodeWorkItem, "dead-code"),
    makeConditionAction("work-item", hasWorkItem, "execute-work-item"),
    makeConditionAction("candidates", hasCandidates, "prioritise"),
    makeConditionAction("insights", hasInsights, "evaluate-insight"),
    makeConditionAction("innovation-tier", innovationTier, "innovate"),
    makeConditionAction("explore", alwaysTrue, "explore"),
  ],
};
