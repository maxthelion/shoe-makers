import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { defaultTree } from "../tree/default-tree";
import { evaluate } from "../tree/evaluate";
import { makeState, freshAssessment, emptyBlackboard } from "./test-utils";

describe("default tree structure", () => {
  test("root is a selector", () => {
    expect(defaultTree.type).toBe("selector");
    expect(defaultTree.name).toBe("root");
  });

  test("has exactly 14 children", () => {
    expect(defaultTree.children).toHaveLength(14);
  });

  test("each child is a sequence with condition + action", () => {
    for (const child of defaultTree.children!) {
      expect(child.type).toBe("sequence");
      expect(child.children).toHaveLength(2);
      expect(child.children![0].type).toBe("condition");
      expect(child.children![1].type).toBe("action");
    }
  });

  const expectedOrder = [
    // Reactive zone (positions 0-7)
    "tests-failing",
    "review-loop-with-candidates",
    "review-loop-breaker",
    "unresolved-critiques",
    "partial-work",
    "unreviewed-commits",
    "unverified-work",
    "inbox-messages",
    // Three-phase orchestration (positions 8-13)
    "dead-code-work",
    "work-item",
    "candidates",
    "insights",
    "innovation-tier",
    "explore",
  ];

  test("children are in correct priority order", () => {
    const names = defaultTree.children!.map((c) => c.name);
    expect(names).toEqual(expectedOrder);
  });

  test("reactive zone comes before proactive zone", () => {
    const reactiveNames = defaultTree.children!.slice(0, 8).map((c) => c.name);
    const proactiveNames = defaultTree.children!.slice(8).map((c) => c.name);
    expect(reactiveNames).toEqual([
      "tests-failing",
      "review-loop-with-candidates",
      "review-loop-breaker",
      "unresolved-critiques",
      "partial-work",
      "unreviewed-commits",
      "unverified-work",
      "inbox-messages",
    ]);
    expect(proactiveNames).toEqual([
      "dead-code-work",
      "work-item",
      "candidates",
      "insights",
      "innovation-tier",
      "explore",
    ]);
  });

  test("each action node has a skill name", () => {
    for (const child of defaultTree.children!) {
      const actionNode = child.children![1];
      expect(actionNode.skill).toBeTruthy();
    }
  });

  test("explore is the last child (fallback)", () => {
    const lastChild = defaultTree.children![defaultTree.children!.length - 1];
    expect(lastChild.name).toBe("explore");
  });

  test("JSDoc comment lists the correct number of tree entries", () => {
    const source = readFileSync(
      join(__dirname, "../tree/default-tree.ts"),
      "utf-8"
    );
    const jsdocMatch = source.match(/\/\*\*[\s\S]*?\*\//);
    expect(jsdocMatch).not.toBeNull();
    const jsdoc = jsdocMatch![0];

    // Count lines with tree branch markers (├── or └──)
    const treeLines = jsdoc.split("\n").filter(
      (line) => line.includes("├──") || line.includes("└──")
    );
    expect(treeLines.length).toBe(defaultTree.children!.length);
  });
});

describe("review-loop circuit breaker", () => {
  test("routes to explore when review loop count >= 3 and no candidates", () => {
    const state = makeState({
      unresolvedCritiqueCount: 2,
      hasCandidates: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.8, reviewLoopCount: 3, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("explore");
  });

  test("routes to prioritise when review loop count >= 3 and candidates exist", () => {
    const state = makeState({
      unresolvedCritiqueCount: 2,
      hasCandidates: true,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.8, reviewLoopCount: 3, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("prioritise");
  });

  test("routes to fix-critique when review loop count < 3 and critiques exist", () => {
    const state = makeState({
      unresolvedCritiqueCount: 2,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.5, reviewLoopCount: 2, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("fix-critique");
  });

  test("does not fire when review loop count >= 3 but no critiques or unreviewed commits", () => {
    const state = makeState({
      unresolvedCritiqueCount: 0,
      hasUnreviewedCommits: false,
      hasCandidates: true,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.8, reviewLoopCount: 5, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("prioritise");
  });

  test("fires when review loop count >= 3 and unreviewed commits exist but no proactive work queued", () => {
    const state = makeState({
      unresolvedCritiqueCount: 0,
      hasUnreviewedCommits: true,
      hasCandidates: false,
      hasWorkItem: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.8, reviewLoopCount: 3, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("explore");
  });

  test("does not fire when candidates exist even with unreviewed commits and high loop count", () => {
    const state = makeState({
      unresolvedCritiqueCount: 0,
      hasUnreviewedCommits: true,
      hasCandidates: true,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.8, reviewLoopCount: 5, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("prioritise");
  });

  test("respects custom review loop threshold from config", () => {
    // With threshold=5, a loop count of 3 should NOT trigger the breaker
    const state = makeState({
      unresolvedCritiqueCount: 2,
      config: {
        branchPrefix: "shoemakers", tickInterval: 5, wikiDir: "wiki",
        assessmentStaleAfter: 30, maxTicksPerShift: 10, enabledSkills: null,
        insightFrequency: 0.3, maxInnovationCycles: 3,
        healthRegressionThreshold: 2, reviewLoopThreshold: 5,
        wikipediaTimeout: 10_000, octocleanTimeout: 120_000,
      },
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0.8, reviewLoopCount: 3, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    // Should route to fix-critique since loop count (3) < threshold (5)
    expect(result.skill).toBe("fix-critique");
  });

  test("tests-failing still takes priority over circuit breaker", () => {
    const state = makeState({
      unresolvedCritiqueCount: 2,
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          testsPass: false,
          processPatterns: { reactiveRatio: 0.9, reviewLoopCount: 5, innovationCycleCount: 0 },
        },
      },
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("fix-tests");
  });
});

describe("partial-work resumption", () => {
  test("routes to continue-work when hasPartialWork is true", () => {
    const state = makeState({ hasPartialWork: true });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("continue-work");
  });

  test("partial-work fires before unreviewed-commits", () => {
    const state = makeState({
      hasPartialWork: true,
      hasUnreviewedCommits: true,
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("continue-work");
  });

  test("unresolved critiques take priority over partial-work", () => {
    const state = makeState({
      hasPartialWork: true,
      unresolvedCritiqueCount: 1,
    });
    const result = evaluate(defaultTree, state);
    expect(result.skill).toBe("fix-critique");
  });

  test("does not route to continue-work when hasPartialWork is false", () => {
    const state = makeState({ hasPartialWork: false });
    const result = evaluate(defaultTree, state);
    expect(result.skill).not.toBe("continue-work");
  });
});
