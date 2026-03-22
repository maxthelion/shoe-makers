import { describe, test, expect } from "bun:test";
import { defaultTree } from "../tree/default-tree";

describe("default tree structure", () => {
  test("root is a selector", () => {
    expect(defaultTree.type).toBe("selector");
    expect(defaultTree.name).toBe("root");
  });

  test("has exactly 9 children", () => {
    expect(defaultTree.children).toHaveLength(9);
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
    // Reactive zone (positions 0-4)
    "tests-failing",
    "unresolved-critiques",
    "unreviewed-commits",
    "unverified-work",
    "inbox-messages",
    // Three-phase orchestration (positions 5-8)
    "dead-code-work",
    "work-item",
    "candidates",
    "explore",
  ];

  test("children are in correct priority order", () => {
    const names = defaultTree.children!.map((c) => c.name);
    expect(names).toEqual(expectedOrder);
  });

  test("reactive zone comes before proactive zone", () => {
    const reactiveNames = defaultTree.children!.slice(0, 5).map((c) => c.name);
    const proactiveNames = defaultTree.children!.slice(5).map((c) => c.name);
    expect(reactiveNames).toEqual([
      "tests-failing",
      "unresolved-critiques",
      "unreviewed-commits",
      "unverified-work",
      "inbox-messages",
    ]);
    expect(proactiveNames).toEqual([
      "dead-code-work",
      "work-item",
      "candidates",
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
});
