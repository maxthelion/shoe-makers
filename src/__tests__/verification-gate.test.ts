import { describe, test, expect } from "bun:test";
import { WORK_ACTIONS, isWorkAction } from "../scheduler/verification-gate";
import { verify as commitOrRevert } from "../verify/commit-or-revert";
import type { ActionType } from "../types";

describe("verification gate", () => {
  describe("WORK_ACTIONS", () => {
    test("includes all expected work action types", () => {
      expect(WORK_ACTIONS).toContain("execute-work-item");
      expect(WORK_ACTIONS).toContain("fix-tests");
      expect(WORK_ACTIONS).toContain("fix-critique");
      expect(WORK_ACTIONS).toContain("dead-code");
      expect(WORK_ACTIONS).toContain("continue-work");
      expect(WORK_ACTIONS).toContain("inbox");
    });

    test("does not include orchestration actions", () => {
      expect(WORK_ACTIONS).not.toContain("explore");
      expect(WORK_ACTIONS).not.toContain("prioritise");
      expect(WORK_ACTIONS).not.toContain("critique");
      expect(WORK_ACTIONS).not.toContain("review");
      expect(WORK_ACTIONS).not.toContain("innovate");
      expect(WORK_ACTIONS).not.toContain("evaluate-insight");
    });
  });

  describe("isWorkAction", () => {
    test("returns true for work actions", () => {
      expect(isWorkAction("execute-work-item")).toBe(true);
      expect(isWorkAction("fix-tests")).toBe(true);
      expect(isWorkAction("fix-critique")).toBe(true);
      expect(isWorkAction("dead-code")).toBe(true);
      expect(isWorkAction("continue-work")).toBe(true);
      expect(isWorkAction("inbox")).toBe(true);
    });

    test("returns false for orchestration actions", () => {
      expect(isWorkAction("explore")).toBe(false);
      expect(isWorkAction("prioritise")).toBe(false);
      expect(isWorkAction("critique")).toBe(false);
      expect(isWorkAction("review")).toBe(false);
      expect(isWorkAction("innovate")).toBe(false);
      expect(isWorkAction("evaluate-insight")).toBe(false);
    });

    test("returns false for null", () => {
      expect(isWorkAction(null)).toBe(false);
    });
  });

  describe("gate decision integration", () => {
    test("reverts when tests fail", () => {
      const gate = commitOrRevert(false, null);
      expect(gate.decision).toBe("revert");
      expect(gate.reason).toBe("Tests are failing");
    });

    test("reverts when health regresses", () => {
      const gate = commitOrRevert(true, "Health dropped from 95 to 90");
      expect(gate.decision).toBe("revert");
      expect(gate.reason).toBe("Health dropped from 95 to 90");
    });

    test("commits when tests pass and no health regression", () => {
      const gate = commitOrRevert(true, null);
      expect(gate.decision).toBe("commit");
    });

    test("combined: work action + failing tests = should revert", () => {
      const shouldGate = isWorkAction("execute-work-item");
      const gate = commitOrRevert(false, null);
      expect(shouldGate).toBe(true);
      expect(gate.decision).toBe("revert");
    });

    test("combined: orchestration action + failing tests = should not gate", () => {
      const shouldGate = isWorkAction("explore");
      expect(shouldGate).toBe(false);
      // Gate would not be checked at all
    });
  });
});
