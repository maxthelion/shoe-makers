import { describe, test, expect } from "bun:test";
import { buildExplorePrompt } from "../prompts/explore";
import type { WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { emptyBlackboard } from "./test-utils";

function makeState(): WorldState {
  return {
    branch: "shoemakers/2026-03-26",
    hasUnreviewedCommits: false,
    hasUncommittedChanges: false,
    unresolvedCritiqueCount: 0,
    hasWorkItem: false,
    hasCandidates: false,
    hasPartialWork: false,
    workItemSkillType: null,
    insightCount: 0,
    inboxCount: 0,
    blackboard: {
      ...emptyBlackboard(),
      assessment: {
        timestamp: new Date().toISOString(),
        invariants: {
          specifiedOnly: 5,
          implementedUntested: 0,
          implementedTested: 50,
          unspecified: 0,
          topSpecGaps: [{ id: "foo", description: "gap", group: "core" }],
          topUntested: [],
          topUnspecified: [],
        },
        healthScore: 95,
        worstFiles: [],
        openPlans: [],
        findings: [],
        testsPass: true,
        recentGitActivity: [],
      },
    },
    config: undefined,
  };
}

function makeSkill(overrides: Partial<SkillDefinition> & { name: string; mapsTo: string }): SkillDefinition {
  return {
    filename: `${overrides.name}.md`,
    description: overrides.description ?? `${overrides.name} skill`,
    body: "",
    prompt: "",
    risk: "low",
    offLimits: [],
    ...overrides,
  };
}

describe("explore prompt structured output", () => {
  test("includes pre-filled candidate slots", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).toContain("## 1. [YOUR TITLE HERE]");
    expect(prompt).toContain("## 2. [YOUR TITLE HERE]");
    expect(prompt).toContain("## 3. [YOUR TITLE HERE]");
  });

  test("includes YOUR REASONING HERE placeholders", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).toContain("[YOUR REASONING HERE");
  });

  test("includes default skill types when no skills provided", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).toContain("implement");
    expect(prompt).toContain("test-coverage");
    expect(prompt).toContain("doc-sync");
  });

  test("includes dynamic skill types from skills map", () => {
    const skills = new Map<string, SkillDefinition>([
      ["impl", makeSkill({ name: "implement", mapsTo: "implement" })],
      ["fix", makeSkill({ name: "fix-tests", mapsTo: "fix" })],
      ["dc", makeSkill({ name: "dead-code", mapsTo: "dead-code" })],
    ]);
    const prompt = buildExplorePrompt(makeState(), skills);
    expect(prompt).toContain("implement | fix | dead-code");
  });

  test("includes Impact field options", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).toContain("high | medium | low");
  });

  test("still includes tier section", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).toContain("Current tier");
  });

  test("still includes creative lens when article provided", () => {
    const article = { title: "Test Concept", summary: "A concept for testing." };
    const prompt = buildExplorePrompt(makeState(), undefined, article);
    expect(prompt).toContain("Creative Lens");
    expect(prompt).toContain("Test Concept");
  });

  test("minimum 3 candidates requirement stated", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).toContain("at least 3 candidates");
  });
});

describe("explore prompt process temperature", () => {
  function makeStateWithRatio(reactiveRatio: number) {
    const state = makeState();
    state.blackboard.assessment!.processPatterns = {
      reactiveRatio,
      reviewLoopCount: 0,
      innovationCycleCount: 0,
    };
    return state;
  }

  test("high reactive ratio (>0.6) includes root cause guidance", () => {
    const prompt = buildExplorePrompt(makeStateWithRatio(0.75));
    expect(prompt).toContain("high reactive ratio");
    expect(prompt).toContain("75%");
    expect(prompt).toContain("root causes");
  });

  test("low reactive ratio (<0.3) includes ambitious guidance", () => {
    const prompt = buildExplorePrompt(makeStateWithRatio(0.1));
    expect(prompt).toContain("stable shift");
    expect(prompt).toContain("10%");
    expect(prompt).toContain("ambitious");
  });

  test("moderate reactive ratio (0.3-0.6) has no process signal", () => {
    const prompt = buildExplorePrompt(makeStateWithRatio(0.45));
    expect(prompt).not.toContain("Process signal");
    expect(prompt).not.toContain("reactive ratio");
    expect(prompt).not.toContain("stable shift");
  });

  test("no processPatterns generates prompt without process signal", () => {
    const prompt = buildExplorePrompt(makeState());
    expect(prompt).not.toContain("Process signal");
  });

  test("null assessment generates prompt without errors", () => {
    const state = makeState();
    state.blackboard.assessment = null;
    const prompt = buildExplorePrompt(state);
    expect(prompt).toContain("Explore");
    expect(prompt).not.toContain("Process signal");
  });
});
