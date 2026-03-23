import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { appendToShiftLog, formatTickLog, formatShiftSummary, formatDashboard, prependShiftDashboard } from "../log/shift-log";
import type { ImprovementCategory } from "../log/shift-summary";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-log-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("appendToShiftLog", () => {
  test("creates log file with header when it does not exist", async () => {
    await appendToShiftLog(tempDir, "First entry.");

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8"
    );

    expect(content).toContain(`# Shift Log — ${today}`);
    expect(content).toContain("First entry.");
  });

  test("appends to existing log file", async () => {
    await appendToShiftLog(tempDir, "First entry.");
    await appendToShiftLog(tempDir, "Second entry.");

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8"
    );

    expect(content).toContain("First entry.");
    expect(content).toContain("Second entry.");
  });

  test("deduplicates consecutive identical entries", async () => {
    await appendToShiftLog(tempDir, "Same entry.");
    await appendToShiftLog(tempDir, "Same entry.");
    await appendToShiftLog(tempDir, "Same entry.");

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8"
    );

    const matches = content.match(/Same entry\./g);
    expect(matches).toHaveLength(1);
  });

  test("allows different consecutive entries", async () => {
    await appendToShiftLog(tempDir, "Entry A.");
    await appendToShiftLog(tempDir, "Entry B.");
    await appendToShiftLog(tempDir, "Entry A.");

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8"
    );

    const matchesA = content.match(/Entry A\./g);
    const matchesB = content.match(/Entry B\./g);
    expect(matchesA).toHaveLength(2);
    expect(matchesB).toHaveLength(1);
  });

  test("includes UTC timestamp in entry header", async () => {
    await appendToShiftLog(tempDir, "Test entry.");

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8"
    );

    expect(content).toMatch(/## \d{2}:\d{2} UTC — Tick/);
  });
});

describe("formatTickLog", () => {
  const base = { branch: "shoemakers/2026-03-21" as const };

  const tickCases: [string, Parameters<typeof formatTickLog>[0], string[], string[]][] = [
    ["formats a successful tick", { ...base, tickType: "assess", skill: "assess", result: "Assessment complete. Tests: pass.", error: null },
      ["**Branch**: shoemakers/2026-03-21", "**Decision**: assess", "**Result**: Assessment complete."], ["**Error**"]],
    ["formats a sleep tick", { ...base, tickType: null, skill: null, result: null, error: null },
      ["**Decision**: sleep (nothing to do)"], ["**Result**"]],
    ["formats suggestions", { ...base, tickType: "execute-work-item", skill: "execute-work-item", result: "Implemented init command", error: null, suggestions: ["Fix the plan detection bug next", "Add more test coverage for invariants"] },
      ["**Suggestions**", "Fix the plan detection bug next", "Add more test coverage for invariants"], []],
    ["omits suggestions when empty", { ...base, tickType: "assess", skill: "assess", result: "Done", error: null, suggestions: [] },
      [], ["Suggestions"]],
    ["omits suggestions when not provided", { ...base, tickType: "assess", skill: "assess", result: "Done", error: null },
      [], ["Suggestions"]],
    ["formats an error tick", { ...base, tickType: "work", skill: "work", result: null, error: "No priority items to work on." },
      ["**Decision**: work", "**Error**: No priority items to work on."], []],
    ["includes tree trace when provided", { ...base, tickType: "explore", skill: "explore", result: "Done", error: null, trace: "  ✗ tests-failing\n  ✓ explore → explore" },
      ["**Tree trace**", "✗ tests-failing", "✓ explore → explore"], []],
    ["omits tree trace when not provided", { ...base, tickType: "explore", skill: "explore", result: "Done", error: null },
      [], ["Tree trace"]],
  ];

  for (const [label, opts, contains, notContains] of tickCases) {
    test(label, () => {
      const log = formatTickLog(opts);
      for (const s of contains) expect(log).toContain(s);
      for (const s of notContains) expect(log).not.toContain(s);
    });
  }
});

