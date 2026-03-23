import type { ActionType, WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";

/** Off-limits notice appended to all non-critique prompts */
export const OFF_LIMITS = `

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- \`.shoe-makers/state/\` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)`;

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
