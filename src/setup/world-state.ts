import type { WorldState, Blackboard, Config } from "../types";
import type { assess } from "../skills/assess";
import { checkUnreviewedCommits, countUnresolvedCritiques, hasUncommittedChanges, checkHasWorkItem, checkHasCandidates, readWorkItemSkillType, countInsights, checkHasPartialWork } from "../state/world";

export async function buildWorldState(
  repoRoot: string,
  branchName: string,
  assessment: Awaited<ReturnType<typeof assess>>,
  inboxCount: number,
  config: Config,
): Promise<WorldState> {
  const [uncommitted, hasUnreviewedCommits_, unresolvedCritiqueCount, hasWorkItem, hasCandidates, workItemSkillType, insightCount, hasPartialWork] = await Promise.all([
    hasUncommittedChanges(repoRoot),
    checkUnreviewedCommits(repoRoot),
    countUnresolvedCritiques(repoRoot),
    checkHasWorkItem(repoRoot),
    checkHasCandidates(repoRoot),
    readWorkItemSkillType(repoRoot),
    countInsights(repoRoot),
    checkHasPartialWork(repoRoot),
  ]);

  const blackboard: Blackboard = {
    assessment,
    currentTask: null,
    priorities: null,
    verification: null,
  };

  return {
    branch: branchName,
    hasUncommittedChanges: uncommitted,
    inboxCount,
    hasUnreviewedCommits: hasUnreviewedCommits_,
    unresolvedCritiqueCount,
    hasWorkItem,
    hasCandidates,
    workItemSkillType,
    hasPartialWork,
    insightCount,
    blackboard,
    config,
  };
}
