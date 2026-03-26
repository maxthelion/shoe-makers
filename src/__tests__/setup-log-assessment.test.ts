import { describe, test, expect, spyOn } from "bun:test";
import { logAssessment } from "../setup";
import type { Assessment } from "../types";
import { makeAssessment as makeSharedAssessment } from "./test-utils";

/** Assessment factory with null defaults (matching setup.test expectations) */
function makeAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return makeSharedAssessment({}, { invariants: null, healthScore: null, ...overrides });
}

function withLogSpy(fn: (logs: () => string[]) => void): void {
  const logSpy = spyOn(console, "log");
  try {
    fn(() => logSpy.mock.calls.map((c: any[]) => c[0]));
  } finally {
    logSpy.mockRestore();
  }
}

describe("logAssessment", () => {
  test("logs pass when tests pass", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ testsPass: true }));
    expect(logs()).toContain("[setup] Tests: pass");
  }));

  test("logs FAIL when tests fail", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ testsPass: false }));
    expect(logs()).toContain("[setup] Tests: FAIL");
  }));

  test("logs typecheck status when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ typecheckPass: true }));
    expect(logs()).toContain("[setup] Typecheck: pass");
  }));

  test("does not log typecheck when undefined", () => withLogSpy((logs) => {
    logAssessment(makeAssessment());
    expect(logs().filter((l: string) => l.includes("Typecheck"))).toHaveLength(0);
  }));

  test("logs FAIL when typecheck fails", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ typecheckPass: false }));
    expect(logs()).toContain("[setup] Typecheck: FAIL");
  }));

  test("logs skipped when typecheck is null (missing type defs)", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ typecheckPass: null }));
    expect(logs()).toContain("[setup] Typecheck: skipped");
  }));

  test("logs health score when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ healthScore: 85 }));
    expect(logs()).toContain("[setup] Health: 85/100");
  }));

  test("logs worst files when health < 100", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      healthScore: 75,
      worstFiles: [
        { path: "src/foo.ts", score: 40 },
        { path: "src/bar.ts", score: 55 },
      ],
    }));
    const worstLine = logs().find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("src/foo.ts (40)");
    expect(worstLine).toContain("src/bar.ts (55)");
  }));

  test("does not log worst files when health is 100", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      healthScore: 100,
      worstFiles: [{ path: "src/foo.ts", score: 90 }],
    }));
    expect(logs().find((l: string) => l.includes("Worst files"))).toBeUndefined();
  }));

  test("limits worst files to top 3", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      healthScore: 50,
      worstFiles: [
        { path: "a.ts", score: 10 },
        { path: "b.ts", score: 20 },
        { path: "c.ts", score: 30 },
        { path: "d.ts", score: 40 },
      ],
    }));
    const worstLine = logs().find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("a.ts (10)");
    expect(worstLine).toContain("c.ts (30)");
    expect(worstLine).not.toContain("d.ts (40)");
  }));

  test("logs invariant counts when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      invariants: {
        specifiedOnly: 3, implementedUntested: 1, implementedTested: 10,
        unspecified: 2, topSpecGaps: [], topUntested: [], topUnspecified: [],
      },
    }));
    const invLine = logs().find((l: string) => l.includes("Invariants"));
    expect(invLine).toContain("3 specified-only");
    expect(invLine).toContain("1 untested");
    expect(invLine).toContain("2 unspecified");
  }));

  test("logs suggestions when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      invariants: {
        specifiedOnly: 5, implementedUntested: 0, implementedTested: 10,
        unspecified: 0, topSpecGaps: [], topUntested: [], topUnspecified: [],
      },
    }));
    const sugLine = logs().find((l: string) => l.includes("Suggestions"));
    expect(sugLine).toContain("5 specified-only invariants need implementation");
  }));

  test("logs uncertainties when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      uncertainties: [
        { field: "typecheckPass", reason: "missing type definitions (bun-types)" },
        { field: "healthScore", reason: "octoclean not installed" },
      ],
    }));
    const uncLine = logs().find((l: string) => l.includes("Uncertainties"));
    expect(uncLine).toContain("typecheckPass (missing type definitions (bun-types))");
    expect(uncLine).toContain("healthScore (octoclean not installed)");
  }));

  test("does not log uncertainties when empty or absent", () => withLogSpy((logs) => {
    logAssessment(makeAssessment());
    expect(logs().find((l: string) => l.includes("Uncertainties"))).toBeUndefined();
  }));
});
