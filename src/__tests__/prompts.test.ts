import { describe, test, expect } from "bun:test";
import { generatePrompt, ACTION_TO_SKILL_TYPE, parseActionTypeFromPrompt } from "../prompts";
import { determineTier, isInnovationTier, findSkillForAction, formatTopGaps, formatCodebaseSnapshot, formatSkillCatalog } from "../prompts/helpers";
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
    hasPartialWork: false,
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

  // Tests for individual builder content are in prompt-builders.test.ts.
  // These test dispatcher-level concerns: actions that need state or aren't directly testable.
  const promptCases: [string, ActionType, string[]][] = [
    ["continue-work prompt tells elf to read partial-work.md", "continue-work", ["partial-work.md"]],
    ["continue-work prompt tells elf to delete partial-work.md when done", "continue-work", ["delete", "partial-work.md"]],
    ["continue-work prompt tells elf to run bun test", "continue-work", ["bun test"]],
    ["explore prompt mentions README accuracy check", "explore", ["README.md", "accurately"]],
    ["explore prompt mentions suggesting new invariants", "explore", ["suggesting a new invariant"]],
    ["prioritise prompt mentions skill-type metadata", "prioritise", ["skill-type:"]],
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
    validationPatterns: [],
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

describe("explore prompt creative lens (dispatcher integration)", () => {
  test("creative lens is only added for explore action, not fix-tests", () => {
    const prompt = generatePrompt("fix-tests", makeState(), undefined, { title: "Test", summary: "A".repeat(100) });
    expect(prompt).not.toContain("## Creative Lens");
  });
});

/** Create an assessment with specific invariant overrides */
function makeAssessment(invariantOverrides: Partial<NonNullable<Assessment["invariants"]>> = {}, extra: Partial<Assessment> = {}): Assessment {
  return {
    ...freshAssessment,
    invariants: { ...freshAssessment.invariants!, ...invariantOverrides },
    ...extra,
  };
}

/** Create a world state with a custom assessment */
function makeStateWithAssessment(assessment: Assessment): WorldState {
  return {
    ...makeState(),
    blackboard: { ...emptyBlackboard(), assessment },
  };
}

// Process temperature tests are in prompt-builders.test.ts (buildExplorePrompt)

describe("explore and prioritise tier switching", () => {
  function makeStateWithGaps(specifiedOnly: number, implementedUntested: number): WorldState {
    return makeStateWithAssessment(makeAssessment({ specifiedOnly, implementedUntested }));
  }

  const tierCases: [string, ActionType, () => WorldState, string[], string[]][] = [
    ["explore shows no-gaps tier when no gaps", "explore", () => makeStateWithGaps(0, 0), ["No major gaps"], []],
    ["explore shows Hygiene/Implementation tier when spec gaps exist", "explore", () => makeStateWithGaps(5, 0), ["Hygiene / Implementation", "unimplemented spec claim"], []],
    ["prioritise shows gap guidance when spec gaps exist", "prioritise", () => makeStateWithGaps(5, 0), ["unimplemented spec claim"], []],
    ["prioritise shows innovation guidance when no gaps", "prioritise", () => makeStateWithGaps(0, 0), ["highest impact"], []],
    ["explore Hygiene tier includes top spec gap descriptions", "explore", () => makeStateWithGaps(3, 0), ["gap", "Top invariant gaps"], []],
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
    ["# Continue Partial Work\n\nText", "continue-work"],
    ["# Review Uncommitted Work\n\nText", "review"],
    ["# Inbox Messages — Act on These First\n\nText", "inbox"],
    ["# Execute Work Item\n\nText", "execute-work-item"],
    ["# Remove Dead Code\n\nText", "dead-code"],
    ["# Prioritise — Pick a Work Item\n\nText", "prioritise"],
    ["# Innovate — Creative Insight from Random Conceptual Collision\n\nText", "innovate"],
    ["# Evaluate Insight — Build on Creative Ideas\n\nText", "evaluate-insight"],
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

  test("round-trip: generatePrompt then parseActionTypeFromPrompt for all actions", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      const parsed = parseActionTypeFromPrompt(prompt);
      expect(parsed).toBe(action);
    }
  });
});

// Critique permission violation tests are in prompt-builders.test.ts (buildCritiquePrompt)

describe("insight lifecycle in prompts (dispatcher integration)", () => {
  test("innovate and evaluate-insight reference the same insight path", () => {
    const innovatePrompt = generatePrompt("innovate", makeState());
    const evaluatePrompt = generatePrompt("evaluate-insight", makeState());
    const insightPath = ".shoe-makers/insights/";
    expect(innovatePrompt).toContain(insightPath);
    expect(evaluatePrompt).toContain(insightPath);
  });
});

// Detailed innovate prompt tests are in prompt-builders.test.ts (buildInnovatePrompt)

// Detailed evaluate-insight tests are in prompt-builders.test.ts (buildEvaluateInsightPrompt)

