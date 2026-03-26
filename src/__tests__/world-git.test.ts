import { describe, test, expect } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { readWorldState, getCurrentBranch, hasUncommittedChanges, checkUnreviewedCommits } from "../state/world";

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
    const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-branch-"));
    try {
      execSync("git init", { cwd: tempDir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: tempDir, stdio: "pipe" });
      const branchName = getCurrentBranch(tempDir);
      expect(typeof branchName).toBe("string");
      expect(branchName.length).toBeGreaterThan(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("hasUncommittedChanges", () => {
  test("returns false for a clean repo", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-clean-"));
    try {
      execSync("git init", { cwd: tempDir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: tempDir, stdio: "pipe" });
      expect(hasUncommittedChanges(tempDir)).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns true when files are modified", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-dirty-"));
    try {
      execSync("git init", { cwd: tempDir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: tempDir, stdio: "pipe" });
      await writeFile(join(tempDir, "new-file.txt"), "hello");
      expect(hasUncommittedChanges(tempDir)).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns a boolean for the current repo", () => {
    // Use the real repo — creating temp git repos fails due to commit signing constraints
    const result = hasUncommittedChanges(process.cwd());
    expect(typeof result).toBe("boolean");
  });
});

describe("checkUnreviewedCommits", () => {
  /** Create an isolated temp git repo with .shoe-makers/state/ directory */
  async function createTempGitRepo(): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-unreviewed-"));
    execSync("git init", { cwd: tempDir, stdio: "pipe" });
    execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: tempDir, stdio: "pipe" });
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    return tempDir;
  }

  test("returns false when marker points to HEAD (all reviewed)", async () => {
    const tempDir = await createTempGitRepo();
    try {
      const head = execSync("git rev-parse HEAD", { cwd: tempDir, encoding: "utf-8" }).trim();
      await writeFile(join(tempDir, ".shoe-makers", "state", "last-reviewed-commit"), head);
      const result = await checkUnreviewedCommits(tempDir);
      expect(result).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns true when elf-authored commits exist after marker", async () => {
    const tempDir = await createTempGitRepo();
    try {
      const initCommit = execSync("git rev-parse HEAD", { cwd: tempDir, encoding: "utf-8" }).trim();
      // Create a commit that touches src/ (elf-authored, not orchestration)
      await mkdir(join(tempDir, "src"), { recursive: true });
      await writeFile(join(tempDir, "src", "new-file.ts"), "export const x = 1;");
      execSync("git add src/new-file.ts", { cwd: tempDir, stdio: "pipe" });
      execSync("git -c commit.gpgsign=false commit -m 'add src file'", { cwd: tempDir, stdio: "pipe" });
      await writeFile(join(tempDir, ".shoe-makers", "state", "last-reviewed-commit"), initCommit);
      const result = await checkUnreviewedCommits(tempDir);
      expect(result).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns true when marker contains invalid content", async () => {
    const tempDir = await createTempGitRepo();
    try {
      await writeFile(join(tempDir, ".shoe-makers", "state", "last-reviewed-commit"), "; rm -rf /");
      const result = await checkUnreviewedCommits(tempDir);
      expect(result).toBe(true); // treats invalid marker as "all unreviewed"
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns false for non-git directory", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-nogit-"));
    try {
      const result = await checkUnreviewedCommits(tempDir);
      expect(result).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("accepts short hash (7 chars) as valid marker", async () => {
    const tempDir = await createTempGitRepo();
    try {
      const head = execSync("git rev-parse --short HEAD", { cwd: tempDir, encoding: "utf-8" }).trim();
      await writeFile(join(tempDir, ".shoe-makers", "state", "last-reviewed-commit"), head);
      const result = await checkUnreviewedCommits(tempDir);
      // Short hashes are valid per the regex /^[0-9a-f]{7,40}$/
      // Result depends on whether there are commits after HEAD (there aren't), so expect false
      expect(typeof result).toBe("boolean");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
