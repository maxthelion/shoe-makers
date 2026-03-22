import { describe, test, expect } from "bun:test";
import { tick } from "../scheduler/tick";
import type { WorldState, Blackboard, Assessment } from "../types";

function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    priorities: null,
    currentTask: null,
    verification: null,
  };
}

const freshAssessment: Assessment = {
  timestamp: new Date().toISOString(),
  invariants: {
    specifiedOnly: 0,
    implementedUntested: 0,
    implementedTested: 50,
    unspecified: 0,
    topSpecGaps: [],
    topUntested: [],
    topUnspecified: [],
  },
  healthScore: 80,
  worstFiles: [],
  openPlans: [],
  findings: [],
  testsPass: true,
  recentGitActivity: [],
};

function makeState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    branch: "shoemakers/2026-03-21",
    hasUncommittedChanges: false,
    inboxCount: 0,
    hasUnreviewedCommits: false,
    unresolvedCritiqueCount: 0,
    blackboard: {
      ...emptyBlackboard(),
      assessment: freshAssessment,
    },
    ...overrides,
  };
}

describe("tick", () => {
  test("returns fix-tests when tests are failing", () => {
    const result = tick(
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.action).toBe("fix-tests");
    expect(result.skill).toBe("fix-tests");
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });

  test("returns inbox when there are messages", () => {
    const result = tick(makeState({ inboxCount: 1 }));
    expect(result.action).toBe("inbox");
  });

  test("returns implement-plan when plans exist", () => {
    const result = tick(
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, openPlans: ["my-plan"] },
        },
      })
    );
    expect(result.action).toBe("implement-plan");
  });

  test("returns implement-spec when spec gaps exist", () => {
    const result = tick(
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            invariants: {
              ...freshAssessment.invariants!,
              specifiedOnly: 2,
            },
          },
        },
      })
    );
    expect(result.action).toBe("implement-spec");
  });

  test("returns fix-critique when there are unresolved critiques", () => {
    const result = tick(makeState({ unresolvedCritiqueCount: 2 }));
    expect(result.action).toBe("fix-critique");
    expect(result.skill).toBe("fix-critique");
  });

  test("returns critique when there are unreviewed commits", () => {
    const result = tick(makeState({ hasUnreviewedCommits: true }));
    expect(result.action).toBe("critique");
    expect(result.skill).toBe("critique");
  });

  test("fix-critique takes priority over critique", () => {
    const result = tick(makeState({
      unresolvedCritiqueCount: 1,
      hasUnreviewedCommits: true,
    }));
    expect(result.action).toBe("fix-critique");
  });

  test("fix-tests takes priority over fix-critique", () => {
    const result = tick(makeState({
      unresolvedCritiqueCount: 1,
      blackboard: {
        ...emptyBlackboard(),
        assessment: { ...freshAssessment, testsPass: false },
      },
    }));
    expect(result.action).toBe("fix-tests");
  });

  test("returns explore when everything is current", () => {
    const result = tick(makeState());
    expect(result.action).toBe("explore");
    expect(result.skill).toBe("explore");
  });

  test("always includes timestamp and branch", () => {
    const result = tick(makeState());
    expect(result.timestamp).toBeTruthy();
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });
});
