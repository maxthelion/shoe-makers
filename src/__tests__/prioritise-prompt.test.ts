import { describe, test, expect } from "bun:test";
import { buildPrioritisePrompt } from "../prompts/prioritise";
import type { WorldState } from "../types";
import { emptyBlackboard } from "./test-utils";

function makeState(): WorldState {
  return {
    branch: "shoemakers/2026-03-26",
    hasUnreviewedCommits: false,
    hasUncommittedChanges: false,
    unresolvedCritiqueCount: 0,
    hasWorkItem: false,
    hasCandidates: true,
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
          topSpecGaps: [],
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

describe("prioritise prompt structured output", () => {
  test("includes pre-filled work-item template sections", () => {
    const prompt = buildPrioritisePrompt(makeState());
    expect(prompt).toContain("## Wiki Spec");
    expect(prompt).toContain("## Current Code");
    expect(prompt).toContain("## What to Build");
    expect(prompt).toContain("## Patterns to Follow");
    expect(prompt).toContain("## Tests to Write");
    expect(prompt).toContain("## What NOT to Change");
    expect(prompt).toContain("## Decision Rationale");
  });

  test("includes YOUR CONTENT HERE placeholders", () => {
    const prompt = buildPrioritisePrompt(makeState());
    expect(prompt).toContain("[YOUR CONTENT HERE");
  });

  test("includes skill-type line", () => {
    const prompt = buildPrioritisePrompt(makeState());
    expect(prompt).toContain("skill-type:");
  });

  test("includes YOUR TITLE HERE placeholder", () => {
    const prompt = buildPrioritisePrompt(makeState());
    expect(prompt).toContain("[YOUR TITLE HERE]");
  });
});
