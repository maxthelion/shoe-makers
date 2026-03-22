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
  "implement-plan",
  "implement-spec",
  "write-tests",
  "document",
  "improve-health",
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
    // The marker is gitignored, so it can't be committed.
    // The reviewer must commit first, THEN update the marker to include
    // the review commit itself. Otherwise the review commit triggers
    // another review cycle.
    const commitStep = prompt.indexOf("Commit your critique");
    const markerStep = prompt.indexOf("Update `.shoe-makers/state/last-reviewed-commit`");
    expect(commitStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(commitStep);
  });

  test("implement-spec prompt enforces TDD", () => {
    const prompt = generatePrompt("implement-spec", makeState());
    expect(prompt).toContain("TDD");
    expect(prompt).toContain("Write Tests First");
    expect(prompt).toContain("Write failing tests first");
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

  const testCoverageSkill = makeSkill({
    name: "test-coverage",
    mapsTo: "test",
    body: "## Instructions\n\nWrite tests for untested code paths.\n\n## Verification criteria\n\n- New tests cover the untested code",
  });

  const healthSkill = makeSkill({
    name: "health",
    mapsTo: "health",
    body: "## Instructions\n\nImprove code health scores.\n\n## Verification criteria\n\n- Health score improves",
  });

  const docSyncSkill = makeSkill({
    name: "doc-sync",
    mapsTo: "doc-sync",
    body: "## Instructions\n\nSync wiki pages with code changes.\n\n## Verification criteria\n\n- Wiki accurately reflects code",
  });

  const skills = makeSkillMap(implementSkill, fixTestsSkill, testCoverageSkill, healthSkill, docSyncSkill);

  test("implement-spec prompt includes implement skill body", () => {
    const prompt = generatePrompt("implement-spec", makeState(), skills);
    expect(prompt).toContain("Read the wiki");
    expect(prompt).toContain("Verification criteria");
    expect(prompt).toContain("Code matches spec");
  });

  test("implement-plan prompt includes implement skill body", () => {
    const prompt = generatePrompt("implement-plan", makeState(), skills);
    expect(prompt).toContain("Read the wiki");
    expect(prompt).toContain("Verification criteria");
  });

  test("fix-tests prompt includes fix-tests skill body", () => {
    const prompt = generatePrompt("fix-tests", makeState(), skills);
    expect(prompt).toContain("Run bun test, read failures, fix them");
    expect(prompt).toContain("All tests pass");
  });

  test("write-tests prompt includes test-coverage skill body", () => {
    const prompt = generatePrompt("write-tests", makeState(), skills);
    expect(prompt).toContain("Write tests for untested code paths");
  });

  test("improve-health prompt includes health skill body", () => {
    const prompt = generatePrompt("improve-health", makeState(), skills);
    expect(prompt).toContain("Improve code health scores");
  });

  test("skill content is in a clearly marked section", () => {
    const prompt = generatePrompt("implement-spec", makeState(), skills);
    expect(prompt).toContain("## Skill: implement");
  });

  test("prompts work without skills parameter (backward compatible)", () => {
    const prompt = generatePrompt("implement-spec", makeState());
    expect(prompt).toContain("TDD");
    expect(prompt).not.toContain("## Skill:");
  });

  test("prompts work with empty skills map", () => {
    const prompt = generatePrompt("implement-spec", makeState(), new Map());
    expect(prompt).toContain("TDD");
    expect(prompt).not.toContain("## Skill:");
  });

  test("document prompt includes doc-sync skill body", () => {
    const prompt = generatePrompt("document", makeState(), skills);
    expect(prompt).toContain("Sync wiki pages with code changes");
    expect(prompt).toContain("Wiki accurately reflects code");
  });

  test("non-work actions ignore skills (critique, review, explore)", () => {
    const prompt = generatePrompt("critique", makeState(), skills);
    expect(prompt).not.toContain("## Skill:");
  });

  test("work action with no matching skill falls back to base prompt", () => {
    // Skills map exists but has no skill matching "implement" type
    const unrelatedSkill = makeSkill({
      name: "unrelated",
      mapsTo: "nonexistent-type",
    });
    const mismatchedSkills = makeSkillMap(unrelatedSkill);
    const prompt = generatePrompt("implement-spec", makeState(), mismatchedSkills);
    expect(prompt).toContain("TDD");
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
