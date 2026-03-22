import { describe, test, expect } from "bun:test";
import { summarizeShift, type ShiftSummary } from "../log/shift-summary";
import type { ShiftStep } from "../scheduler/shift";
import type { TickResult } from "../scheduler/tick";

function makeStep(action: string): ShiftStep {
  const tick = { timestamp: new Date().toISOString(), branch: "shoemakers/test", action, skill: action, tickType: action } as TickResult;
  return { tick, skillResult: `${action} done`, error: null };
}

function makeErrorStep(action: string): ShiftStep {
  const tick = { timestamp: new Date().toISOString(), branch: "shoemakers/test", action, skill: action, tickType: action } as TickResult;
  return { tick, skillResult: null, error: "something failed" };
}

describe("summarizeShift", () => {
  test("categorizes actions into improvement categories", () => {
    const steps: ShiftStep[] = [
      makeStep("explore"),
      makeStep("fix-tests"),
      makeStep("implement-spec"),
      makeStep("write-tests"),
      makeStep("document"),
      makeStep("improve-health"),
    ];

    const summary = summarizeShift(steps);

    expect(summary.categories).toContain("fix");
    expect(summary.categories).toContain("feature");
    expect(summary.categories).toContain("test");
    expect(summary.categories).toContain("docs");
    expect(summary.categories).toContain("health");
  });

  test("reports whether improvements span multiple categories", () => {
    const diverse: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("implement-spec"),
      makeStep("write-tests"),
    ];
    expect(summarizeShift(diverse).isBalanced).toBe(true);

    const narrow: ShiftStep[] = [
      makeStep("fix-tests"),
    ];
    expect(summarizeShift(narrow).isBalanced).toBe(false);
  });

  test("counts successful vs failed actions", () => {
    const steps: ShiftStep[] = [
      makeStep("implement-spec"),
      makeErrorStep("write-tests"),
      makeStep("document"),
    ];

    const summary = summarizeShift(steps);
    expect(summary.successCount).toBe(2);
    expect(summary.errorCount).toBe(1);
    expect(summary.totalActions).toBe(3);
  });

  test("excludes explore from category tracking", () => {
    const steps: ShiftStep[] = [
      makeStep("explore"),
      makeStep("explore"),
    ];

    const summary = summarizeShift(steps);
    expect(summary.categories).toHaveLength(0);
    expect(summary.isBalanced).toBe(false);
  });

  test("maps action types to categories correctly", () => {
    // fix-tests and fix-critique → fix
    expect(summarizeShift([makeStep("fix-tests")]).categories).toContain("fix");
    expect(summarizeShift([makeStep("fix-critique")]).categories).toContain("fix");

    // implement-spec and implement-plan → feature
    expect(summarizeShift([makeStep("implement-spec")]).categories).toContain("feature");
    expect(summarizeShift([makeStep("implement-plan")]).categories).toContain("feature");

    // write-tests → test
    expect(summarizeShift([makeStep("write-tests")]).categories).toContain("test");

    // document → docs
    expect(summarizeShift([makeStep("document")]).categories).toContain("docs");

    // improve-health → health
    expect(summarizeShift([makeStep("improve-health")]).categories).toContain("health");

    // critique and review → review
    expect(summarizeShift([makeStep("critique")]).categories).toContain("review");
    expect(summarizeShift([makeStep("review")]).categories).toContain("review");
  });

  test("deduplicates categories", () => {
    const steps: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("fix-critique"),
    ];

    const summary = summarizeShift(steps);
    const fixCount = summary.categories.filter((c) => c === "fix").length;
    expect(fixCount).toBe(1);
  });

  test("handles empty steps", () => {
    const summary = summarizeShift([]);
    expect(summary.categories).toHaveLength(0);
    expect(summary.isBalanced).toBe(false);
    expect(summary.totalActions).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.errorCount).toBe(0);
  });

  test("balanced requires at least 2 distinct categories", () => {
    const oneCategory: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("fix-critique"),
    ];
    expect(summarizeShift(oneCategory).isBalanced).toBe(false);

    const twoCategories: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("implement-spec"),
    ];
    expect(summarizeShift(twoCategories).isBalanced).toBe(true);
  });

  test("produces a human-readable description", () => {
    const steps: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("implement-spec"),
      makeStep("write-tests"),
    ];

    const summary = summarizeShift(steps);
    expect(summary.description).toContain("fix");
    expect(summary.description).toContain("feature");
    expect(summary.description).toContain("test");
  });
});
