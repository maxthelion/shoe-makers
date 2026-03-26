import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { isAllHousekeeping } from "../setup";
import { autoCommitHousekeeping } from "../setup/housekeeping";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "fs/promises";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";

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

  test("returns true when state files are changed (consumed work-item, candidates)", () => {
    const status = " D .shoe-makers/state/work-item.md";
    expect(isAllHousekeeping(status)).toBe(true);
  });

  test("returns true for mixed state and log housekeeping", () => {
    const status = [
      " D .shoe-makers/state/work-item.md",
      " M .shoe-makers/log/2026-03-24.md",
    ].join("\n");
    expect(isAllHousekeeping(status)).toBe(true);
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

describe("autoCommitHousekeeping", () => {
  let tmpRoot: string;

  function git(cmd: string) {
    return execSync(`git ${cmd}`, { cwd: tmpRoot, encoding: "utf-8", stdio: "pipe" });
  }

  function initRepo() {
    execSync("git init", { cwd: tmpRoot, stdio: "pipe" });
    execSync('git config user.email "test@test.com"', { cwd: tmpRoot, stdio: "pipe" });
    execSync('git config user.name "Test"', { cwd: tmpRoot, stdio: "pipe" });
    execSync("git config commit.gpgsign false", { cwd: tmpRoot, stdio: "pipe" });
    // Initial commit so HEAD exists
    writeFileSync(join(tmpRoot, "README.md"), "init");
    git("add README.md");
    git('commit -m "init"');
  }

  async function createHousekeepingDirs() {
    // Create all housekeeping directories and commit placeholder files
    // so git tracks individual files instead of collapsing to "?? .shoe-makers/"
    const dirs = ["findings", "log", "archive", "state"];
    for (const dir of dirs) {
      const dirPath = join(tmpRoot, ".shoe-makers", dir);
      await mkdir(dirPath, { recursive: true });
      writeFileSync(join(dirPath, ".gitkeep"), "");
    }
    git("add .shoe-makers/");
    git('commit -m "add housekeeping dirs"');
  }

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), "auto-commit-test-"));
    initRepo();
    await createHousekeepingDirs();
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
  });

  test("commits housekeeping changes", async () => {
    await writeFile(join(tmpRoot, ".shoe-makers", "log", "2026-03-26.md"), "# Shift log\n");

    const commitsBefore = git("rev-list --count HEAD").trim();
    autoCommitHousekeeping(tmpRoot);
    const commitsAfter = git("rev-list --count HEAD").trim();

    expect(Number(commitsAfter)).toBe(Number(commitsBefore) + 1);
    const log = git("log --oneline -1");
    expect(log).toContain("Auto-commit setup housekeeping");
  });

  test("skips when non-housekeeping changes exist", async () => {
    await writeFile(join(tmpRoot, ".shoe-makers", "log", "2026-03-26.md"), "# Shift log\n");
    await writeFile(join(tmpRoot, "src-file.ts"), "code");

    const commitsBefore = git("rev-list --count HEAD").trim();
    autoCommitHousekeeping(tmpRoot);
    const commitsAfter = git("rev-list --count HEAD").trim();

    expect(commitsAfter).toBe(commitsBefore);
  });

  test("advances last-reviewed-commit when auto-commit is the only unreviewed commit", async () => {
    // Set marker to current HEAD
    const currentHead = git("rev-parse HEAD").trim();
    const stateDir = join(tmpRoot, ".shoe-makers", "state");
    writeFileSync(join(stateDir, "last-reviewed-commit"), currentHead);

    // Create housekeeping change
    await writeFile(join(tmpRoot, ".shoe-makers", "log", "2026-03-26.md"), "# Shift log\n");

    autoCommitHousekeeping(tmpRoot);

    const newHead = git("rev-parse HEAD").trim();
    const marker = readFileSync(join(stateDir, "last-reviewed-commit"), "utf-8").trim();
    expect(marker).toBe(newHead);
    expect(marker).not.toBe(currentHead);
  });

  test("does NOT advance marker when there are other unreviewed commits", async () => {
    // Set marker to current HEAD
    const initialHead = git("rev-parse HEAD").trim();
    const stateDir = join(tmpRoot, ".shoe-makers", "state");
    writeFileSync(join(stateDir, "last-reviewed-commit"), initialHead);

    // Make an intermediate code commit (unreviewed)
    await writeFile(join(tmpRoot, "feature.ts"), "code");
    git("add feature.ts");
    git('commit -m "feature"');

    // Now create housekeeping change
    await writeFile(join(tmpRoot, ".shoe-makers", "log", "2026-03-26.md"), "# Shift log\n");

    autoCommitHousekeeping(tmpRoot);

    // Marker should NOT have advanced (there's an unreviewed code commit in between)
    const marker = readFileSync(join(stateDir, "last-reviewed-commit"), "utf-8").trim();
    expect(marker).toBe(initialHead);
  });

  test("does nothing when there are no changes", () => {
    const commitsBefore = git("rev-list --count HEAD").trim();
    autoCommitHousekeeping(tmpRoot);
    const commitsAfter = git("rev-list --count HEAD").trim();
    expect(commitsAfter).toBe(commitsBefore);
  });
});
