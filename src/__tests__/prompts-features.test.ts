import { describe, test, expect } from "bun:test";
import { generatePrompt, parseActionTypeFromPrompt } from "../prompts";
import type { ActionType, WorldState, Assessment } from "../types";
import type { SkillDefinition } from "../skills/registry";
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

describe("explore prompt process temperature", () => {
  function makeStateWithProcessPatterns(reactiveRatio: number, reviewLoopCount: number = 0): WorldState {
    return makeStateWithAssessment(makeAssessment({}, {
      processPatterns: { reactiveRatio, reviewLoopCount, innovationCycleCount: 0 },
    }));
  }

  test("includes high reactive ratio guidance when ratio > 0.6", () => {
    const state = makeStateWithProcessPatterns(0.75);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("high reactive ratio");
    expect(prompt).toContain("75%");
    expect(prompt).toContain("root causes");
  });

  test("includes stability guidance when ratio < 0.3", () => {
    const state = makeStateWithProcessPatterns(0.1);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("stable shift");
    expect(prompt).toContain("10%");
    expect(prompt).toContain("ambitious");
  });

  test("no ratio guidance when ratio is moderate and no loops", () => {
    const state = makeStateWithProcessPatterns(0.45);
    const prompt = generatePrompt("explore", state);
    expect(prompt).not.toContain("high reactive ratio");
    expect(prompt).not.toContain("stable shift");
    expect(prompt).not.toContain("Process signal");
  });

  test("no extra guidance when processPatterns is missing", () => {
    const state = makeState();
    const prompt = generatePrompt("explore", state);
    expect(prompt).not.toContain("Process signal");
  });

  test("includes review loop count in process signal when loops > 0", () => {
    const state = makeStateWithProcessPatterns(0.75, 3);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("Review loops this shift: 3");
  });

  test("includes innovation cycle count when cycles > 0", () => {
    const state = makeStateWithAssessment(makeAssessment({}, {
      processPatterns: { reactiveRatio: 0.1, reviewLoopCount: 0, innovationCycleCount: 2 },
    }));
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("Innovation cycles: 2");
  });

  test("shows process signal section for moderate ratio with review loops", () => {
    const state = makeStateWithProcessPatterns(0.45, 2);
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("Process signal");
    expect(prompt).toContain("Review loops this shift: 2");
  });
});

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

  test("includes validation patterns when passed through generatePrompt", () => {
    const patterns = ["bun test passes", "code follows existing conventions"];
    const prompt = generatePrompt("critique", makeState(), undefined, undefined, undefined, undefined, patterns);
    expect(prompt).toContain("Validation patterns to check");
    expect(prompt).toContain("`bun test passes`");
    expect(prompt).toContain("`code follows existing conventions`");
  });

  test("omits validation patterns for non-critique actions", () => {
    const patterns = ["bun test passes"];
    const prompt = generatePrompt("fix-tests", makeState(), undefined, undefined, undefined, undefined, patterns);
    expect(prompt).not.toContain("Validation patterns");
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

  test("evaluate-insight prompt mentions reading insights from .shoe-makers/insights/", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("innovate and evaluate-insight reference the same insight path", () => {
    const innovatePrompt = generatePrompt("innovate", makeState());
    const evaluatePrompt = generatePrompt("evaluate-insight", makeState());
    const insightPath = ".shoe-makers/insights/";
    expect(innovatePrompt).toContain(insightPath);
    expect(evaluatePrompt).toContain(insightPath);
  });

  test("explore prompt mentions insight file naming format", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain("YYYY-MM-DD");
  });

  test("creative lens is only added for explore action", () => {
    const prompt = generatePrompt("fix-tests", makeState(), undefined, { title: "Test", summary: "A".repeat(100) });
    expect(prompt).not.toContain("## Creative Lens");
  });
});

describe("innovate prompt", () => {
  const article = { title: "Mycelial Networks", summary: "Fungi connect trees underground via root networks." };
  const wikiSummary = "Shoe-makers is a behaviour tree system for autonomous overnight codebase improvement.";
  const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);

  test("includes wiki summary and article", () => {
    expect(prompt).toContain("Mycelial Networks");
    expect(prompt).toContain("Fungi connect trees underground");
    expect(prompt).toContain("behaviour tree system");
  });

  test("mandates writing an insight file", () => {
    expect(prompt).toContain("MUST");
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("YYYY-MM-DD-NNN");
  });

  test("says no connection found is not acceptable", () => {
    expect(prompt).toContain("No connection found");
    expect(prompt).toContain("NOT acceptable");
  });

  test("mentions divergent/creative mode", () => {
    expect(prompt).toContain("divergent/creative mode");
  });

  test("mentions off-limits", () => {
    expect(prompt).toContain("Off-limits");
    expect(prompt).toContain("invariants.md");
  });

  test("requires Wikipedia article as the lens — MUST use the Wikipedia article", () => {
    expect(prompt).toContain("**MUST** use the Wikipedia article");
    expect(prompt).toContain("Do not use general knowledge");
  });

  test("Lens section format says Start with the article title", () => {
    expect(prompt).toContain("Start with the article title");
    expect(prompt).toContain("Mycelial Networks");
  });

  test("Lens section references article.title", () => {
    expect(prompt).toContain("Lens");
    expect(prompt).toContain(article.title);
  });

  test("handles missing article gracefully", () => {
    const noArticlePrompt = generatePrompt("innovate", makeState(), undefined, undefined, undefined, wikiSummary);
    expect(noArticlePrompt).not.toContain("Wikipedia article provided above");
    expect(noArticlePrompt).toContain("No Wikipedia article was available");
    expect(noArticlePrompt).toContain("Pick your own creative lens");
    expect(noArticlePrompt).toContain("MUST");
    expect(noArticlePrompt).toContain(".shoe-makers/insights/");
    expect(noArticlePrompt).toContain("YYYY-MM-DD-NNN");
    expect(noArticlePrompt).toContain("NOT acceptable");
  });
});

describe("evaluate-insight prompt", () => {
  const prompt = generatePrompt("evaluate-insight", makeState());

  test("mentions generous disposition", () => {
    expect(prompt).toContain("generous disposition");
  });

  test("mentions promote, rework, dismiss actions", () => {
    expect(prompt).toContain("Promote");
    expect(prompt).toContain("Rework");
    expect(prompt).toContain("Dismiss");
  });

  test("says it is NOT the prioritise elf", () => {
    expect(prompt).toContain("NOT the prioritise elf");
  });

  test("mentions constructive/convergent mode", () => {
    expect(prompt).toContain("constructive/convergent mode");
  });

  test("mentions reading insights directory", () => {
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("mentions off-limits", () => {
    expect(prompt).toContain("Off-limits");
    expect(prompt).toContain("invariants.md");
  });
});
