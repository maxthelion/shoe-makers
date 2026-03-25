import type { ActionType, WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { findSkillForAction, formatSkillSection } from "./helpers";
import { buildFixTestsPrompt, buildFixCritiquePrompt, buildCritiquePrompt, buildContinueWorkPrompt, buildReviewPrompt, buildInboxPrompt } from "./reactive";
import { buildExplorePrompt, buildPrioritisePrompt, buildExecutePrompt, buildDeadCodePrompt, buildInnovatePrompt, buildEvaluateInsightPrompt } from "./three-phase";

export { ACTION_TO_SKILL_TYPE, parseActionTypeFromPrompt } from "./helpers";

/**
 * Generate a focused prompt for the elf based on the tree's decision.
 *
 * Each action produces a scoped prompt telling the elf exactly what to do.
 * This is the interface between the deterministic tree and the elf's intelligence.
 */
export function generatePrompt(
  action: ActionType,
  state: WorldState,
  skills?: Map<string, SkillDefinition>,
  article?: { title: string; summary: string },
  permissionViolations?: string[],
  wikiSummary?: string,
): string {
  const skill = findSkillForAction(action, skills);
  const skillSection = skill ? formatSkillSection(skill) : "";

  switch (action) {
    case "fix-tests":
      return buildFixTestsPrompt(skillSection);
    case "fix-critique":
      return buildFixCritiquePrompt();
    case "critique":
      return buildCritiquePrompt(permissionViolations);
    case "continue-work":
      return buildContinueWorkPrompt();
    case "review":
      return buildReviewPrompt();
    case "inbox":
      return buildInboxPrompt(state);
    case "execute-work-item":
      return buildExecutePrompt(skillSection);
    case "dead-code":
      return buildDeadCodePrompt(skillSection);
    case "prioritise":
      return buildPrioritisePrompt(state);
    case "innovate":
      return buildInnovatePrompt(
        wikiSummary ?? "No wiki summary available.",
        article,
      );
    case "evaluate-insight":
      return buildEvaluateInsightPrompt();
    case "explore":
      return buildExplorePrompt(state, skills, article);
  }
}
