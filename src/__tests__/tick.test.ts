import { describe, test, expect } from "bun:test";
import { tick } from "../scheduler/tick";
import type { WorldState, Blackboard } from "../types";

function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    priorities: null,
    currentTask: null,
    verification: null,
  };
}

function makeState(overrides: Partial<Blackboard> = {}): WorldState {
  return {
    branch: "shoemakers/2026-03-21",
    hasUncommittedChanges: false,
    blackboard: { ...emptyBlackboard(), ...overrides },
  };
}

describe("tick", () => {
  test("returns assess when no assessment exists", () => {
    const result = tick(makeState());
    expect(result.skill).toBe("assess");
    expect(result.tickType).toBe("assess");
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });

  test("returns prioritise when assessment is fresh but no priorities", () => {
    const result = tick(
      makeState({
        assessment: {
          timestamp: new Date().toISOString(),
          invariants: null,
          healthScore: null,
          openPlans: [],
          findings: [],
          testsPass: true,
          recentGitActivity: [],
        },
      })
    );
    expect(result.skill).toBe("prioritise");
    expect(result.tickType).toBe("prioritise");
  });

  test("returns work when priorities exist", () => {
    const now = new Date().toISOString();
    const result = tick(
      makeState({
        assessment: {
          timestamp: now,
          invariants: null,
          healthScore: null,
          openPlans: [],
          findings: [],
          testsPass: true,
          recentGitActivity: [],
        },
        priorities: {
          timestamp: now,
          assessedAt: now,
          items: [
            {
              rank: 1,
              type: "implement",
              description: "Build scheduler",
              taskPrompt: "Build the scheduler",
              reasoning: "Next foundational piece",
              impact: "high",
              confidence: "high",
              risk: "low",
            },
          ],
        },
      })
    );
    expect(result.skill).toBe("work");
    expect(result.tickType).toBe("work");
  });

  test("returns verify when task is done but not verified", () => {
    const now = new Date().toISOString();
    const result = tick(
      makeState({
        assessment: {
          timestamp: now,
          invariants: null,
          healthScore: null,
          openPlans: [],
          findings: [],
          testsPass: true,
          recentGitActivity: [],
        },
        priorities: {
          timestamp: now,
          assessedAt: now,
          items: [
            {
              rank: 1,
              type: "implement",
              description: "Build scheduler",
              taskPrompt: "Build the scheduler",
              reasoning: "Next foundational piece",
              impact: "high",
              confidence: "high",
              risk: "low",
            },
          ],
        },
        currentTask: {
          startedAt: now,
          priority: {
            rank: 1,
            type: "implement",
            description: "Build scheduler",
            taskPrompt: "Build the scheduler",
            reasoning: "Next foundational piece",
            impact: "high",
            confidence: "high",
            risk: "low",
          },
          status: "done",
        },
      })
    );
    expect(result.skill).toBe("verify");
    expect(result.tickType).toBe("verify");
  });

  test("returns null when everything is current", () => {
    const now = new Date().toISOString();
    const result = tick(
      makeState({
        assessment: {
          timestamp: now,
          invariants: null,
          healthScore: null,
          openPlans: [],
          findings: [],
          testsPass: true,
          recentGitActivity: [],
        },
        priorities: {
          timestamp: now,
          assessedAt: now,
          items: [],
        },
      })
    );
    expect(result.skill).toBeNull();
    expect(result.tickType).toBeNull();
  });

  test("always includes timestamp and branch", () => {
    const result = tick(makeState());
    expect(result.timestamp).toBeTruthy();
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });
});
