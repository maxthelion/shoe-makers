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

  test("has exactly 12 children", () => {
    expect(defaultTree.children).toHaveLength(12);
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
    // Reactive zone (positions 0-5)
    "tests-failing",
    "review-loop-breaker",
    "unresolved-critiques",
    "unreviewed-commits",
    "unverified-work",
    "inbox-messages",
    // Three-phase orchestration (positions 6-11)
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
    const reactiveNames = defaultTree.children!.slice(0, 6).map((c) => c.name);
    const proactiveNames = defaultTree.children!.slice(6).map((c) => c.name);
    expect(reactiveNames).toEqual([
      "tests-failing",
      "review-loop-breaker",
      "unresolved-critiques",
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
  test("routes to explore when review loop count >= 3 and critiques exist", () => {
    const state = makeState({
      unresolvedCritiqueCount: 2,
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
