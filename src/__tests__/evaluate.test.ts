import { describe, test, expect } from "bun:test";
import { evaluate } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";
import type { WorldState, Blackboard } from "../types";

function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    priorities: null,
    currentTask: null,
    verification: null,
  };
}

function makeState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    branch: "shoemakers/2026-03-21",
    hasUncommittedChanges: false,
    blackboard: emptyBlackboard(),
    ...overrides,
  };
}

const now = new Date().toISOString();
const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000).toISOString();
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

describe("behaviour tree evaluation", () => {
  test("returns assess when no assessment exists", () => {
    const result = evaluate(defaultTree, makeState());
    expect(result.skill).toBe("assess");
  });

  test("returns assess when assessment is stale (>30 min)", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: thirtyOneMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: null,
            recentGitActivity: [],
          },
        },
      })
    );
    expect(result.skill).toBe("assess");
  });

  test("returns prioritise when assessment is newer than priorities", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: fiveMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: null,
            recentGitActivity: [],
          },
          // no priorities yet
        },
      })
    );
    expect(result.skill).toBe("prioritise");
  });

  test("returns prioritise when assessment is newer than existing priorities", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: fiveMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: null,
            recentGitActivity: [],
          },
          priorities: {
            timestamp: thirtyOneMinutesAgo,
            assessedAt: thirtyOneMinutesAgo, // older than assessment
            items: [],
          },
        },
      })
    );
    expect(result.skill).toBe("prioritise");
  });

  test("returns verify when there is completed but unverified work", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: fiveMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: null,
            recentGitActivity: [],
          },
          priorities: {
            timestamp: fiveMinutesAgo,
            assessedAt: fiveMinutesAgo,
            items: [],
          },
          currentTask: {
            startedAt: fiveMinutesAgo,
            priority: {
              rank: 1,
              type: "implement",
              description: "Build the scheduler",
              taskPrompt: "...",
              reasoning: "...",
              impact: "high",
              confidence: "high",
              risk: "low",
            },
            status: "done",
          },
          // no verification yet
        },
      })
    );
    expect(result.skill).toBe("verify");
  });

  test("returns work when there are priority items and no current task", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: fiveMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: null,
            recentGitActivity: [],
          },
          priorities: {
            timestamp: fiveMinutesAgo,
            assessedAt: fiveMinutesAgo,
            items: [
              {
                rank: 1,
                type: "implement",
                description: "Build the scheduler",
                taskPrompt: "...",
                reasoning: "Foundation piece",
                impact: "high",
                confidence: "high",
                risk: "low",
              },
            ],
          },
        },
      })
    );
    expect(result.skill).toBe("work");
  });

  test("returns null when everything is current and nothing to do", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: fiveMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: true,
            recentGitActivity: [],
          },
          priorities: {
            timestamp: fiveMinutesAgo,
            assessedAt: fiveMinutesAgo,
            items: [], // nothing to do
          },
        },
      })
    );
    expect(result.skill).toBeNull();
  });

  test("does not start new work while current task is in progress", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            timestamp: fiveMinutesAgo,
            invariants: null,
            healthScore: null,
            openPlans: [],
            findings: [],
            testsPass: null,
            recentGitActivity: [],
          },
          priorities: {
            timestamp: fiveMinutesAgo,
            assessedAt: fiveMinutesAgo,
            items: [
              {
                rank: 1,
                type: "implement",
                description: "Build the scheduler",
                taskPrompt: "...",
                reasoning: "...",
                impact: "high",
                confidence: "high",
                risk: "low",
              },
            ],
          },
          currentTask: {
            startedAt: fiveMinutesAgo,
            priority: {
              rank: 1,
              type: "implement",
              description: "Build the scheduler",
              taskPrompt: "...",
              reasoning: "...",
              impact: "high",
              confidence: "high",
              risk: "low",
            },
            status: "in-progress",
          },
        },
      })
    );
    expect(result.skill).toBeNull();
  });
});
