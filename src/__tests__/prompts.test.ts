import { describe, test, expect } from "bun:test";
import { generatePrompt, ACTION_TO_SKILL_TYPE } from "../prompts";
import type { ActionType, WorldState, Blackboard, Assessment } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { loadSkills } from "../skills/registry";

function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    priorities: null,
    currentTask: null,
    verification: null,
  };
}

const freshAssessment: Assessment = {
  timestamp: new Date().toISOString(),
  invariants: {
    specifiedOnly: 2,
    implementedUntested: 1,
    implementedTested: 50,
    unspecified: 1,
    topSpecGaps: [{ id: "foo", description: "gap", group: "core" }],
    topUntested: [{ id: "bar", description: "untested", group: "core" }],
    topUnspecified: [{ id: "baz", description: "unspec", group: "core" }],
  },
  healthScore: 40,
  worstFiles: [],
  openPlans: ["test-plan"],
  findings: [],
  testsPass: true,
  recentGitActivity: [],
};

function makeState(): WorldState {
  return {
    branch: "shoemakers/2026-03-21",
    hasUncommittedChanges: false,
    inboxCount: 2,
    hasUnreviewedCommits: false,
    unresolvedCritiqueCount: 0,
    hasWorkItem: false,
    hasCandidates: false,
    workItemSkillType: null,
    blackboard: {
      ...emptyBlackboard(),
      assessment: freshAssessment,
    },
  };
}

const allActions: ActionType[] = [
  "fix-tests",
  "fix-critique",
  "critique",
  "review",
  "inbox",
  "execute-work-item",
  "prioritise",
  "explore",
];

describe("generatePrompt", () => {
  test("all actions mention invariants.md is off-limits", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      expect(prompt).toContain("invariants.md");
      expect(prompt).toContain("Off-limits");
    }
  });

  test("critique prompt restricts reviewer to findings only", () => {
    const prompt = generatePrompt("critique", makeState());
    expect(prompt).toContain("only write findings");
  });

  test("critique prompt tells reviewer to update marker AFTER committing", () => {
    const prompt = generatePrompt("critique", makeState());
    const commitStep = prompt.indexOf("Commit your critique");
    const markerStep = prompt.indexOf("Update `.shoe-makers/state/last-reviewed-commit`");
    expect(commitStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(commitStep);
  });

  test("execute-work-item prompt tells elf to read work-item.md", () => {
    const prompt = generatePrompt("execute-work-item", makeState());
    expect(prompt).toContain("work-item.md");
    expect(prompt).toContain("Delete");
  });

  test("prioritise prompt tells elf to read candidates and write work-item", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain("candidates.md");
    expect(prompt).toContain("work-item.md");
    expect(prompt).toContain("Delete");
  });

  test("explore prompt tells elf to write candidates.md", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain("candidates.md");
    expect(prompt).toContain("ranked");
  });

  test("explore prompt mentions README accuracy check", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain("README.md");
    expect(prompt).toContain("accurately");
  });

  test("explore prompt mentions writing insights", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("proposals, not problems");
  });

  test("explore prompt mentions suggesting new invariants", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain("suggesting a new invariant");
  });

  test("execute prompt mentions never reverting the wiki", () => {
    const prompt = generatePrompt("execute-work-item", makeState());
    expect(prompt).toContain("never revert the wiki");
    expect(prompt).toContain("source of truth");
  });

  test("prioritise prompt mentions reviewing insights", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("Promote");
    expect(prompt).toContain("Defer");
    expect(prompt).toContain("Dismiss");
  });

  test("each action returns a non-empty prompt", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      expect(prompt.length).toBeGreaterThan(50);
    }
  });
});

function makeSkillMap(...skills: SkillDefinition[]): Map<string, SkillDefinition> {
  const map = new Map<string, SkillDefinition>();
  for (const skill of skills) {
    map.set(skill.name, skill);
  }
  return map;
}

function makeSkill(overrides: Partial<SkillDefinition> & { name: string; mapsTo: string }): SkillDefinition {
  return {
    description: "Test skill",
    prompt: "## Instructions\n\nDo the thing.",
    risk: "medium",
    body: "## Instructions\n\nDo the thing.\n\n## Verification criteria\n\n- It works",
    offLimits: ["Do not break things"],
    ...overrides,
  };
}

describe("generatePrompt includes skill content for work actions", () => {
  const implementSkill = makeSkill({
    name: "implement",
    mapsTo: "implement",
    body: "## When to apply\n\nSpec has gaps.\n\n## Instructions\n\n1. Read the wiki\n2. Write code\n3. Write tests\n\n## Verification criteria\n\n- Tests pass\n- Code matches spec",
  });

  const fixTestsSkill = makeSkill({
    name: "fix-tests",
    mapsTo: "fix",
    body: "## Instructions\n\nRun bun test, read failures, fix them.\n\n## Verification criteria\n\n- All tests pass",
  });

  const skills = makeSkillMap(implementSkill, fixTestsSkill);

  test("fix-tests prompt includes fix-tests skill body", () => {
    const prompt = generatePrompt("fix-tests", makeState(), skills);
    expect(prompt).toContain("Run bun test, read failures, fix them");
    expect(prompt).toContain("All tests pass");
  });

  test("execute-work-item prompt includes implement skill body", () => {
    const prompt = generatePrompt("execute-work-item", makeState(), skills);
    expect(prompt).toContain("Read the wiki");
    expect(prompt).toContain("Verification criteria");
  });

  test("skill content is in a clearly marked section", () => {
    const prompt = generatePrompt("execute-work-item", makeState(), skills);
    expect(prompt).toContain("## Skill: implement");
  });

  test("non-work actions ignore skills (critique, review, explore)", () => {
    const prompt = generatePrompt("critique", makeState(), skills);
    expect(prompt).not.toContain("## Skill:");
  });
});

describe("ACTION_TO_SKILL_TYPE matches real skill files", () => {
  test("every mapped skill type has a matching skill file on disk", async () => {
    const skills = await loadSkills(process.cwd());
    const skillMapsToValues = new Set(
      [...skills.values()].map((s) => s.mapsTo)
    );

    for (const [action, skillType] of Object.entries(ACTION_TO_SKILL_TYPE)) {
      expect(skillMapsToValues).toContain(skillType);
    }
  });

  test("work actions produce prompts with real skill content from disk", async () => {
    const skills = await loadSkills(process.cwd());
    const state = makeState();

    for (const [action, skillType] of Object.entries(ACTION_TO_SKILL_TYPE)) {
      const prompt = generatePrompt(action as ActionType, state, skills);
      expect(prompt).toContain("## Skill:");
    }
  });
});

describe("explore prompt creative lens", () => {
  test("includes creative lens section when article provided", () => {
    const article = { title: "Fractal Geometry", summary: "Fractals are self-similar patterns..." };
    const prompt = generatePrompt("explore", makeState(), undefined, article);
    expect(prompt).toContain("## Creative Lens");
    expect(prompt).toContain("Fractal Geometry");
    expect(prompt).toContain("Fractals are self-similar patterns...");
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("does NOT include creative lens when no article provided", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).not.toContain("## Creative Lens");
  });

  test("creative lens is only added for explore action", () => {
    const article = { title: "Test", summary: "A".repeat(100) };
    const prompt = generatePrompt("fix-tests", makeState(), undefined, article);
    expect(prompt).not.toContain("## Creative Lens");
  });
});
