import { describe, test, expect } from "bun:test";
import { REACTIVE_ACTIONS, PROACTIVE_ACTIONS } from "../log/action-constants";

describe("action-constants", () => {
  test("REACTIVE_ACTIONS contains expected actions", () => {
    expect(REACTIVE_ACTIONS).toContain("fix-tests");
    expect(REACTIVE_ACTIONS).toContain("fix-critique");
    expect(REACTIVE_ACTIONS).toContain("critique");
    expect(REACTIVE_ACTIONS).toContain("review");
    expect(REACTIVE_ACTIONS).toContain("inbox");
  });

  test("PROACTIVE_ACTIONS contains expected actions", () => {
    expect(PROACTIVE_ACTIONS).toContain("explore");
    expect(PROACTIVE_ACTIONS).toContain("prioritise");
    expect(PROACTIVE_ACTIONS).toContain("execute-work-item");
    expect(PROACTIVE_ACTIONS).toContain("dead-code");
    expect(PROACTIVE_ACTIONS).toContain("innovate");
    expect(PROACTIVE_ACTIONS).toContain("evaluate-insight");
  });

  test("REACTIVE_ACTIONS and PROACTIVE_ACTIONS are disjoint", () => {
    for (const action of REACTIVE_ACTIONS) {
      expect(PROACTIVE_ACTIONS.has(action)).toBe(false);
    }
    for (const action of PROACTIVE_ACTIONS) {
      expect(REACTIVE_ACTIONS.has(action)).toBe(false);
    }
  });
});
