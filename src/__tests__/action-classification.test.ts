import { describe, test, expect } from "bun:test";
import { REACTIVE_ACTIONS, PROACTIVE_ACTIONS } from "../log/action-classification";
import { defaultTree } from "../tree/default-tree";
import { extractSkills } from "./test-utils";

describe("action-classification drift prevention", () => {
  const treeSkills = extractSkills(defaultTree);
  const classifiedActions = new Set([...REACTIVE_ACTIONS, ...PROACTIVE_ACTIONS]);

  test("REACTIVE + PROACTIVE covers all tree skills", () => {
    for (const skill of treeSkills) {
      expect(classifiedActions.has(skill)).toBe(true);
    }
  });

  test("no classified actions missing from tree", () => {
    for (const action of classifiedActions) {
      expect(treeSkills.has(action)).toBe(true);
    }
  });

  test("REACTIVE and PROACTIVE sets do not overlap", () => {
    for (const action of REACTIVE_ACTIONS) {
      expect(PROACTIVE_ACTIONS.has(action)).toBe(false);
    }
  });

  test("both sets are non-empty", () => {
    expect(REACTIVE_ACTIONS.size).toBeGreaterThan(0);
    expect(PROACTIVE_ACTIONS.size).toBeGreaterThan(0);
  });
});
