import { describe, test, expect } from "bun:test";
import { evaluate } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";
import type { WorldState, Blackboard, Assessment, Config } from "../types";

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
    blackboard: {
      ...emptyBlackboard(),
      assessment: freshAssessment,
    },
    ...overrides,
  };
}

describe("evaluate edge cases", () => {
  test("selector with no successful children returns failure", () => {
    const result = evaluate(
      {
        type: "selector",
        name: "test-selector",
        children: [
          {
            type: "condition",
            name: "always-false",
            condition: { name: "always-false", check: () => false },
          },
        ],
      },
      makeState()
    );
    expect(result.status).toBe("failure");
    expect(result.skill).toBeNull();
  });

  test("sequence with only conditions (no actions) returns success with null skill", () => {
    const result = evaluate(
      {
        type: "sequence",
        name: "test-sequence",
        children: [
          {
            type: "condition",
            name: "always-true",
            condition: { name: "always-true", check: () => true },
          },
        ],
      },
      makeState()
    );
    expect(result.status).toBe("success");
    expect(result.skill).toBeNull();
  });

  test("condition node with missing condition returns failure", () => {
    const result = evaluate(
      { type: "condition", name: "no-condition" },
      makeState()
    );
    expect(result.status).toBe("failure");
    expect(result.skill).toBeNull();
  });

  test("action node with no skill returns success with null skill", () => {
    const result = evaluate(
      { type: "action", name: "no-skill" },
      makeState()
    );
    expect(result.status).toBe("success");
    expect(result.skill).toBeNull();
  });
});

describe("selector and sequence evaluation", () => {
  test("selector tries children in order and returns first success", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.skill).toBe("fix-tests");
    expect(result.status).toBe("success");
  });

  test("selector falls through when condition fails", () => {
    // Tests pass, no uncommitted changes, no inbox → falls through to explore
    const result = evaluate(defaultTree, makeState());
    expect(result.skill).toBe("explore");
  });
});

describe("verification model: commit or revert", () => {
  test("review action handles uncommitted changes for commit or revert decision", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUncommittedChanges: true })
    );
    expect(result.skill).toBe("review");
  });
});

describe("cross-elf gatekeeping", () => {
  test("returns fix-critique when there are unresolved critiques", () => {
    const result = evaluate(
      defaultTree,
      makeState({ unresolvedCritiqueCount: 2 })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("returns critique when there are unreviewed commits", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUnreviewedCommits: true })
    );
    expect(result.skill).toBe("critique");
  });

  test("fix-critique takes priority over critique", () => {
    const result = evaluate(
      defaultTree,
      makeState({ unresolvedCritiqueCount: 1, hasUnreviewedCommits: true })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("critiques take priority over inbox and work-item", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        unresolvedCritiqueCount: 1,
        inboxCount: 3,
        hasWorkItem: true,
      })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("unreviewed commits take priority over inbox", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUnreviewedCommits: true, inboxCount: 2 })
    );
    expect(result.skill).toBe("critique");
  });

  test("fix-tests still takes priority over critiques", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        unresolvedCritiqueCount: 1,
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.skill).toBe("fix-tests");
  });
});

describe("game-style behaviour tree", () => {
  test("returns fix-tests when tests are failing", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.skill).toBe("fix-tests");
  });

  test("returns review when there are uncommitted changes", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUncommittedChanges: true })
    );
    expect(result.skill).toBe("review");
  });

  test("fix-tests takes priority over review", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        hasUncommittedChanges: true,
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.skill).toBe("fix-tests");
  });

  test("returns inbox when there are inbox messages", () => {
    const result = evaluate(defaultTree, makeState({ inboxCount: 2 }));
    expect(result.skill).toBe("inbox");
  });

  test("returns execute-work-item when work-item.md exists", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasWorkItem: true })
    );
    expect(result.skill).toBe("execute-work-item");
  });

  test("returns dead-code when work item has dead-code skill type", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasWorkItem: true, workItemSkillType: "dead-code" })
    );
    expect(result.skill).toBe("dead-code");
  });

  test("returns execute-work-item when work item has non-dead-code skill type", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasWorkItem: true, workItemSkillType: null })
    );
    expect(result.skill).toBe("execute-work-item");
  });

  test("returns prioritise when candidates.md exists", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasCandidates: true })
    );
    expect(result.skill).toBe("prioritise");
  });

  test("work-item takes priority over candidates", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasWorkItem: true, hasCandidates: true })
    );
    expect(result.skill).toBe("execute-work-item");
  });

  test("inbox takes priority over work-item", () => {
    const result = evaluate(
      defaultTree,
      makeState({ inboxCount: 1, hasWorkItem: true })
    );
    expect(result.skill).toBe("inbox");
  });

  test("returns explore when nothing else matches", () => {
    const result = evaluate(defaultTree, makeState());
    expect(result.skill).toBe("explore");
  });

  test("priority order: tests > critiques > reviews > uncommitted > inbox > work-item > candidates > explore", () => {
    // Everything is wrong at once — should return fix-tests (highest priority)
    const result = evaluate(
      defaultTree,
      makeState({
        hasUncommittedChanges: true,
        inboxCount: 3,
        hasWorkItem: true,
        hasCandidates: true,
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.skill).toBe("fix-tests");
  });

  test("no assessment falls through to explore", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: emptyBlackboard(),
      })
    );
    expect(result.skill).toBe("explore");
  });
});
