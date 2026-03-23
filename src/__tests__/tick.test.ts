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
    hasWorkItem: false,
    hasCandidates: false,
    workItemSkillType: null,
    insightCount: 0,
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

  test("returns execute-work-item when work-item.md exists", () => {
    const result = tick(makeState({ hasWorkItem: true }));
    expect(result.action).toBe("execute-work-item");
  });

  test("returns prioritise when candidates.md exists", () => {
    const result = tick(makeState({ hasCandidates: true }));
    expect(result.action).toBe("prioritise");
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

  test("returns review when there are uncommitted changes", () => {
    const result = tick(makeState({ hasUncommittedChanges: true }));
    expect(result.action).toBe("review");
    expect(result.skill).toBe("review");
  });

  test("reactive conditions take priority over proactive work", () => {
    // Tests failing AND has candidates → fix-tests wins
    const result = tick(makeState({
      hasCandidates: true,
      blackboard: {
        ...emptyBlackboard(),
        assessment: { ...freshAssessment, testsPass: false },
      },
    }));
    expect(result.action).toBe("fix-tests");
  });

  test("returns fix-tests when typecheck fails", () => {
    const result = tick(
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: true, typecheckPass: false },
        },
      })
    );
    expect(result.action).toBe("fix-tests");
    expect(result.skill).toBe("fix-tests");
  });

  test("returns dead-code when work item is dead-code type", () => {
    const result = tick(makeState({ hasWorkItem: true, workItemSkillType: "dead-code" }));
    expect(result.action).toBe("dead-code");
    expect(result.skill).toBe("dead-code");
  });

  test("dead-code work item takes priority over regular work item routing", () => {
    // Both hasWorkItem is true and workItemSkillType is "dead-code"
    // dead-code condition (line 86) comes before work-item (line 87) in tree
    const result = tick(makeState({ hasWorkItem: true, workItemSkillType: "dead-code" }));
    expect(result.action).toBe("dead-code");
    expect(result.action).not.toBe("execute-work-item");
  });

  test("returns explore when no assessment exists", () => {
    const result = tick(makeState({
      blackboard: {
        ...emptyBlackboard(),
        assessment: null,
      },
    }));
    expect(result.action).toBe("explore");
  });

  test("always includes timestamp and branch", () => {
    const result = tick(makeState());
    expect(result.timestamp).toBeTruthy();
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });
});
