import { describe, test, expect } from "bun:test";
import { summarizeShift, buildProcessSuggestions, type ShiftSummary, type ProcessPatterns } from "../log/shift-summary";
import type { ShiftStep } from "../scheduler/shift";
import type { TickResult } from "../scheduler/tick";
import type { TraceEntry } from "../tree/evaluate";

function makeStep(action: string, trace: TraceEntry[] = []): ShiftStep {
  const tick = { timestamp: new Date().toISOString(), branch: "shoemakers/test", action, skill: action, trace } as TickResult;
  return { tick, skillResult: `${action} done`, error: null };
}

function makeErrorStep(action: string): ShiftStep {
  const tick = { timestamp: new Date().toISOString(), branch: "shoemakers/test", action, skill: action, trace: [] } as TickResult;
  return { tick, skillResult: null, error: "something failed" };
}

describe("summarizeShift", () => {
  test("categorizes actions into improvement categories", () => {
    const steps: ShiftStep[] = [
      makeStep("explore"),
      makeStep("fix-tests"),
      makeStep("execute-work-item"),
      makeStep("prioritise"),
    ];

    const summary = summarizeShift(steps);

    expect(summary.categories).toContain("fix");
    expect(summary.categories).toContain("feature");
  });

  test("reports whether improvements span multiple categories", () => {
    const diverse: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("execute-work-item"),
      makeStep("critique"),
    ];
    expect(summarizeShift(diverse).isBalanced).toBe(true);

    const narrow: ShiftStep[] = [
      makeStep("fix-tests"),
    ];
    expect(summarizeShift(narrow).isBalanced).toBe(false);
  });

  test("counts successful vs failed actions", () => {
    const steps: ShiftStep[] = [
      makeStep("execute-work-item"),
      makeErrorStep("prioritise"),
      makeStep("critique"),
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

    // execute-work-item and prioritise → feature
    expect(summarizeShift([makeStep("execute-work-item")]).categories).toContain("feature");
    expect(summarizeShift([makeStep("prioritise")]).categories).toContain("feature");

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
      makeStep("execute-work-item"),
    ];
    expect(summarizeShift(twoCategories).isBalanced).toBe(true);
  });

  test("produces a human-readable description", () => {
    const steps: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("execute-work-item"),
      makeStep("critique"),
    ];

    const summary = summarizeShift(steps);
    expect(summary.description).toContain("fix");
    expect(summary.description).toContain("feature");
    expect(summary.description).toContain("review");
  });

  test("returns no traceAnalysis when steps have no traces", () => {
    const steps: ShiftStep[] = [makeStep("fix-tests"), makeStep("explore")];
    const summary = summarizeShift(steps);
    expect(summary.traceAnalysis).toBeUndefined();
  });

  test("classifies shallow traces as reactive", () => {
    const trace: TraceEntry[] = [
      { condition: "tests-failing", passed: true, skill: "fix-tests" },
    ];
    const steps: ShiftStep[] = [makeStep("fix-tests", trace)];
    const summary = summarizeShift(steps);

    expect(summary.traceAnalysis).toBeDefined();
    expect(summary.traceAnalysis!.reactive).toBe(1);
    expect(summary.traceAnalysis!.routine).toBe(0);
    expect(summary.traceAnalysis!.explore).toBe(0);
  });

  test("classifies medium-depth traces as routine", () => {
    const trace: TraceEntry[] = [
      { condition: "tests-failing", passed: false, skill: "fix-tests" },
      { condition: "unresolved-critiques", passed: false, skill: "fix-critique" },
      { condition: "unreviewed-commits", passed: true, skill: "critique" },
    ];
    const steps: ShiftStep[] = [makeStep("critique", trace)];
    const summary = summarizeShift(steps);

    expect(summary.traceAnalysis!.routine).toBe(1);
    expect(summary.traceAnalysis!.reactive).toBe(0);
    expect(summary.traceAnalysis!.explore).toBe(0);
  });

  test("classifies deep traces as explore", () => {
    const trace: TraceEntry[] = [
      { condition: "tests-failing", passed: false, skill: "fix-tests" },
      { condition: "unresolved-critiques", passed: false, skill: "fix-critique" },
      { condition: "unreviewed-commits", passed: false, skill: "critique" },
      { condition: "work-item", passed: false, skill: "execute-work-item" },
      { condition: "candidates", passed: false, skill: "prioritise" },
      { condition: "explore", passed: true, skill: "explore" },
    ];
    const steps: ShiftStep[] = [makeStep("explore", trace)];
    const summary = summarizeShift(steps);

    expect(summary.traceAnalysis!.explore).toBe(1);
    expect(summary.traceAnalysis!.reactive).toBe(0);
    expect(summary.traceAnalysis!.routine).toBe(0);
  });

  test("computes average depth across multiple traces", () => {
    const shallow: TraceEntry[] = [
      { condition: "tests-failing", passed: true, skill: "fix-tests" },
    ];
    const deep: TraceEntry[] = [
      { condition: "tests-failing", passed: false, skill: "fix-tests" },
      { condition: "unresolved-critiques", passed: false, skill: "fix-critique" },
      { condition: "unreviewed-commits", passed: false, skill: "critique" },
      { condition: "work-item", passed: false, skill: "execute-work-item" },
      { condition: "explore", passed: true, skill: "explore" },
    ];
    const steps: ShiftStep[] = [
      makeStep("fix-tests", shallow),
      makeStep("explore", deep),
    ];
    const summary = summarizeShift(steps);

    expect(summary.traceAnalysis!.averageDepth).toBe(3); // (1 + 5) / 2
  });

  test("counts condition fires correctly", () => {
    const trace1: TraceEntry[] = [
      { condition: "tests-failing", passed: true, skill: "fix-tests" },
    ];
    const trace2: TraceEntry[] = [
      { condition: "tests-failing", passed: true, skill: "fix-tests" },
    ];
    const trace3: TraceEntry[] = [
      { condition: "tests-failing", passed: false, skill: "fix-tests" },
      { condition: "unresolved-critiques", passed: true, skill: "fix-critique" },
    ];
    const steps: ShiftStep[] = [
      makeStep("fix-tests", trace1),
      makeStep("fix-tests", trace2),
      makeStep("fix-critique", trace3),
    ];
    const summary = summarizeShift(steps);

    expect(summary.traceAnalysis!.conditionFires["tests-failing"]).toBe(2);
    expect(summary.traceAnalysis!.conditionFires["unresolved-critiques"]).toBe(1);
  });

  test("computes process patterns — tick distribution", () => {
    const steps: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("critique"),
      makeStep("explore"),
      makeStep("execute-work-item"),
    ];
    const summary = summarizeShift(steps);

    expect(summary.processPatterns).toBeDefined();
    expect(summary.processPatterns!.reactiveTicks).toBe(2); // fix-tests, critique
    expect(summary.processPatterns!.proactiveTicks).toBe(2); // explore, execute-work-item
    expect(summary.processPatterns!.reactiveRatio).toBe(0.5);
  });

  test("computes process patterns — all reactive", () => {
    const steps: ShiftStep[] = [
      makeStep("fix-tests"),
      makeStep("critique"),
      makeStep("fix-critique"),
      makeStep("review"),
    ];
    const summary = summarizeShift(steps);

    expect(summary.processPatterns!.reactiveTicks).toBe(4);
    expect(summary.processPatterns!.proactiveTicks).toBe(0);
    expect(summary.processPatterns!.reactiveRatio).toBe(1.0);
  });

  test("detects review loops — 3+ consecutive critique/fix-critique", () => {
    const steps: ShiftStep[] = [
      makeStep("critique"),
      makeStep("fix-critique"),
      makeStep("critique"),
      makeStep("fix-critique"),
    ];
    const summary = summarizeShift(steps);

    expect(summary.processPatterns!.reviewLoopCount).toBe(1);
  });

  test("no review loop for 2 consecutive review actions", () => {
    const steps: ShiftStep[] = [
      makeStep("critique"),
      makeStep("fix-critique"),
      makeStep("explore"),
    ];
    const summary = summarizeShift(steps);

    expect(summary.processPatterns!.reviewLoopCount).toBe(0);
  });

  test("counts innovate and evaluate-insight as proactive", () => {
    const steps: ShiftStep[] = [
      makeStep("innovate"),
      makeStep("evaluate-insight"),
    ];
    const summary = summarizeShift(steps);

    expect(summary.processPatterns!.proactiveTicks).toBe(2);
    expect(summary.processPatterns!.reactiveTicks).toBe(0);
  });

  test("empty steps produce zero process patterns", () => {
    const summary = summarizeShift([]);

    expect(summary.processPatterns).toBeDefined();
    expect(summary.processPatterns!.reactiveTicks).toBe(0);
    expect(summary.processPatterns!.proactiveTicks).toBe(0);
    expect(summary.processPatterns!.reactiveRatio).toBe(0);
    expect(summary.processPatterns!.reviewLoopCount).toBe(0);
  });
});