const balancedSummary = {
  categories: ["fix" as const, "feature" as const],
  isBalanced: true, totalActions: 5, successCount: 4, errorCount: 1,
  description: "Improvements across 2 categories: fix, feature",
};
const focusedSummary = {
  categories: ["review" as const],
  isBalanced: false, totalActions: 3, successCount: 3, errorCount: 0,
  description: "Improvements across 1 categories: review",
};
const emptySummary = {
  categories: [] as ImprovementCategory[],
  isBalanced: false, totalActions: 0, successCount: 0, errorCount: 0,
  description: "No improvement actions taken",
};
const summaryWithTraces = {
  ...balancedSummary,
  traceAnalysis: {
    reactive: 2, routine: 6, explore: 2,
    conditionFires: { "tests-failing": 2, "unreviewed-commits": 6 },
    averageDepth: 4.2,
  },
};

describe("formatShiftSummary", () => {
  test("includes action counts and categories", () => {
    const output = formatShiftSummary(balancedSummary);
    expect(output).toContain("Shift Summary");
    expect(output).toContain("5 (4 success, 1 error)");
    expect(output).toContain("fix, feature");
    expect(output).toContain("balanced");
  });

  test("shows focused when not balanced", () => {
    const output = formatShiftSummary(focusedSummary);
    expect(output).toContain("focused on review");
    expect(output).not.toContain("balanced");
  });

  test("handles empty categories", () => {
    const output = formatShiftSummary(emptySummary);
    expect(output).toContain("none");
    expect(output).toContain("No improvement actions taken");
  });

  test("includes tree line when trace analysis is present", () => {
    const output = formatShiftSummary(summaryWithTraces);
    expect(output).toContain("**Tree**: 2 reactive, 6 routine, 2 explore");
    expect(output).toContain("avg depth 4.2");
  });

  test("omits tree line when no trace analysis", () => {
    const output = formatShiftSummary(balancedSummary);
    expect(output).not.toContain("Tree");
  });
});

describe("formatDashboard", () => {
  test("includes action counts and balance in blockquote", () => {
    const output = formatDashboard(balancedSummary);
    expect(output).toContain("> **Shift Dashboard**");
    expect(output).toContain("5 actions, 4 success, 1 error");
    expect(output).toContain("Categories: fix, feature");
    expect(output).toContain("Balanced");
    expect(output).toContain("> Improvements across 2 categories");
  });

  test("shows focused when not balanced", () => {
    const output = formatDashboard(focusedSummary);
    expect(output).toContain("Focused on review");
    expect(output).not.toContain("Balanced");
  });

  test("handles zero actions", () => {
    const output = formatDashboard(emptySummary);
    expect(output).toContain("0 actions, 0 success, 0 errors");
    expect(output).toContain("Categories: none");
    expect(output).toContain("> No improvement actions taken");
  });

  test("includes tree health line when trace analysis is present", () => {
    const output = formatDashboard(summaryWithTraces);
    expect(output).toContain("> Tree: 2 reactive, 6 routine, 2 explore");
    expect(output).toContain("avg depth 4.2");
  });

  test("omits tree health line when no trace analysis", () => {
    const output = formatDashboard(balancedSummary);
    expect(output).not.toContain("Tree:");
  });
});

describe("prependShiftDashboard", () => {
  test("inserts dashboard after header", async () => {
    await appendToShiftLog(tempDir, "First entry.");
    await prependShiftDashboard(tempDir, balancedSummary);

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8",
    );

    const headerEnd = content.indexOf("\n");
    const afterHeader = content.slice(headerEnd + 1, headerEnd + 30);
    expect(afterHeader).toContain("> **Shift Dashboard**");
    expect(content).toContain("First entry.");
  });

  test("is idempotent — calling twice produces one dashboard", async () => {
    await appendToShiftLog(tempDir, "Entry.");
    await prependShiftDashboard(tempDir, balancedSummary);
    await prependShiftDashboard(tempDir, balancedSummary);

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8",
    );

    const matches = content.match(/> \*\*Shift Dashboard\*\*/g);
    expect(matches).toHaveLength(1);
  });

  test("does nothing when no log file exists", async () => {
    await prependShiftDashboard(tempDir, balancedSummary);
  });
});
