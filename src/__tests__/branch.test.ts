import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { ensureBranch } from "../setup/branch";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-branch-"));
  execSync("git init", { cwd: tempDir, stdio: "pipe" });
  execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", {
    cwd: tempDir,
    stdio: "pipe",
  });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("ensureBranch", () => {
  test("uses default 'shoemakers' prefix when no branchPrefix provided", () => {
    const branchName = ensureBranch(tempDir);
    expect(branchName).toMatch(/^shoemakers\/\d{4}-\d{2}-\d{2}$/);
  });

  test("uses custom branchPrefix when provided", () => {
    const branchName = ensureBranch(tempDir, "nightshift");
    expect(branchName).toMatch(/^nightshift\/\d{4}-\d{2}-\d{2}$/);
  });

  test("creates branch with custom prefix", () => {
    ensureBranch(tempDir, "elves");
    const currentBranch = execSync("git branch --show-current", {
      cwd: tempDir,
      encoding: "utf-8",
    }).trim();
    expect(currentBranch).toMatch(/^elves\/\d{4}-\d{2}-\d{2}$/);
  });

  test("is idempotent when already on the correct branch", () => {
    const first = ensureBranch(tempDir, "custom");
    const second = ensureBranch(tempDir, "custom");
    expect(first).toBe(second);
  });
});
