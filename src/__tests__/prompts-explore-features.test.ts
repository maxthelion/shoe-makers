import { describe, test, expect } from "bun:test";
import { generatePrompt } from "../prompts";
import type { ActionType, WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { makeState as _makeState, makeAssessment, makeStateWithAssessment } from "./test-utils";

// Local makeState with inboxCount: 2 to match original test expectations
function makeState(): WorldState {
  return _makeState({ inboxCount: 2 });
}

function expectPromptContains(
  action: ActionType, state: WorldState, contains: string[],
  notContains: string[] = [], skills?: Map<string, SkillDefinition>,
): string {
  const prompt = generatePrompt(action, state, skills);
  for (const s of contains) expect(prompt).toContain(s);
  for (const s of notContains) expect(prompt).not.toContain(s);
  return prompt;
}

function makeSkillMap(...skills: SkillDefinition[]): Map<string, SkillDefinition> {
  const map = new Map<string, SkillDefinition>();
  for (const skill of skills) map.set(skill.name, skill);
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
    return makeStateWithAssessment(makeAssessment({
      specifiedOnly,
      implementedUntested,
      topSpecGaps: specifiedOnly > 0 ? [{ id: "foo", description: "gap", group: "core" }] : [],
    }));
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
