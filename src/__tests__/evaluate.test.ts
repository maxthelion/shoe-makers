import { describe, test, expect } from "bun:test";
import { evaluate } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";
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

describe("selector and sequence evaluation", () => {
  test("selector tries children in order and returns first success", () => {
    // The root is a selector — it tries each condition-action pair
    // and returns the first one whose condition passes
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    // fix-tests is the first child → should be selected
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
    // The elf reviews changes and decides to commit or revert
    const result = evaluate(
      defaultTree,
      makeState({ hasUncommittedChanges: true })
    );
    expect(result.skill).toBe("review");
    // The elf's review leads to commit (if good) or revert (if bad)
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

  test("critiques take priority over inbox and plans", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        unresolvedCritiqueCount: 1,
        inboxCount: 3,
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            openPlans: ["some-plan"],
          },
        },
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

  test("returns implement-plan when there are open plans", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            openPlans: ["agent-work-execution"],
          },
        },
      })
    );
    expect(result.skill).toBe("implement-plan");
  });

  test("returns implement-spec when there are specified-only invariants", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            invariants: {
              ...freshAssessment.invariants!,
              specifiedOnly: 3,
              topSpecGaps: [
                { id: "foo", description: "missing feature", group: "core" },
              ],
            },
          },
        },
      })
    );
    expect(result.skill).toBe("implement-spec");
  });

  test("returns write-tests when there is untested code", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            invariants: {
              ...freshAssessment.invariants!,
              implementedUntested: 2,
              topUntested: [
                { id: "bar", description: "untested thing", group: "core" },
              ],
            },
          },
        },
      })
    );
    expect(result.skill).toBe("write-tests");
  });

  test("returns document when there is undocumented code", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            invariants: {
              ...freshAssessment.invariants!,
              unspecified: 1,
              topUnspecified: [
                { id: "baz", description: "mystery code", group: "state" },
              ],
            },
          },
        },
      })
    );
    expect(result.skill).toBe("document");
  });

  test("returns improve-health when health is low", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, healthScore: 40, worstFiles: [] },
        },
      })
    );
    expect(result.skill).toBe("improve-health");
  });

  test("returns explore when nothing else matches", () => {
    // All conditions resolved — falls through to explore
    const result = evaluate(defaultTree, makeState());
    expect(result.skill).toBe("explore");
  });

  test("priority order: tests > review > inbox > plans > spec > tests > docs > health > explore", () => {
    // Everything is wrong at once — should return fix-tests (highest priority)
    const result = evaluate(
      defaultTree,
      makeState({
        hasUncommittedChanges: true,
        inboxCount: 3,
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...freshAssessment,
            testsPass: false,
            openPlans: ["some-plan"],
            healthScore: 30,
            worstFiles: [],
            invariants: {
              specifiedOnly: 5,
              implementedUntested: 3,
              implementedTested: 40,
              unspecified: 2,
              topSpecGaps: [],
              topUntested: [],
              topUnspecified: [],
            },
          },
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
    // Without assessment, no conditions match except explore (always true)
    expect(result.skill).toBe("explore");
  });
});