describe("determineTier", () => {
  test("null assessment returns no gaps", () => {
    const tier = determineTier(null);
    expect(tier).toEqual({ hasGaps: false, specOnlyCount: 0, untestedCount: 0 });
  });

  test("assessment with null invariants returns no gaps", () => {
    const tier = determineTier({ ...freshAssessment, invariants: null });
    expect(tier).toEqual({ hasGaps: false, specOnlyCount: 0, untestedCount: 0 });
  });

  test("specifiedOnly > 0 means hasGaps", () => {
    const tier = determineTier(makeAssessment({ specifiedOnly: 1, implementedUntested: 0 }));
    expect(tier.hasGaps).toBe(true);
    expect(tier.specOnlyCount).toBe(1);
  });

  test("untestedCount=4 does not trigger hasGaps (below threshold)", () => {
    const tier = determineTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 4 }));
    expect(tier.hasGaps).toBe(false);
  });

  test("untestedCount=5 triggers hasGaps (at threshold)", () => {
    const tier = determineTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 5 }));
    expect(tier.hasGaps).toBe(true);
    expect(tier.untestedCount).toBe(5);
  });

  test("both zero means no gaps", () => {
    const tier = determineTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 0 }));
    expect(tier.hasGaps).toBe(false);
  });

  test("both non-zero means hasGaps", () => {
    const tier = determineTier(makeAssessment({ specifiedOnly: 3, implementedUntested: 10 }));
    expect(tier.hasGaps).toBe(true);
    expect(tier.specOnlyCount).toBe(3);
    expect(tier.untestedCount).toBe(10);
  });
});

describe("isInnovationTier", () => {
  test("null assessment returns false", () => {
    expect(isInnovationTier(null)).toBe(false);
  });

  test("assessment with gaps returns false", () => {
    expect(isInnovationTier(makeAssessment({ specifiedOnly: 3, implementedUntested: 0 }))).toBe(false);
  });

  test("assessment with no gaps returns true", () => {
    expect(isInnovationTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 0 }))).toBe(true);
  });
});

describe("findSkillForAction", () => {
  const skills = makeSkillMap(
    makeSkill({ name: "implement", mapsTo: "implement" }),
    makeSkill({ name: "fix-tests", mapsTo: "fix" }),
  );

  test("returns undefined when skills map is undefined", () => {
    expect(findSkillForAction("fix-tests", undefined)).toBeUndefined();
  });

  test("returns undefined when skills map is empty", () => {
    expect(findSkillForAction("fix-tests", new Map())).toBeUndefined();
  });

  test("returns undefined for action with no skill mapping", () => {
    expect(findSkillForAction("critique", skills)).toBeUndefined();
  });

  test("finds skill for fix-tests action", () => {
    const skill = findSkillForAction("fix-tests", skills);
    expect(skill).toBeDefined();
    expect(skill!.name).toBe("fix-tests");
  });

  test("finds skill for execute-work-item action", () => {
    const skill = findSkillForAction("execute-work-item", skills);
    expect(skill).toBeDefined();
    expect(skill!.name).toBe("implement");
  });

  test("returns undefined when mapped skill type not in map", () => {
    const partialSkills = makeSkillMap(makeSkill({ name: "implement", mapsTo: "implement" }));
    expect(findSkillForAction("fix-tests", partialSkills)).toBeUndefined();
  });
});

describe("formatTopGaps", () => {
  test("returns empty string for null assessment", () => {
    expect(formatTopGaps(null)).toBe("");
  });

  test("returns empty string when no gaps", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      invariants: { ...freshAssessment.invariants!, topSpecGaps: [] },
    };
    expect(formatTopGaps(assessment)).toBe("");
  });

  test("formats gaps as bullet list", () => {
    const result = formatTopGaps(freshAssessment);
    expect(result).toContain("Top invariant gaps");
    expect(result).toContain("- gap (core)");
  });
});

describe("formatCodebaseSnapshot", () => {
  test("returns empty string for null assessment", () => {
    expect(formatCodebaseSnapshot(null)).toBe("");
  });

  test("includes health score", () => {
    const result = formatCodebaseSnapshot(freshAssessment);
    expect(result).toContain("Health: 40/100");
  });

  test("shows 'none' for no worst files", () => {
    const result = formatCodebaseSnapshot(freshAssessment);
    expect(result).toContain("Worst files: none");
  });

  test("shows worst files when present", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      worstFiles: [{ path: "src/foo.ts", score: 30 }],
    };
    const result = formatCodebaseSnapshot(assessment);
    expect(result).toContain("src/foo.ts (30)");
  });
});

describe("formatSkillCatalog", () => {
  test("returns empty string when no skills", () => {
    expect(formatSkillCatalog(undefined)).toBe("");
    expect(formatSkillCatalog(new Map())).toBe("");
  });

  test("formats skills as bullet list", () => {
    const skills = makeSkillMap(
      makeSkill({ name: "implement", mapsTo: "implement", description: "Build features" }),
    );
    const result = formatSkillCatalog(skills);
    expect(result).toContain("Available skills");
    expect(result).toContain("**implement** (implement): Build features");
  });
});

describe("generatePrompt exhaustiveness", () => {
  test("returns non-empty prompt with heading for all action types", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain("#");
    }
  });
});

describe("isInnovationTier boundary", () => {
  test("4 untested claims allows innovation tier", () => {
    expect(isInnovationTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 4 }))).toBe(true);
  });

  test("5 untested claims blocks innovation tier", () => {
    expect(isInnovationTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 5 }))).toBe(false);
  });

  test("0 untested and 0 spec-only allows innovation tier", () => {
    expect(isInnovationTier(makeAssessment({ specifiedOnly: 0, implementedUntested: 0 }))).toBe(true);
  });

  test("null assessment does not allow innovation tier", () => {
    expect(isInnovationTier(null)).toBe(false);
  });
});