describe("buildProcessSuggestions", () => {
  test("suggests high reactive ratio when > 70%", () => {
    const patterns: ProcessPatterns = {
      reactiveTicks: 8,
      proactiveTicks: 2,
      reactiveRatio: 0.8,
      reviewLoopCount: 0,
    };
    const suggestions = buildProcessSuggestions(patterns);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0]).toContain("High reactive ratio");
    expect(suggestions[0]).toContain("80%");
  });

  test("no suggestion for moderate reactive ratio", () => {
    const patterns: ProcessPatterns = {
      reactiveTicks: 3,
      proactiveTicks: 7,
      reactiveRatio: 0.3,
      reviewLoopCount: 0,
    };
    expect(buildProcessSuggestions(patterns)).toHaveLength(0);
  });

  test("suggests review loop when detected", () => {
    const patterns: ProcessPatterns = {
      reactiveTicks: 4,
      proactiveTicks: 6,
      reactiveRatio: 0.4,
      reviewLoopCount: 2,
    };
    const suggestions = buildProcessSuggestions(patterns);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0]).toContain("review loop");
  });

  test("no suggestion for too few ticks even if ratio is high", () => {
    const patterns: ProcessPatterns = {
      reactiveTicks: 2,
      proactiveTicks: 0,
      reactiveRatio: 1.0,
      reviewLoopCount: 0,
    };
    expect(buildProcessSuggestions(patterns)).toHaveLength(0);
  });
});
