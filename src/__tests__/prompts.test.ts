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

function expectPromptContains(
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
    expectPromptContains("fix-critique", makeState(), [".shoe-makers/findings/", "critique-"]);
  });

  test("fix-critique prompt tells elf to mark critiques as resolved", () => {
    expectPromptContains("fix-critique", makeState(), ["## Status", "Resolved."]);
  });

  test("fix-critique prompt tells elf NOT to delete critique files", () => {
    expectPromptContains("fix-critique", makeState(), ["Do NOT delete the critique files"]);
  });

  test("fix-critique prompt tells elf to run bun test", () => {
    expectPromptContains("fix-critique", makeState(), ["bun test"]);
  });

  test("review prompt tells elf to run git diff", () => {
    expectPromptContains("review", makeState(), ["git diff"]);
  });

  test("review prompt checks correctness, tests, and spec alignment", () => {
    expectPromptContains("review", makeState(), ["Correctness", "Tests", "Spec alignment"]);
  });

  test("review prompt tells elf to commit if good or fix if not", () => {
    expectPromptContains("review", makeState(), ["commit them", "fix the issues"]);
  });

  test("inbox prompt includes message count from state", () => {
    const state = makeState();
    state.inboxCount = 5;
    const prompt = generatePrompt("inbox", state);
    expect(prompt).toContain("5 message(s)");
  });

  test("critique prompt restricts reviewer to findings only", () => {
    expectPromptContains("critique", makeState(), ["only write findings"]);
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
    expectPromptContains("execute-work-item", makeState(), ["work-item.md", "Delete"]);
  });

  test("prioritise prompt tells elf to read candidates and write work-item", () => {
    expectPromptContains("prioritise", makeState(), ["candidates.md", "work-item.md", "Delete"]);
  });

  test("prioritise prompt mentions skill-type metadata", () => {
    expectPromptContains("prioritise", makeState(), ["skill-type:"]);
  });

  test("explore prompt tells elf to write candidates.md", () => {
    expectPromptContains("explore", makeState(), ["candidates.md", "ranked"]);
  });

  test("explore prompt mentions README accuracy check", () => {
    expectPromptContains("explore", makeState(), ["README.md", "accurately"]);
  });

  test("explore prompt mentions writing insights", () => {
    expectPromptContains("explore", makeState(), [".shoe-makers/insights/", "proposals, not problems"]);
  });

  test("explore prompt mentions suggesting new invariants", () => {
    expectPromptContains("explore", makeState(), ["suggesting a new invariant"]);
  });

  test("execute prompt mentions never reverting the wiki", () => {
    expectPromptContains("execute-work-item", makeState(), ["never revert the wiki", "source of truth"]);
  });

  test("dead-code prompt tells elf to read work-item.md", () => {
    expectPromptContains("dead-code", makeState(), ["work-item.md"]);
  });

  test("dead-code prompt tells elf to verify with grep", () => {
    expectPromptContains("dead-code", makeState(), ["grep"]);
  });

  test("dead-code prompt permits deleting test files", () => {
    expectPromptContains("dead-code", makeState(), ["You ARE permitted to delete test files"]);
  });

  test("dead-code prompt tells elf to run bun test", () => {
    expectPromptContains("dead-code", makeState(), ["bun test"]);
  });

  test("prioritise prompt mentions reviewing insights", () => {
    expectPromptContains("prioritise", makeState(), [".shoe-makers/insights/", "Promote", "Rework", "Dismiss"]);
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
    expectPromptContains("fix-tests", makeState(), ["Run bun test, read failures, fix them", "All tests pass"], [], skills);
  });

  test("execute-work-item prompt includes implement skill body", () => {
    expectPromptContains("execute-work-item", makeState(), ["Read the wiki", "Verification criteria"], [], skills);
  });

  test("skill content is in a clearly marked section", () => {
    expectPromptContains("execute-work-item", makeState(), ["## Skill: implement"], [], skills);
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
    expectPromptContains("critique", makeState(), [], ["## Skill:"], skills);
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
    expectPromptContains("explore", makeState(), [], ["## Creative Lens"]);
  });

  test("creative lens is only added for explore action", () => {
    const prompt = generatePrompt("fix-tests", makeState(), undefined, { title: "Test", summary: "A".repeat(100) });
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

  const tierCases: [string, ActionType, () => WorldState, string[], string[]][] = [
    ["explore shows Innovation tier when no gaps", "explore", () => makeStateWithGaps(0, 0), ["Innovation", "improvement-finding"], []],
    ["explore shows Hygiene/Implementation tier when spec gaps exist", "explore", () => makeStateWithGaps(5, 0), ["Hygiene / Implementation", "unimplemented spec claim"], []],
    ["explore Innovation tier says No impactful work remaining is not acceptable", "explore", () => makeStateWithGaps(0, 0), ["No impactful work remaining", "NOT an acceptable output"], []],
    ["explore Innovation tier asks if system could be easier for humans", "explore", () => makeStateWithGaps(0, 0), ["easier to use"], []],
    ["prioritise shows gap guidance when spec gaps exist", "prioritise", () => makeStateWithGaps(5, 0), ["unimplemented spec claim"], []],
    ["prioritise shows innovation guidance when no gaps", "prioritise", () => makeStateWithGaps(0, 0), ["highest impact"], []],
    ["prioritise prompt includes insight evaluation with promote/rework/dismiss", "prioritise", () => makeState(), ["Promote", "Rework", "Dismiss", "improves ideas"], []],
    ["prioritise prompt asks evaluator to engage critically with insights", "prioritise", () => makeState(), ["engage with the idea critically", "creative mode", "evaluative mode"], []],
    ["explore Hygiene tier includes top spec gap descriptions", "explore", () => makeStateWithGaps(3, 0), ["gap", "Top invariant gaps"], []],
    ["explore Innovation tier includes health score in codebase snapshot", "explore", () => makeStateWithGaps(0, 0), ["Codebase snapshot", "Health:"], []],
    ["prioritise includes top spec gap descriptions when gaps exist", "prioritise", () => makeStateWithGaps(3, 0), ["Top invariant gaps", "gap"], []],
    ["prioritise does not include gap details when no gaps", "prioritise", () => makeStateWithGaps(0, 0), [], ["Top invariant gaps"]],
  ];

  for (const [label, action, stateFactory, contains, notContains] of tierCases) {
    test(label, () => {
      expectPromptContains(action, stateFactory(), contains, notContains);
    });
  }

  test("explore uses specifiedOnly count to determine tier", () => {
    const stateWithGaps = makeStateWithGaps(3, 0);
    const promptWithGaps = generatePrompt("explore", stateWithGaps);
    expect(promptWithGaps).toContain("3 unimplemented spec claim");

    const stateNoGaps = makeStateWithGaps(0, 0);
    const promptNoGaps = generatePrompt("explore", stateNoGaps);
    expect(promptNoGaps).not.toContain("unimplemented spec claim");
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
    expectPromptContains("explore", makeState(), [], ["Available skills"]);
  });
});
