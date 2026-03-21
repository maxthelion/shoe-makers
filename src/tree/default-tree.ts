import type { TreeNode, WorldState } from "../types";

/**
 * Check if the assessment is stale.
 * Stale means: no assessment exists, or it's older than the threshold.
 */
function isAssessmentStale(state: WorldState, staleAfterMs = 30 * 60 * 1000): boolean {
  const assessment = state.blackboard.assessment;
  if (!assessment) return true;
  const age = Date.now() - new Date(assessment.timestamp).getTime();
  return age > staleAfterMs;
}

/**
 * Check if priorities are stale.
 * Stale means: no priorities exist, or the assessment is newer than the priorities.
 */
function isPrioritisationStale(state: WorldState): boolean {
  const { assessment, priorities } = state.blackboard;
  if (!assessment) return false; // can't prioritise without assessment
  if (!priorities) return true;
  return assessment.timestamp > priorities.assessedAt;
}

/**
 * Check if there's unverified work on the branch.
 */
function hasUnverifiedWork(state: WorldState): boolean {
  const { currentTask, verification } = state.blackboard;
  if (!currentTask) return false;
  if (currentTask.status === "in-progress") return false; // still working
  // Task is done or failed but not yet verified
  if (!verification) return true;
  return new Date(currentTask.startedAt) > new Date(verification.timestamp);
}

/**
 * Check if there's a priority item ready to work on.
 */
function hasWorkToDo(state: WorldState): boolean {
  const { priorities, currentTask } = state.blackboard;
  if (!priorities || priorities.items.length === 0) return false;
  // Don't start new work if current task is in progress
  if (currentTask?.status === "in-progress") return false;
  return true;
}

/**
 * The default behaviour tree.
 *
 * Routes between tick types based on staleness:
 * 1. ASSESS if assessment is stale
 * 2. PRIORITISE if assessment is newer than priorities
 * 3. VERIFY if there's unverified completed work
 * 4. WORK if there's a priority item to work on
 * 5. Sleep
 */
export const defaultTree: TreeNode = {
  type: "selector",
  name: "root",
  children: [
    {
      type: "sequence",
      name: "assess",
      children: [
        {
          type: "condition",
          name: "assessment-stale",
          condition: {
            name: "assessment-stale",
            check: (state) => isAssessmentStale(state),
          },
        },
        { type: "action", name: "assess", skill: "assess" },
      ],
    },
    {
      type: "sequence",
      name: "prioritise",
      children: [
        {
          type: "condition",
          name: "prioritisation-stale",
          condition: {
            name: "prioritisation-stale",
            check: (state) => isPrioritisationStale(state),
          },
        },
        { type: "action", name: "prioritise", skill: "prioritise" },
      ],
    },
    {
      type: "sequence",
      name: "verify",
      children: [
        {
          type: "condition",
          name: "has-unverified-work",
          condition: {
            name: "has-unverified-work",
            check: (state) => hasUnverifiedWork(state),
          },
        },
        { type: "action", name: "verify", skill: "verify" },
      ],
    },
    {
      type: "sequence",
      name: "work",
      children: [
        {
          type: "condition",
          name: "has-work-to-do",
          condition: {
            name: "has-work-to-do",
            check: (state) => hasWorkToDo(state),
          },
        },
        { type: "action", name: "work", skill: "work" },
      ],
    },
  ],
};
