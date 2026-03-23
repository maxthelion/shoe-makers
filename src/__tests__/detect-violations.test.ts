import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { getElfChangedFiles } from "../verify/detect-violations";
import { execSync } from "child_process";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

let tempDir: string;

function git(cmd: string, cwd: string): string {
  return execSync(`git ${cmd}`, { cwd, encoding: "utf-8" }).trim();
}

async function setupGitRepo(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "detect-violations-test-"));
  git("init", dir);
  git("config user.email test@test.com", dir);
  git("config user.name Test", dir);
  git("config commit.gpgsign false", dir);

  // Initial commit
  await writeFile(join(dir, "README.md"), "initial");
  git("add .", dir);
  git('commit -m "Initial commit"', dir);

  return dir;
}

beforeEach(async () => {
  tempDir = await setupGitRepo();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("getElfChangedFiles", () => {
  test("returns files from elf commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "foo.ts"), "content");
    git("add .", tempDir);
    git('commit -m "Implement feature X"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toContain("src/foo.ts");
  });

  test("excludes files from auto-commit housekeeping commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "log"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "log", "2026-03-23.md"), "log entry");
    git("add .", tempDir);
    git('commit -m "Auto-commit setup housekeeping (archive, shift log)"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual([]);
  });

  test("returns only elf files when mixed with housekeeping commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    // Housekeeping commit
    await mkdir(join(tempDir, ".shoe-makers", "log"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "log", "2026-03-23.md"), "log entry");
    git("add .", tempDir);
    git('commit -m "Auto-commit setup housekeeping (archive, shift log)"', tempDir);

    // Elf commit
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "bar.ts"), "code");
    git("add .", tempDir);
    git('commit -m "Fix bug in bar module"', tempDir);

    // Another housekeeping commit
    await writeFile(join(tempDir, ".shoe-makers", "log", "2026-03-23.md"), "more log");
    git("add .", tempDir);
    git('commit -m "Auto-commit setup housekeeping (archive, shift log)"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual(["src/bar.ts"]);
  });

  test("returns empty array when no commits in range", async () => {
    const currentCommit = git("rev-parse HEAD", tempDir);
    const files = getElfChangedFiles(tempDir, currentCommit);
    expect(files).toEqual([]);
  });

  test("deduplicates files changed in multiple elf commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "foo.ts"), "v1");
    git("add .", tempDir);
    git('commit -m "First change"', tempDir);

    await writeFile(join(tempDir, "src", "foo.ts"), "v2");
    git("add .", tempDir);
    git('commit -m "Second change"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual(["src/foo.ts"]);
  });

  test("does not filter commits with similar but different messages", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "cleanup.ts"), "code");
    git("add .", tempDir);
    git('commit -m "Auto-commit housekeeping cleanup"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual(["src/cleanup.ts"]);
  });
});
