import { describe, test, expect } from "bun:test";
import { isAllHousekeeping } from "../setup";

describe("isAllHousekeeping", () => {
  test("returns true for shift log changes only", () => {
    const status = " M .shoe-makers/log/2026-03-23.md";
    expect(isAllHousekeeping(status)).toBe(true);
  });

  test("returns true for findings archive changes only", () => {
    const status = "?? .shoe-makers/findings/archive/critique-2026-03-23-100.md";
    expect(isAllHousekeeping(status)).toBe(true);
  });

  test("returns true for mixed housekeeping changes", () => {
    const status = [
      " M .shoe-makers/log/2026-03-23.md",
      " D .shoe-makers/findings/critique-2026-03-23-100.md",
      "?? .shoe-makers/findings/archive/critique-2026-03-23-100.md",
    ].join("\n");
    expect(isAllHousekeeping(status)).toBe(true);
  });

  test("returns false when non-housekeeping changes are present", () => {
    const status = [
      " M .shoe-makers/log/2026-03-23.md",
      " M src/setup.ts",
    ].join("\n");
    expect(isAllHousekeeping(status)).toBe(false);
  });

  test("returns false for empty status output", () => {
    expect(isAllHousekeeping("")).toBe(false);
    expect(isAllHousekeeping("  ")).toBe(false);
  });

  test("returns false for code-only changes", () => {
    const status = " M src/types.ts";
    expect(isAllHousekeeping(status)).toBe(false);
  });

  test("handles rename format (old -> new)", () => {
    const status = "R  .shoe-makers/findings/critique-100.md -> .shoe-makers/findings/archive/critique-100.md";
    expect(isAllHousekeeping(status)).toBe(true);
  });

  test("returns false when state files are changed", () => {
    const status = " M .shoe-makers/state/assessment.json";
    expect(isAllHousekeeping(status)).toBe(false);
  });

  test("handles trailing newline from git status output", () => {
    const status = " M .shoe-makers/log/2026-03-23.md\n";
    expect(isAllHousekeeping(status)).toBe(true);
  });

  test("handles multi-line output with trailing newline", () => {
    const status = " M .shoe-makers/log/2026-03-23.md\n D .shoe-makers/findings/old.md\n";
    expect(isAllHousekeeping(status)).toBe(true);
  });
});
