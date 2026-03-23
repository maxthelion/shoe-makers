import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { appendToShiftLog, formatTickLog, formatShiftSummary, formatDashboard, prependShiftDashboard } from "../log/shift-log";

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
  test("formats a successful tick", () => {
    const log = formatTickLog({
      branch: "shoemakers/2026-03-21",
      tickType: "assess",
      skill: "assess",
      result: "Assessment complete. Tests: pass.",
      error: null,
    });

    expect(log).toContain("**Branch**: shoemakers/2026-03-21");
    expect(log).toContain("**Decision**: assess");
    expect(log).toContain("**Result**: Assessment complete.");
    expect(log).not.toContain("**Error**");
  });

  test("formats a sleep tick", () => {
    const log = formatTickLog({
      branch: "shoemakers/2026-03-21",
      tickType: null,
      skill: null,
      result: null,
      error: null,
    });

    expect(log).toContain("**Decision**: sleep (nothing to do)");
    expect(log).not.toContain("**Result**");
  });

  test("formats suggestions for next priorities", () => {
    const log = formatTickLog({
      branch: "shoemakers/2026-03-21",
      tickType: "execute-work-item",
      skill: "execute-work-item",
      result: "Implemented init command",
      error: null,
      suggestions: ["Fix the plan detection bug next", "Add more test coverage for invariants"],
    });

    expect(log).toContain("**Suggestions**");
    expect(log).toContain("Fix the plan detection bug next");
    expect(log).toContain("Add more test coverage for invariants");
  });

  test("omits suggestions when empty", () => {
    const log = formatTickLog({
      branch: "shoemakers/2026-03-21",
      tickType: "assess",
      skill: "assess",
      result: "Done",
      error: null,
      suggestions: [],
    });

    expect(log).not.toContain("Suggestions");
  });

  test("omits suggestions when not provided", () => {
    const log = formatTickLog({
      branch: "shoemakers/2026-03-21",
      tickType: "assess",
      skill: "assess",
      result: "Done",
      error: null,
    });

    expect(log).not.toContain("Suggestions");
  });

  test("formats an error tick", () => {
    const log = formatTickLog({
      branch: "shoemakers/2026-03-21",
      tickType: "work",
      skill: "work",
      result: null,
      error: "No priority items to work on.",
    });

    expect(log).toContain("**Decision**: work");
    expect(log).toContain("**Error**: No priority items to work on.");
  });
});

describe("formatShiftSummary", () => {
  test("includes action counts and categories", () => {
    const output = formatShiftSummary({
      categories: ["fix", "feature"],
      isBalanced: true,
      totalActions: 5,
      successCount: 4,
      errorCount: 1,
      description: "Improvements across 2 categories: fix, feature",
    });
    expect(output).toContain("Shift Summary");
    expect(output).toContain("5 (4 success, 1 error)");
    expect(output).toContain("fix, feature");
    expect(output).toContain("balanced");
  });

  test("shows focused when not balanced", () => {
    const output = formatShiftSummary({
      categories: ["review"],
      isBalanced: false,
      totalActions: 3,
      successCount: 3,
      errorCount: 0,
      description: "Improvements across 1 categories: review",
    });
    expect(output).toContain("focused on review");
    expect(output).not.toContain("balanced");
  });

  test("handles empty categories", () => {
    const output = formatShiftSummary({
      categories: [],
      isBalanced: false,
      totalActions: 0,
      successCount: 0,
      errorCount: 0,
      description: "No improvement actions taken",
    });
    expect(output).toContain("none");
    expect(output).toContain("No improvement actions taken");
  });
});

describe("formatDashboard", () => {
  test("includes action counts and balance in blockquote", () => {
    const output = formatDashboard({
      categories: ["fix", "feature"],
      isBalanced: true,
      totalActions: 5,
      successCount: 4,
      errorCount: 1,
      description: "Improvements across 2 categories: fix, feature",
    });
    expect(output).toContain("> **Shift Dashboard**");
    expect(output).toContain("5 actions, 4 success, 1 error");
    expect(output).toContain("Categories: fix, feature");
    expect(output).toContain("Balanced");
    expect(output).toContain("> Improvements across 2 categories");
  });

  test("shows focused when not balanced", () => {
    const output = formatDashboard({
      categories: ["review"],
      isBalanced: false,
      totalActions: 3,
      successCount: 3,
      errorCount: 0,
      description: "Improvements across 1 categories: review",
    });
    expect(output).toContain("Focused on review");
    expect(output).not.toContain("Balanced");
  });

  test("handles zero actions", () => {
    const output = formatDashboard({
      categories: [],
      isBalanced: false,
      totalActions: 0,
      successCount: 0,
      errorCount: 0,
      description: "No improvement actions taken",
    });
    expect(output).toContain("0 actions, 0 success, 0 errors");
    expect(output).toContain("Categories: none");
    expect(output).toContain("> No improvement actions taken");
  });
});

describe("prependShiftDashboard", () => {
  const summary = {
    categories: ["fix" as const, "feature" as const],
    isBalanced: true,
    totalActions: 5,
    successCount: 4,
    errorCount: 1,
    description: "Improvements across 2 categories: fix, feature",
  };

  test("inserts dashboard after header", async () => {
    await appendToShiftLog(tempDir, "First entry.");
    await prependShiftDashboard(tempDir, summary);

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
    await prependShiftDashboard(tempDir, summary);
    await prependShiftDashboard(tempDir, summary);

    const today = new Date().toISOString().slice(0, 10);
    const content = await readFile(
      join(tempDir, ".shoe-makers/log", `${today}.md`),
      "utf-8",
    );

    const matches = content.match(/> \*\*Shift Dashboard\*\*/g);
    expect(matches).toHaveLength(1);
  });

  test("does nothing when no log file exists", async () => {
    // Should not throw
    await prependShiftDashboard(tempDir, summary);
  });
});
