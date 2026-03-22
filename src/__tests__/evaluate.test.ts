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

describe("assessment staleness", () => {
  function makeStaleAssessment(minutesAgo: number): Assessment {
    const staleTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    return {
      ...freshAssessment,
      timestamp: staleTime.toISOString(),
    };
  }

  const defaultConfig: Config = {
    branchPrefix: "shoemakers",
    tickInterval: 5,
    wikiDir: "wiki",
    assessmentStaleAfter: 30,
    maxTicksPerShift: 10,
    enabledSkills: null,
  };

  test("stale assessment triggers explore even when other conditions match", () => {
    // Assessment is 45 minutes old, threshold is 30
    // There are open plans, but staleness takes priority
    const result = evaluate(
      defaultTree,
      makeState({
        config: defaultConfig,
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...makeStaleAssessment(45),
            openPlans: ["some-plan"],
          },
        },
      })
    );
    expect(result.skill).toBe("explore");
  });

  test("fresh assessment does not trigger staleness explore", () => {
    // Assessment is 5 minutes old, threshold is 30
    // Open plans should match instead
    const result = evaluate(
      defaultTree,
      makeState({
        config: defaultConfig,
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...makeStaleAssessment(5),
            openPlans: ["some-plan"],
          },
        },
      })
    );
    expect(result.skill).toBe("implement-plan");
  });

  test("fix-tests still takes priority over stale assessment", () => {
    // Tests failing takes priority over everything, even stale assessment
    const result = evaluate(
      defaultTree,
      makeState({
        config: defaultConfig,
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...makeStaleAssessment(60),
            testsPass: false,
          },
        },
      })
    );
    expect(result.skill).toBe("fix-tests");
  });

  test("unresolved critiques take priority over stale assessment", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        config: defaultConfig,
        unresolvedCritiqueCount: 1,
        blackboard: {
          ...emptyBlackboard(),
          assessment: makeStaleAssessment(60),
        },
      })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("stale assessment takes priority over inbox messages", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        config: defaultConfig,
        inboxCount: 3,
        blackboard: {
          ...emptyBlackboard(),
          assessment: makeStaleAssessment(45),
        },
      })
    );
    expect(result.skill).toBe("explore");
  });

  test("without config, no staleness check (backward compatible)", () => {
    // No config → no staleness threshold → falls through normally
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: {
            ...makeStaleAssessment(120),
            openPlans: ["some-plan"],
          },
        },
      })
    );
    expect(result.skill).toBe("implement-plan");
  });

  test("null assessment timestamp treated as stale when config present", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        config: defaultConfig,
        blackboard: emptyBlackboard(),
      })
    );
    // No assessment at all → explore (same as current behavior, but now via staleness)
    expect(result.skill).toBe("explore");
  });
});
