import type { ActionType, WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";

/** Off-limits notice appended to all non-critique prompts */
export const OFF_LIMITS = `

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- \`.shoe-makers/state/\` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)`;

/**
 * Maps prompt title keywords to ActionType for parsing last-action.md.
 * Used by permission enforcement to determine what role the previous elf had.
 */
const TITLE_TO_ACTION: [RegExp, ActionType][] = [
  [/^#\s*Fix Failing Tests/i, "fix-tests"],
  [/^#\s*Fix Unresolved Critiques/i, "fix-critique"],
  [/^#\s*Adversarial Review/i, "critique"],
  [/^#\s*Review Uncommitted Work/i, "review"],
  [/^#\s*Inbox Messages/i, "inbox"],
  [/^#\s*Execute Work Item/i, "execute-work-item"],
  [/^#\s*Remove Dead Code/i, "dead-code"],
  [/^#\s*Prioritise/i, "prioritise"],
  [/^#\s*Innovate/i, "innovate"],
  [/^#\s*Evaluate Insight/i, "evaluate-insight"],
  [/^#\s*Explore/i, "explore"],
];

/**
 * Parse the ActionType from a prompt's first line (title).
 * Returns null if the title doesn't match any known action.
 */
export function parseActionTypeFromPrompt(promptText: string): ActionType | null {
  const firstLine = promptText.split("\n")[0];
  for (const [pattern, action] of TITLE_TO_ACTION) {
    if (pattern.test(firstLine)) return action;
  }
  return null;
}

/** Maps action types to skill mapsTo values for work actions */
export const ACTION_TO_SKILL_TYPE: Record<ActionType, string | undefined> = {
  "fix-tests": "fix",
  "execute-work-item": "implement",
  "dead-code": "dead-code",
  "fix-critique": undefined,
  "critique": undefined,
  "review": undefined,
  "inbox": undefined,
  "prioritise": undefined,
  "innovate": undefined,
  "evaluate-insight": undefined,
  "explore": undefined,
};

/**
 * Find the skill that matches a given action type.
 */
export function findSkillForAction(
  action: ActionType,
  skills?: Map<string, SkillDefinition>,
): SkillDefinition | undefined {
  if (!skills || skills.size === 0) return undefined;
  const skillType = ACTION_TO_SKILL_TYPE[action];
  if (!skillType) return undefined;
  for (const skill of skills.values()) {
    if (skill.mapsTo === skillType) return skill;
  }
  return undefined;
}

/**
 * Format skill content as a clearly marked section to append to prompts.
 */
export function formatSkillSection(skill: SkillDefinition): string {
  return `\n\n## Skill: ${skill.name}\n\n${skill.body}`;
}

/**
 * Format top spec gaps as a bullet list for prompts.
 */
export function formatTopGaps(assessment: WorldState["blackboard"]["assessment"]): string {
  const gaps = assessment?.invariants?.topSpecGaps ?? [];
  if (gaps.length === 0) return "";
  const items = gaps.slice(0, 5).map(g => `- ${g.description} (${g.group})`).join("\n");
  return `\n\nTop invariant gaps:\n${items}`;
}

/**
 * Format a codebase snapshot for Innovation-tier explore prompts.
 */
export function formatCodebaseSnapshot(assessment: WorldState["blackboard"]["assessment"]): string {
  if (!assessment) return "";
  const health = assessment.healthScore != null ? `${assessment.healthScore}/100` : "unknown";
  const worst = assessment.worstFiles.slice(0, 3).map(f => `${f.path} (${f.score})`).join(", ");
  const findings = assessment.findings.length;
  return `\n\n## Codebase snapshot\n\n- Health: ${health}\n- Worst files: ${worst || "none"}\n- Open findings: ${findings}`;
}

/**
 * Format a compact skill catalog for explore/prioritise prompts.
 */
export function formatSkillCatalog(skills?: Map<string, SkillDefinition>): string {
  if (!skills || skills.size === 0) return "";
  const items = [...skills.values()]
    .map(s => `- **${s.name}** (${s.mapsTo}): ${s.description}`)
    .join("\n");
  return `\n\n## Available skills\n\nWhen writing candidates, reference which skill type applies:\n${items}`;
}

/**
 * Determine whether the codebase is in gap-closing or innovation tier.
 */
export interface TierInfo {
  hasGaps: boolean;
  specOnlyCount: number;
  untestedCount: number;
}

export function determineTier(assessment: WorldState["blackboard"]["assessment"]): TierInfo {
  const inv = assessment?.invariants;
  const untestedCount = inv?.implementedUntested ?? 0;
  const specOnlyCount = inv?.specifiedOnly ?? 0;
  return { hasGaps: specOnlyCount > 0 || untestedCount >= 5, specOnlyCount, untestedCount };
}

/**
 * Check if the codebase is at innovation tier (all invariants met, health good).
 * Used by the behaviour tree to route to `innovate` instead of `explore`.
 * Returns false when no assessment exists — we can't assume innovation tier without data.
 */
export function isInnovationTier(assessment: WorldState["blackboard"]["assessment"]): boolean {
  if (!assessment) return false;
  return !determineTier(assessment).hasGaps;
}
