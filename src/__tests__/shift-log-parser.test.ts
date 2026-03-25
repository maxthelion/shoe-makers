import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { parseShiftLogActions, computeProcessPatterns, getShiftProcessPatterns } from "../log/shift-log-parser";
import { generatePrompt } from "../prompts";
import { makeState } from "./test-utils";
import type { ActionType } from "../types";

describe("parseShiftLogActions", () => {
  test("extracts action names from shift log entries", () => {
    const log = `# Shift Log — 2026-03-23

## 00:11 UTC — Tick

## 2026-03-23T00:11:10.683Z — Setup

- Action: Adversarial Review — Critique Previous Elf's Work


## 00:14 UTC — Tick

## 2026-03-23T00:14:27.866Z — Setup

- Action: Fix Unresolved Critiques


## 00:16 UTC — Tick

## 2026-03-23T00:16:54.326Z — Setup

- Action: Explore — Survey and Write Candidates
`;
    const actions = parseShiftLogActions(log);
    expect(actions).toEqual(["critique", "fix-critique", "explore"]);
  });

  test("returns empty array for log with no actions", () => {
    const log = `# Shift Log — 2026-03-23\n`;
    expect(parseShiftLogActions(log)).toEqual([]);
  });

  test("skips unrecognized action titles", () => {
    const log = `- Action: Fix Failing Tests\n- Action: Something Completely Unknown\n- Action: Explore — Survey\n`;
    const actions = parseShiftLogActions(log);
    expect(actions).toEqual(["fix-tests", "explore"]);
  });

  test("handles all action types", () => {
    const log = [
      "- Action: Fix Failing Tests",
      "- Action: Fix Unresolved Critiques",
      "- Action: Adversarial Review — Critique Previous Elf's Work",
      "- Action: Continue Partial Work",
      "- Action: Review Uncommitted Work",
      "- Action: Inbox Messages — Act on These First",
      "- Action: Execute Work Item",
      "- Action: Remove Dead Code",
      "- Action: Prioritise — Pick a Work Item",
      "- Action: Innovate — Creative Insight from Random Conceptual Collision",
      "- Action: Evaluate Insight — Build on Creative Ideas",
      "- Action: Explore — Survey and Write Candidates",
    ].join("\n");

    const actions = parseShiftLogActions(log);
    expect(actions).toEqual([
      "fix-tests", "fix-critique", "critique", "continue-work",
      "review", "inbox", "execute-work-item", "dead-code",
      "prioritise", "innovate", "evaluate-insight", "explore",
    ]);
  });
});

describe("computeProcessPatterns", () => {
  test("computes reactive ratio correctly", () => {
    const patterns = computeProcessPatterns(["critique", "fix-critique", "explore", "execute-work-item"]);
    expect(patterns.reactiveRatio).toBe(0.5);
    expect(patterns.reviewLoopCount).toBe(0);
  });

  test("returns 0 ratio for empty actions", () => {
    expect(computeProcessPatterns([]).reactiveRatio).toBe(0);
  });

  test("detects review loops", () => {
    const patterns = computeProcessPatterns(["critique", "fix-critique", "critique", "explore"]);
    expect(patterns.reviewLoopCount).toBe(1);
  });

  test("no review loop for fewer than 3 consecutive review actions", () => {
    const patterns = computeProcessPatterns(["critique", "fix-critique", "explore"]);
    expect(patterns.reviewLoopCount).toBe(0);
  });

  test("respects custom review loop threshold", () => {
    // With threshold=5, 3 consecutive review actions should NOT count as a loop
    const patterns = computeProcessPatterns(["critique", "fix-critique", "critique", "explore"], 5);
    expect(patterns.reviewLoopCount).toBe(0);

    // With threshold=5, 5 consecutive review actions SHOULD count as a loop
    const patterns2 = computeProcessPatterns(["critique", "fix-critique", "critique", "fix-critique", "critique", "explore"], 5);
    expect(patterns2.reviewLoopCount).toBe(1);
  });

  test("fully reactive shift has ratio 1.0", () => {
    const patterns = computeProcessPatterns(["critique", "fix-critique", "critique"]);
    expect(patterns.reactiveRatio).toBe(1.0);
  });

  test("fully proactive shift has ratio 0.0", () => {
    const patterns = computeProcessPatterns(["explore", "prioritise", "execute-work-item"]);
    expect(patterns.reactiveRatio).toBe(0.0);
  });

  test("counts innovation cycles", () => {
    const patterns = computeProcessPatterns(["innovate", "evaluate-insight", "critique", "innovate", "evaluate-insight"]);
    expect(patterns.innovationCycleCount).toBe(2);
  });

  test("returns 0 innovation cycles when none present", () => {
    const patterns = computeProcessPatterns(["explore", "prioritise", "execute-work-item"]);
    expect(patterns.innovationCycleCount).toBe(0);
  });

  test("detects multiple review loops", () => {
    const patterns = computeProcessPatterns([
      "critique", "fix-critique", "critique", // loop 1
      "explore",
      "critique", "fix-critique", "critique", "fix-critique", // loop 2
    ]);
    expect(patterns.reviewLoopCount).toBe(2);
  });

  test("counts review loop at end of actions", () => {
    const patterns = computeProcessPatterns(["explore", "critique", "fix-critique", "critique"]);
    expect(patterns.reviewLoopCount).toBe(1);
  });
});

