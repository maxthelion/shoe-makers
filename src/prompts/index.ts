import type { ActionType, WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { findSkillForAction, formatSkillSection } from "./helpers";
import { buildFixTestsPrompt, buildFixCritiquePrompt, buildCritiquePrompt, buildReviewPrompt, buildInboxPrompt } from "./reactive";
import { buildExplorePrompt, buildPrioritisePrompt, buildExecutePrompt, buildDeadCodePrompt } from "./three-phase";

export { ACTION_TO_SKILL_TYPE } from "./helpers";

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
): string {
  const skill = findSkillForAction(action, skills);
  const skillSection = skill ? formatSkillSection(skill) : "";

  switch (action) {
    case "fix-tests":
      return buildFixTestsPrompt(skillSection);
    case "fix-critique":
      return buildFixCritiquePrompt();
    case "critique":
      return buildCritiquePrompt();
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
    case "explore":
      return buildExplorePrompt(state, skills, article);
  }
}
