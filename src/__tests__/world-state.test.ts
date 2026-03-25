import { describe, test, expect } from "bun:test";
import { execSync } from "child_process";
import { writeFile } from "fs/promises";
import { join } from "path";
import { readWorldState, getCurrentBranch, hasUncommittedChanges } from "../state/world";
import { withTempDir } from "./test-utils";

describe("readWorldState", () => {
  test("reads current repo world state", async () => {
    // Use the actual repo root — we're running inside the shoe-makers repo
    const repoRoot = process.cwd();
    const state = await readWorldState(repoRoot);

    // Branch should be a non-empty string
    expect(typeof state.branch).toBe("string");
    expect(state.branch.length).toBeGreaterThan(0);
    expect(typeof state.hasUncommittedChanges).toBe("boolean");

    // Blackboard should have the right shape
    expect(state.blackboard).toHaveProperty("assessment");
    expect(state.blackboard).toHaveProperty("currentTask");

    // Inbox count should be a number
    expect(typeof state.inboxCount).toBe("number");

    // Insight count should be a number
    expect(typeof state.insightCount).toBe("number");

    // Gatekeeping fields should exist
    expect(typeof state.hasUnreviewedCommits).toBe("boolean");
    expect(typeof state.unresolvedCritiqueCount).toBe("number");
  });
});

describe("getCurrentBranch", () => {
  test("returns current branchName for a git repo", () => {
    const branchName = getCurrentBranch(process.cwd());
    expect(typeof branchName).toBe("string");
    expect(branchName.length).toBeGreaterThan(0);
    // Branch name should be a valid branch string
    expect(branchName).toMatch(/^[a-zA-Z0-9/_.-]+$/);
  });

  test("returns branchName from a fresh git repo", async () => {
    await withTempDir("branch", async (dir) => {
      execSync("git init", { cwd: dir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
      const branchName = getCurrentBranch(dir);
      expect(typeof branchName).toBe("string");
      expect(branchName.length).toBeGreaterThan(0);
    });
  });
});

describe("hasUncommittedChanges", () => {
  test("returns false for a clean repo", async () => {
    await withTempDir("clean", async (dir) => {
      execSync("git init", { cwd: dir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
      expect(hasUncommittedChanges(dir)).toBe(false);
    });
  });

  test("returns true when files are modified", async () => {
    await withTempDir("dirty", async (dir) => {
      execSync("git init", { cwd: dir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: dir, stdio: "pipe" });
      await writeFile(join(dir, "new-file.txt"), "hello");
      expect(hasUncommittedChanges(dir)).toBe(true);
    });
  });

  test("returns a boolean for the current repo", () => {
    // Use the real repo — creating temp git repos fails due to commit signing constraints
    const result = hasUncommittedChanges(process.cwd());
    expect(typeof result).toBe("boolean");
  });
});
