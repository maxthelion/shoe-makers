import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { getElfChangedFiles, detectPermissionViolations } from "../verify/detect-violations";
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

  test("excludes housekeeping files even in elf commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    // Elf commit that also includes shift log changes (mixed commit)
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, ".shoe-makers", "log"), { recursive: true });
    await writeFile(join(tempDir, "src", "feature.ts"), "code");
    await writeFile(join(tempDir, ".shoe-makers", "log", "2026-03-24.md"), "shift log entry");
    git("add .", tempDir);
    git('commit -m "Implement feature X"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toContain("src/feature.ts");
    expect(files).not.toContain(".shoe-makers/log/2026-03-24.md");
  });

  test("excludes archive files from elf commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, ".shoe-makers", "archive"), { recursive: true });
    await writeFile(join(tempDir, "src", "code.ts"), "code");
    await writeFile(join(tempDir, ".shoe-makers", "archive", "old-finding.md"), "archived");
    git("add .", tempDir);
    git('commit -m "Some elf work"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toContain("src/code.ts");
    expect(files).not.toContain(".shoe-makers/archive/old-finding.md");
  });

  test("excludes findings directory files from elf commits", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "findings", "critique-2026-03-24.md"), "finding");
    git("add .", tempDir);
    git('commit -m "Elf commit with findings"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).not.toContain(".shoe-makers/findings/critique-2026-03-24.md");
  });

  test("excludes commits that only change .shoe-makers/state/ files", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "candidates.md"), "candidates");
    git("add .", tempDir);
    git('commit -m "Explore: write candidates"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual([]);
  });

  test("excludes commits that only change work-item.md", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "work-item.md"), "work item");
    git("add .", tempDir);
    git('commit -m "Prioritise: pick a work item"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual([]);
  });

  test("excludes commits that only change .shoe-makers/findings/ files", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "findings", "critique-2026-03-25-001.md"), "critique");
    git("add .", tempDir);
    git('commit -m "Adversarial review: critique (clean)"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual([]);
  });

  test("excludes commits that only change .shoe-makers/insights/ files", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "insights"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "insights", "2026-03-25-001.md"), "insight");
    git("add .", tempDir);
    git('commit -m "Innovate: insight on something"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toEqual([]);
  });

  test("includes commits that change findings AND source files", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "findings", "critique-001.md"), "critique");
    await writeFile(join(tempDir, "src", "fix.ts"), "code");
    git("add .", tempDir);
    git('commit -m "Fix critique: update source and resolve finding"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toContain("src/fix.ts");
    expect(files).toContain(".shoe-makers/findings/critique-001.md");
  });

  test("includes commits that change both state files and source files", async () => {
    const baseCommit = git("rev-parse HEAD", tempDir);

    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "work-item.md"), "work item");
    await writeFile(join(tempDir, "src", "feature.ts"), "code");
    git("add .", tempDir);
    git('commit -m "Execute: implement feature"', tempDir);

    const files = getElfChangedFiles(tempDir, baseCommit);
    expect(files).toContain("src/feature.ts");
    expect(files).toContain(".shoe-makers/state/work-item.md");
  });
});

describe("detectPermissionViolations with previous-action-type", () => {
  test("reads action type from previous-action-type file instead of last-action.md", async () => {
    const stateDir = join(tempDir, ".shoe-makers", "state");
    await mkdir(stateDir, { recursive: true });

    // Write previous-action-type as "execute-work-item" (allows src/ changes)
    await writeFile(join(stateDir, "previous-action-type"), "execute-work-item");

    // Write last-action.md as a critique action (does NOT allow src/ changes)
    // This simulates the ABA problem: setup overwrote last-action.md
    await writeFile(join(stateDir, "last-action.md"), "# Adversarial Review\n\nReview stuff.");

    // Write last-reviewed-commit
    const baseCommit = git("rev-parse HEAD", tempDir);
    await writeFile(join(stateDir, "last-reviewed-commit"), baseCommit);

    // Make an elf commit that changes src/
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "feature.ts"), "new code");
    git("add .", tempDir);
    git('commit -m "Implement feature"', tempDir);

    // With previous-action-type = execute-work-item, src/ is allowed → no violations
    const violations = await detectPermissionViolations(tempDir);
    expect(violations).toEqual([]);
  });

  test("falls back to last-action.md when previous-action-type does not exist", async () => {
    const stateDir = join(tempDir, ".shoe-makers", "state");
    await mkdir(stateDir, { recursive: true });

    // Only write last-action.md (no previous-action-type)
    await writeFile(join(stateDir, "last-action.md"), "# Execute Work Item\n\nDo the work.");

    const baseCommit = git("rev-parse HEAD", tempDir);
    await writeFile(join(stateDir, "last-reviewed-commit"), baseCommit);

    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "feature.ts"), "code");
    git("add .", tempDir);
    git('commit -m "Implement feature"', tempDir);

    // Falls back to last-action.md which says "Execute Work Item" → src/ allowed
    const violations = await detectPermissionViolations(tempDir);
    expect(violations).toEqual([]);
  });
});
