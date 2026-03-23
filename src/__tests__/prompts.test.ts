import { describe, test, expect } from "bun:test";
import { generatePrompt, ACTION_TO_SKILL_TYPE, parseActionTypeFromPrompt } from "../prompts";
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

  const promptCases: [string, ActionType, string[]][] = [
    ["fix-critique prompt tells elf to read critique findings", "fix-critique", [".shoe-makers/findings/", "critique-"]],
    ["fix-critique prompt tells elf to mark critiques as resolved", "fix-critique", ["## Status", "Resolved."]],
    ["fix-critique prompt tells elf NOT to delete critique files", "fix-critique", ["Do NOT delete the critique files"]],
    ["fix-critique prompt tells elf to run bun test", "fix-critique", ["bun test"]],
    ["review prompt tells elf to run git diff", "review", ["git diff"]],
    ["review prompt checks correctness, tests, and spec alignment", "review", ["Correctness", "Tests", "Spec alignment"]],
    ["review prompt tells elf to commit if good or fix if not", "review", ["commit them", "fix the issues"]],
    ["critique prompt restricts reviewer to findings only", "critique", ["only write findings"]],
    ["execute-work-item prompt tells elf to read work-item.md", "execute-work-item", ["work-item.md", "Delete"]],
    ["prioritise prompt tells elf to read candidates and write work-item", "prioritise", ["candidates.md", "work-item.md", "Delete"]],
    ["prioritise prompt mentions skill-type metadata", "prioritise", ["skill-type:"]],
    ["prioritise prompt mentions reviewing insights", "prioritise", [".shoe-makers/insights/", "Promote", "Rework", "Dismiss"]],
    ["prioritise prompt asks for decision rationale", "prioritise", ["Decision Rationale"]],
    ["explore prompt tells elf to write candidates.md", "explore", ["candidates.md", "ranked"]],
    ["explore prompt mentions README accuracy check", "explore", ["README.md", "accurately"]],
    ["explore prompt mentions writing insights", "explore", [".shoe-makers/insights/", "proposals, not problems"]],
    ["explore prompt mentions suggesting new invariants", "explore", ["suggesting a new invariant"]],
    ["execute prompt mentions never reverting the wiki", "execute-work-item", ["never revert the wiki", "source of truth"]],
    ["dead-code prompt tells elf to read work-item.md", "dead-code", ["work-item.md"]],
    ["dead-code prompt tells elf to verify with grep", "dead-code", ["grep"]],
    ["dead-code prompt permits deleting test files", "dead-code", ["You ARE permitted to delete test files"]],
    ["dead-code prompt tells elf to run bun test", "dead-code", ["bun test"]],
  ];

  for (const [label, action, contains] of promptCases) {
    test(label, () => {
      expectPromptContains(action, makeState(), contains);
    });
  }

  test("inbox prompt includes message count from state", () => {
    const state = makeState();
    state.inboxCount = 5;
    const prompt = generatePrompt("inbox", state);
    expect(prompt).toContain("5 message(s)");
  });

  test("critique prompt tells reviewer to update marker AFTER committing", () => {
    const prompt = generatePrompt("critique", makeState());
    const commitStep = prompt.indexOf("Commit your critique");
    const markerStep = prompt.indexOf("Update `.shoe-makers/state/last-reviewed-commit`");
    expect(commitStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(commitStep);
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
      if (skillType === undefined) continue;
      expect(skillMapsToValues).toContain(skillType);
    }
  });

  test("work actions produce prompts with real skill content from disk", async () => {
    const skills = await loadSkills(process.cwd());
    const state = makeState();

    for (const [action, skillType] of Object.entries(ACTION_TO_SKILL_TYPE)) {
      if (skillType === undefined) continue;
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

describe("parseActionTypeFromPrompt", () => {
  const cases: [string, ActionType][] = [
    ["# Fix Failing Tests\n\nSome prompt text", "fix-tests"],
    ["# Fix Unresolved Critiques\n\nMore text", "fix-critique"],
    ["# Adversarial Review — Critique Previous Elf's Work\n\nText", "critique"],
    ["# Review Uncommitted Work\n\nText", "review"],
    ["# Inbox Messages — Act on These First\n\nText", "inbox"],
    ["# Execute Work Item\n\nText", "execute-work-item"],
    ["# Remove Dead Code\n\nText", "dead-code"],
    ["# Prioritise — Pick a Work Item\n\nText", "prioritise"],
    ["# Explore — Survey and Write Candidates\n\nText", "explore"],
  ];

  for (const [prompt, expected] of cases) {
    test(`parses "${expected}" from prompt title`, () => {
      expect(parseActionTypeFromPrompt(prompt)).toBe(expected);
    });
  }

  test("returns null for unrecognised title", () => {
    expect(parseActionTypeFromPrompt("# Unknown Action\n\nText")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseActionTypeFromPrompt("")).toBeNull();
  });
});

describe("critique prompt permission violations", () => {
  test("includes violation warning when violations are present", () => {
    const violations = ["src/types.ts", "wiki/pages/foo.md"];
    const prompt = generatePrompt("critique", makeState(), undefined, undefined, violations);
    expect(prompt).toContain("PERMISSION VIOLATIONS DETECTED");
    expect(prompt).toContain("`src/types.ts`");
    expect(prompt).toContain("`wiki/pages/foo.md`");
    expect(prompt).toContain("outside their permitted scope");
  });

  test("omits violation warning when no violations", () => {
    const prompt = generatePrompt("critique", makeState(), undefined, undefined, []);
    expect(prompt).not.toContain("PERMISSION VIOLATIONS");
  });

  test("omits violation warning when violations undefined", () => {
    const prompt = generatePrompt("critique", makeState());
    expect(prompt).not.toContain("PERMISSION VIOLATIONS");
  });
});

describe("insight lifecycle in prompts", () => {
  const article = { title: "Mycelial Networks", summary: "Fungi connect trees underground." };

  test("explore prompt includes creative lens when article provided", () => {
    const prompt = generatePrompt("explore", makeState(), undefined, article);
    expect(prompt).toContain("Creative Lens");
    expect(prompt).toContain("Mycelial Networks");
    expect(prompt).toContain("Fungi connect trees underground.");
  });

  test("explore prompt omits creative lens when no article", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).not.toContain("Creative Lens");
  });

  test("explore prompt mentions writing insights to .shoe-makers/insights/", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("prioritise prompt mentions reading insights from .shoe-makers/insights/", () => {
    const prompt = generatePrompt("prioritise", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("explore and prioritise reference the same insight path", () => {
    const explorePrompt = generatePrompt("explore", makeState());
    const prioritisePrompt = generatePrompt("prioritise", makeState());
    const insightPath = ".shoe-makers/insights/";
    expect(explorePrompt).toContain(insightPath);
    expect(prioritisePrompt).toContain(insightPath);
  });

  test("explore prompt mentions insight file naming format", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain("YYYY-MM-DD");
  });
});
