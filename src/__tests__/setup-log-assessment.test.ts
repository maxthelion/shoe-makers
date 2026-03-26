import { describe, test, expect, spyOn } from "bun:test";
import { logAssessment } from "../setup";
import type { Assessment } from "../types";
import { makeAssessment as makeSharedAssessment } from "./test-utils";

function makeAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return makeSharedAssessment({ invariants: null, healthScore: null, ...overrides });
}

describe("logAssessment", () => {
  test("logs pass when tests pass", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ testsPass: true });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Tests: pass");
    logSpy.mockRestore();
  });

  test("logs FAIL when tests fail", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ testsPass: false });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Tests: FAIL");
    logSpy.mockRestore();
  });

  test("logs typecheck status when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ typecheckPass: true });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Typecheck: pass");
    logSpy.mockRestore();
  });

  test("does not log typecheck when undefined", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment();
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const typecheckLogs = logs.filter((l: string) => l.includes("Typecheck"));
    expect(typecheckLogs).toHaveLength(0);
    logSpy.mockRestore();
  });

  test("logs FAIL when typecheck fails", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ typecheckPass: false });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Typecheck: FAIL");
    logSpy.mockRestore();
  });

  test("logs skipped when typecheck is null (missing type defs)", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ typecheckPass: null });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Typecheck: skipped");
    logSpy.mockRestore();
  });

  test("logs health score when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ healthScore: 85 });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Health: 85/100");
    logSpy.mockRestore();
  });

  test("logs worst files when health < 100", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      healthScore: 75,
      worstFiles: [
        { path: "src/foo.ts", score: 40 },
        { path: "src/bar.ts", score: 55 },
      ],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const worstLine = logs.find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("src/foo.ts (40)");
    expect(worstLine).toContain("src/bar.ts (55)");
    logSpy.mockRestore();
  });

  test("does not log worst files when health is 100", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      healthScore: 100,
      worstFiles: [{ path: "src/foo.ts", score: 90 }],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const worstLine = logs.find((l: string) => l.includes("Worst files"));
    expect(worstLine).toBeUndefined();
    logSpy.mockRestore();
  });

  test("limits worst files to top 3", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      healthScore: 50,
      worstFiles: [
        { path: "a.ts", score: 10 },
        { path: "b.ts", score: 20 },
        { path: "c.ts", score: 30 },
        { path: "d.ts", score: 40 },
      ],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const worstLine = logs.find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("a.ts (10)");
    expect(worstLine).toContain("c.ts (30)");
    expect(worstLine).not.toContain("d.ts (40)");
    logSpy.mockRestore();
  });

  test("logs invariant counts when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      invariants: {
        specifiedOnly: 3,
        implementedUntested: 1,
        implementedTested: 10,
        unspecified: 2,
        topSpecGaps: [],
        topUntested: [],
        topUnspecified: [],
      },
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const invLine = logs.find((l: string) => l.includes("Invariants"));
    expect(invLine).toContain("3 specified-only");
    expect(invLine).toContain("1 untested");
    expect(invLine).toContain("2 unspecified");
    logSpy.mockRestore();
  });

  test("logs suggestions when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      invariants: {
        specifiedOnly: 5,
        implementedUntested: 0,
        implementedTested: 10,
        unspecified: 0,
        topSpecGaps: [],
        topUntested: [],
        topUnspecified: [],
      },
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const sugLine = logs.find((l: string) => l.includes("Suggestions"));
    expect(sugLine).toContain("5 specified-only invariants need implementation");
    logSpy.mockRestore();
  });

  test("logs uncertainties when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      uncertainties: [
        { field: "typecheckPass", reason: "missing type definitions (bun-types)" },
        { field: "healthScore", reason: "octoclean not installed" },
      ],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c) => c[0]);
    const uncLine = logs.find((l: string) => l.includes("Uncertainties"));
    expect(uncLine).toContain("typecheckPass (missing type definitions (bun-types))");
    expect(uncLine).toContain("healthScore (octoclean not installed)");
    logSpy.mockRestore();
  });

  test("does not log uncertainties when empty or absent", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment();
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c) => c[0]);
    const uncLine = logs.find((l: string) => l.includes("Uncertainties"));
    expect(uncLine).toBeUndefined();
    logSpy.mockRestore();
  });
});
