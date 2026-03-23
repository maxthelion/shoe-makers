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
    insightCount: 0,
    blackboard: {
      ...emptyBlackboard(),
      assessment: freshAssessment,
    },
    ...overrides,
  };
}

function failingTestsBlackboard(): Blackboard {
  return { ...emptyBlackboard(), assessment: { ...freshAssessment, testsPass: false } };
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
        blackboard: failingTestsBlackboard(),
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
        blackboard: failingTestsBlackboard(),
      })
    );
    expect(result.skill).toBe("fix-tests");
  });
});

describe("game-style behaviour tree — routing", () => {
  const routingCases: [string, Partial<WorldState>, string][] = [
    ["fix-tests when tests failing", { blackboard: failingTestsBlackboard() }, "fix-tests"],
    ["review when uncommitted changes", { hasUncommittedChanges: true }, "review"],
    ["inbox when inbox messages", { inboxCount: 2 }, "inbox"],
    ["execute-work-item when work-item exists", { hasWorkItem: true }, "execute-work-item"],
    ["dead-code when work item has dead-code type", { hasWorkItem: true, workItemSkillType: "dead-code" }, "dead-code"],
    ["execute-work-item when work item has null skill type", { hasWorkItem: true, workItemSkillType: null }, "execute-work-item"],
    ["prioritise when candidates exist", { hasCandidates: true }, "prioritise"],
    ["explore when nothing else matches", {}, "explore"],
    ["explore when no assessment", { blackboard: emptyBlackboard() }, "explore"],
  ];

  for (const [label, overrides, expected] of routingCases) {
    test(`returns ${label}`, () => {
      const result = evaluate(defaultTree, makeState(overrides));
      expect(result.skill).toBe(expected);
    });
  }
});

describe("game-style behaviour tree — priority ordering", () => {
  const priorityCases: [string, Partial<WorldState>, string][] = [
    ["fix-tests over review", { hasUncommittedChanges: true, blackboard: failingTestsBlackboard() }, "fix-tests"],
    ["work-item over candidates", { hasWorkItem: true, hasCandidates: true }, "execute-work-item"],
    ["inbox over work-item", { inboxCount: 1, hasWorkItem: true }, "inbox"],
    ["fix-tests over everything", { hasUncommittedChanges: true, inboxCount: 3, hasWorkItem: true, hasCandidates: true, blackboard: failingTestsBlackboard() }, "fix-tests"],
  ];

  for (const [label, overrides, expected] of priorityCases) {
    test(`${label}`, () => {
      const result = evaluate(defaultTree, makeState(overrides));
      expect(result.skill).toBe(expected);
    });
  }
});
