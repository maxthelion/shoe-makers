import { describe, test, expect } from "bun:test";
import { generatePrompt, ACTION_TO_SKILL_TYPE } from "../prompts";
import type { ActionType, WorldState, Assessment } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { loadSkills } from "../skills/registry";
import { emptyBlackboard } from "./test-utils";

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
    insightCount: 0,
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
  "dead-code",
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

  test("fix-critique prompt tells elf to read critique findings", () => {
    const prompt = generatePrompt("fix-critique", makeState());
    expect(prompt).toContain(".shoe-makers/findings/");
    expect(prompt).toContain("critique-");
  });

  test("fix-critique prompt tells elf to mark critiques as resolved", () => {
    const prompt = generatePrompt("fix-critique", makeState());
    expect(prompt).toContain("## Status");
    expect(prompt).toContain("Resolved.");
  });

  test("fix-critique prompt tells elf NOT to delete critique files", () => {
    const prompt = generatePrompt("fix-critique", makeState());
    expect(prompt).toContain("Do NOT delete the critique files");
  });

  test("fix-critique prompt tells elf to run bun test", () => {
    const prompt = generatePrompt("fix-critique", makeState());
    expect(prompt).toContain("bun test");
  });

  test("review prompt tells elf to run git diff", () => {
    const prompt = generatePrompt("review", makeState());
    expect(prompt).toContain("git diff");
  });

  test("review prompt checks correctness, tests, and spec alignment", () => {
    const prompt = generatePrompt("review", makeState());
    expect(prompt).toContain("Correctness");
    expect(prompt).toContain("Tests");
    expect(prompt).toContain("Spec alignment");
  });

  test("review prompt tells elf to commit if good or fix if not", () => {
    const prompt = generatePrompt("review", makeState());
    expect(prompt).toContain("commit them");
    expect(prompt).toContain("fix the issues");
  });

  test("inbox prompt includes message count from state", () => {
    const state = makeState();
    state.inboxCount = 5;
    const prompt = generatePrompt("inbox", state);
    expect(prompt).toContain("5 message(s)");
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

  test("prioritise prompt mentions skill-type metadata", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain("skill-type:");
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

  test("dead-code prompt tells elf to read work-item.md", () => {
    const prompt = generatePrompt("dead-code", makeState());
    expect(prompt).toContain("work-item.md");
  });

  test("dead-code prompt tells elf to verify with grep", () => {
    const prompt = generatePrompt("dead-code", makeState());
    expect(prompt).toContain("grep");
  });

  test("dead-code prompt permits deleting test files", () => {
    const prompt = generatePrompt("dead-code", makeState());
    expect(prompt).toContain("You ARE permitted to delete test files");
  });

  test("dead-code prompt tells elf to run bun test", () => {
    const prompt = generatePrompt("dead-code", makeState());
    expect(prompt).toContain("bun test");
  });

  test("prioritise prompt mentions reviewing insights", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("Promote");
    expect(prompt).toContain("Rework");
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

  test("dead-code prompt includes dead-code skill body when provided", () => {
    const deadCodeSkill = makeSkill({
      name: "dead-code",
      mapsTo: "dead-code",
      body: "## Instructions\n\nFind and remove unused exports.\n\n## Verification criteria\n\n- No import errors",
    });
    const skillsWithDeadCode = makeSkillMap(implementSkill, fixTestsSkill, deadCodeSkill);
    const prompt = generatePrompt("dead-code", makeState(), skillsWithDeadCode);
    expect(prompt).toContain("## Skill: dead-code");
    expect(prompt).toContain("Find and remove unused exports");
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

describe("explore and prioritise tier switching", () => {
  function makeStateWithGaps(specifiedOnly: number, implementedUntested: number): WorldState {
    const baseInv = freshAssessment.invariants!;
    const inv = {
      specifiedOnly,
      implementedUntested,
      implementedTested: baseInv.implementedTested,
      unspecified: baseInv.unspecified,
      topSpecGaps: baseInv.topSpecGaps,
      topUntested: baseInv.topUntested,
      topUnspecified: baseInv.topUnspecified,
    };
    return {
      ...makeState(),
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          invariants: inv,
        },
      },
    };
  }

  test("explore shows Innovation tier when no gaps", () => {
    const state = makeStateWithGaps(0, 0);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("Innovation");
    expect(prompt).toContain("improvement-finding");
  });

  test("explore shows Hygiene/Implementation tier when spec gaps exist", () => {
    const state = makeStateWithGaps(5, 0);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("Hygiene / Implementation");
    expect(prompt).toContain("unimplemented spec claim");
  });

  test("explore Innovation tier says No impactful work remaining is not acceptable", () => {
    const state = makeStateWithGaps(0, 0);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("No impactful work remaining");
    expect(prompt).toContain("NOT an acceptable output");
  });

  test("explore Innovation tier asks if system could be easier for humans", () => {
    const state = makeStateWithGaps(0, 0);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("easier to use");
  });

  test("prioritise shows gap guidance when spec gaps exist", () => {
    const state = makeStateWithGaps(5, 0);
    const prompt = generatePrompt("prioritise", state);
    expect(prompt).toContain("unimplemented spec claim");
  });

  test("prioritise shows innovation guidance when no gaps", () => {
    const state = makeStateWithGaps(0, 0);
    const prompt = generatePrompt("prioritise", state);
    expect(prompt).toContain("highest impact");
  });

  test("prioritise prompt includes insight evaluation with promote/rework/dismiss", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain("Promote");
    expect(prompt).toContain("Rework");
    expect(prompt).toContain("Dismiss");
    expect(prompt).toContain("improves ideas");
  });

  test("prioritise prompt asks evaluator to engage critically with insights", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain("engage with the idea critically");
    expect(prompt).toContain("creative mode");
    expect(prompt).toContain("evaluative mode");
  });

  test("explore uses specifiedOnly count to determine tier", () => {
    const stateWithGaps = makeStateWithGaps(3, 0);
    const promptWithGaps = generatePrompt("explore", stateWithGaps);
    expect(promptWithGaps).toContain("3 unimplemented spec claim");

    const stateNoGaps = makeStateWithGaps(0, 0);
    const promptNoGaps = generatePrompt("explore", stateNoGaps);
    expect(promptNoGaps).not.toContain("unimplemented spec claim");
  });

  test("explore Hygiene tier includes top spec gap descriptions", () => {
    const state = makeStateWithGaps(3, 0);
    const prompt = generatePrompt("explore", state);
    // freshAssessment has topSpecGaps with description "gap"
    expect(prompt).toContain("gap");
    expect(prompt).toContain("Top invariant gaps");
  });

  test("explore Innovation tier includes health score in codebase snapshot", () => {
    const state = makeStateWithGaps(0, 0);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("Codebase snapshot");
    expect(prompt).toContain("Health:");
  });

  test("prioritise includes top spec gap descriptions when gaps exist", () => {
    const state = makeStateWithGaps(3, 0);
    const prompt = generatePrompt("prioritise", state);
    expect(prompt).toContain("Top invariant gaps");
    expect(prompt).toContain("gap");
  });

  test("prioritise does not include gap details when no gaps", () => {
    const state = makeStateWithGaps(0, 0);
    const prompt = generatePrompt("prioritise", state);
    expect(prompt).not.toContain("Top invariant gaps");
  });
});

describe("explore prompt skill catalog", () => {
  test("includes skill catalog when skills are provided", () => {
    const skills = makeSkillMap(
      makeSkill({ name: "implement", mapsTo: "implement", description: "Implement features" }),
      makeSkill({ name: "fix-tests", mapsTo: "fix", description: "Fix failing tests" }),
    );
    const prompt = generatePrompt("explore", makeState(), skills);
    expect(prompt).toContain("Available skills");
    expect(prompt).toContain("implement");
    expect(prompt).toContain("fix-tests");
  });

  test("omits skill catalog when no skills provided", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).not.toContain("Available skills");
  });
});
