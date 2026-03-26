import { generatePrompt } from "../prompts";
import type { ActionType, WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { makeAssessment, makeStateWith } from "./test-utils";
import { expect } from "bun:test";

export function makeState(): WorldState {
  return makeStateWith(
    { invariants: { specifiedOnly: 2, implementedUntested: 1, unspecified: 1, topSpecGaps: [{ id: "foo", description: "gap", group: "core" }], topUntested: [{ id: "bar", description: "untested", group: "core" }], topUnspecified: [{ id: "baz", description: "unspec", group: "core" }] }, healthScore: 40, openPlans: ["test-plan"] },
    { inboxCount: 2 }
  );
}

export const allActions: ActionType[] = [
  "fix-tests",
  "fix-critique",
  "critique",
  "continue-work",
  "review",
  "inbox",
  "execute-work-item",
  "dead-code",
  "prioritise",
  "innovate",
  "evaluate-insight",
  "explore",
];

export function expectPromptContains(
  action: ActionType,
  state: WorldState,
  contains: string[],
  notContains: string[] = [],
  skills?: Map<string, SkillDefinition>,
): string {
  const prompt = generatePrompt(action, state, skills);
  for (const s of contains) expect(prompt).toContain(s);
  for (const s of notContains) expect(prompt).not.toContain(s);
  return prompt;
}

export function makeSkillMap(...skills: SkillDefinition[]): Map<string, SkillDefinition> {
  const map = new Map<string, SkillDefinition>();
  for (const skill of skills) {
    map.set(skill.name, skill);
  }
  return map;
}

export function makeSkill(overrides: Partial<SkillDefinition> & { name: string; mapsTo: string }): SkillDefinition {
  return {
    description: "Test skill",
    prompt: "## Instructions\n\nDo the thing.",
    risk: "medium",
    filename: "",
    body: "## Instructions\n\nDo the thing.\n\n## Verification criteria\n\n- It works",
    offLimits: ["Do not break things"],
    ...overrides,
  };
}
