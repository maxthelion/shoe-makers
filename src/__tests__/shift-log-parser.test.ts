import { describe, test, expect } from "bun:test";
import { parseShiftLogActions, computeProcessPatterns } from "../log/shift-log-parser";

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

  test("handles all action types", () => {
    const log = [
      "- Action: Fix Failing Tests",
      "- Action: Fix Unresolved Critiques",
      "- Action: Adversarial Review — Critique Previous Elf's Work",
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
      "fix-tests", "fix-critique", "critique", "inbox",
      "execute-work-item", "dead-code", "prioritise",
      "innovate", "evaluate-insight", "explore",
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
});