describe("getShiftProcessPatterns", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shift-log-parser-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  test("returns undefined when no shift log exists", async () => {
    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeUndefined();
  });

  test("returns undefined when shift log has no action entries", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await mkdir(join(tempDir, ".shoe-makers", "log"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "log", `${today}.md`), "# Empty shift log\n");
    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeUndefined();
  });

  test("reads and parses today's shift log", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await mkdir(join(tempDir, ".shoe-makers", "log"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "log", `${today}.md`),
      `- Action: Fix Failing Tests\n- Action: Explore — Survey\n`
    );
    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeDefined();
    expect(result!.reactiveRatio).toBe(0.5);
    expect(result!.innovationCycleCount).toBe(0);
  });

  test("computes patterns from realistic multi-action log", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await mkdir(join(tempDir, ".shoe-makers", "log"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "log", `${today}.md`),
      [
        "- Action: Explore — Survey and Write Candidates",
        "- Action: Adversarial Review — Critique Previous Elf's Work",
        "- Action: Review Uncommitted Work",
        "- Action: Prioritise — Pick a Work Item",
        "- Action: Adversarial Review — Critique Previous Elf's Work",
        "- Action: Review Uncommitted Work",
        "- Action: Execute Work Item",
        "- Action: Adversarial Review — Critique Previous Elf's Work",
        "- Action: Review Uncommitted Work",
        "- Action: Explore — Survey and Write Candidates",
      ].join("\n"),
    );
    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeDefined();
    // 6 reactive (3 critique + 3 review), 4 proactive (2 explore + 1 prioritise + 1 execute)
    expect(result!.reactiveRatio).toBe(0.6);
    expect(result!.reviewLoopCount).toBe(0);
    expect(result!.innovationCycleCount).toBe(0);
  });
});

describe("getShiftProcessPatterns", () => {
  let tempDir: string;
  const today = new Date().toISOString().slice(0, 10);

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-shift-patterns-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns undefined when no shift log exists", async () => {
    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeUndefined();
  });

  test("returns undefined when shift log has no actions", async () => {
    const logDir = join(tempDir, ".shoe-makers", "log");
    await mkdir(logDir, { recursive: true });
    await writeFile(join(logDir, `${today}.md`), "# Shift Log\n\nNo actions yet.\n");

    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeUndefined();
  });

  test("returns process patterns from shift log with actions", async () => {
    const logDir = join(tempDir, ".shoe-makers", "log");
    await mkdir(logDir, { recursive: true });
    await writeFile(
      join(logDir, `${today}.md`),
      [
        "# Shift Log",
        "",
        "## Setup",
        "- Action: Adversarial Review — Critique Previous Elf's Work",
        "",
        "## Setup",
        "- Action: Fix Unresolved Critiques",
        "",
        "## Setup",
        "- Action: Explore — Survey and Write Candidates",
        "",
      ].join("\n"),
    );

    const result = await getShiftProcessPatterns(tempDir);
    expect(result).toBeDefined();
    // 2 reactive (critique, fix-critique) out of 3 total
    expect(result!.reactiveRatio).toBeCloseTo(2 / 3);
    expect(result!.reviewLoopCount).toBe(0);
    expect(result!.innovationCycleCount).toBe(0);
  });
});

describe("computeProcessPatterns edge cases", () => {
  test("counts multiple non-contiguous review loops", () => {
    const patterns = computeProcessPatterns([
      "critique", "fix-critique", "critique",
      "explore",
      "critique", "fix-critique", "critique",
    ]);
    expect(patterns.reviewLoopCount).toBe(2);
  });

  test("single long review loop counts as 1", () => {
    const patterns = computeProcessPatterns([
      "critique", "fix-critique", "critique", "fix-critique", "critique",
    ]);
    expect(patterns.reviewLoopCount).toBe(1);
  });
});

describe("TITLE_TO_ACTION drift prevention", () => {
  const allActions: ActionType[] = [
    "fix-tests", "fix-critique", "critique", "continue-work",
    "review", "inbox", "execute-work-item", "dead-code",
    "prioritise", "innovate", "evaluate-insight", "explore",
  ];

  test("parseShiftLogActions recognizes all prompt titles", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      const title = prompt.split("\n")[0].replace(/^#\s*/, "");
      const logEntry = `- Action: ${title}`;
      const parsed = parseShiftLogActions(logEntry);
      expect(parsed.length).toBe(1);
    }
  });
});
