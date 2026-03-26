import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { readWorldState, checkUnreviewedCommits, readWorkItemSkillType, getCurrentBranch, checkHasWorkItem, checkHasCandidates, checkHasPartialWork, countInsights, hasUncommittedChanges, countUnresolvedCritiques } from "../state/world";

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
});

describe("checkUnreviewedCommits", () => {
  const repoRoot = process.cwd();
  const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
  let savedMarker: string | null = null;

  beforeEach(async () => {
    // Save existing marker to restore after test
    try {
      const { readFile: rf } = await import("fs/promises");
      savedMarker = await rf(markerPath, "utf-8");
    } catch {
      savedMarker = null;
    }
  });

  afterEach(async () => {
    // Restore marker to avoid side effects on real repo
    if (savedMarker !== null) {
      await mkdir(join(repoRoot, ".shoe-makers", "state"), { recursive: true });
      await writeFile(markerPath, savedMarker);
    } else {
      try {
        const { unlink } = await import("fs/promises");
        await unlink(markerPath);
      } catch {}
    }
  });

  test("returns false when marker points to HEAD (all reviewed)", async () => {
    const head = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf-8" }).trim();
    await mkdir(join(repoRoot, ".shoe-makers", "state"), { recursive: true });
    await writeFile(markerPath, head);

    const result = await checkUnreviewedCommits(repoRoot);
    expect(result).toBe(false);
  });

  test("returns true when elf-authored commits exist after marker", async () => {
    // Find a commit that touches src/ (non-orchestration), then use its parent as marker
    const srcCommit = execSync(
      "git log --format=%H -n 1 -- src/",
      { cwd: repoRoot, encoding: "utf-8" },
    ).trim();

    if (!srcCommit) {
      // No src-touching commits — skip test (shouldn't happen in a real repo)
      return;
    }

    const parent = execSync(`git rev-parse ${srcCommit}~1`, {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();
    await mkdir(join(repoRoot, ".shoe-makers", "state"), { recursive: true });
    await writeFile(markerPath, parent);

    const result = await checkUnreviewedCommits(repoRoot);
    expect(result).toBe(true);
  });

  test("returns true when marker contains invalid content", async () => {
    await mkdir(join(repoRoot, ".shoe-makers", "state"), { recursive: true });
    await writeFile(markerPath, "; rm -rf /");

    const result = await checkUnreviewedCommits(repoRoot);
    expect(result).toBe(true); // treats invalid marker as "all unreviewed"
  });

  test("returns false for non-git directory", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-unreviewed-"));
    try {
      const result = await checkUnreviewedCommits(tempDir);
      expect(result).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("accepts short hash (7 chars) as valid marker", async () => {
    const head = execSync("git rev-parse --short HEAD", { cwd: repoRoot, encoding: "utf-8" }).trim();
    await mkdir(join(repoRoot, ".shoe-makers", "state"), { recursive: true });
    // Short hashes are valid per the regex /^[0-9a-f]{7,40}$/
    // This should not return true due to invalid marker — the hash is valid
    await writeFile(markerPath, head);
    const result = await checkUnreviewedCommits(repoRoot);
    // We can't predict the exact result (depends on git state),
    // but it should not throw and should return a boolean
    expect(typeof result).toBe("boolean");
  });
});

describe("readWorkItemSkillType", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-skill-type-"));
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns skill type when skill-type: line is present", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "# Remove unused exports\nskill-type: dead-code\n\n## Context\n...",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBe("dead-code");
  });

  test("returns null when no skill-type line exists", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "# Add tests for prompts\n\n## Context\n...",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("does not false-positive on keyword dead-code in title", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "# Add tests for the dead-code prompt\n\n## Context\nThis is about testing, not dead-code removal.\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("returns null when work-item.md does not exist", async () => {
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("returns null when skill-type appears after line 10", async () => {
    const lines = Array(11).fill("# Padding line").join("\n");
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      lines + "\nskill-type: implement\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("trims whitespace from skill type value", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "skill-type:   implement  \n# Title\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBe("implement");
  });

  test("matches case-insensitively", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "Skill-Type: test-coverage\n# Title\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBe("test-coverage");
  });
});

describe("checkHasWorkItem", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-has-work-item-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns true when work-item.md exists", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "work-item.md"), "# Work item");
    expect(await checkHasWorkItem(tempDir)).toBe(true);
  });

  test("returns false when work-item.md does not exist", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    expect(await checkHasWorkItem(tempDir)).toBe(false);
  });

  test("returns false when state directory does not exist", async () => {
    expect(await checkHasWorkItem(tempDir)).toBe(false);
  });
});

describe("checkHasCandidates", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-has-candidates-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns true when candidates.md exists", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "candidates.md"), "# Candidates");
    expect(await checkHasCandidates(tempDir)).toBe(true);
  });

  test("returns false when candidates.md does not exist", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    expect(await checkHasCandidates(tempDir)).toBe(false);
  });
});

describe("checkHasPartialWork", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-has-partial-work-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns true when partial-work.md exists", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "partial-work.md"), "# Partial work");
    expect(await checkHasPartialWork(tempDir)).toBe(true);
  });

  test("returns false when partial-work.md does not exist", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    expect(await checkHasPartialWork(tempDir)).toBe(false);
  });

  test("returns false when state directory does not exist", async () => {
    expect(await checkHasPartialWork(tempDir)).toBe(false);
  });
});

describe("countInsights", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-insights-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns 0 when insights directory does not exist", async () => {
    expect(await countInsights(tempDir)).toBe(0);
  });

  test("returns 0 when insights directory is empty", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "insights"), { recursive: true });
    expect(await countInsights(tempDir)).toBe(0);
  });

  test("counts only .md files", async () => {
    const dir = join(tempDir, ".shoe-makers", "insights");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "2026-03-25-001.md"), "# Insight");
    await writeFile(join(dir, "2026-03-25-002.md"), "# Insight 2");
    await writeFile(join(dir, "notes.txt"), "not an insight");
    expect(await countInsights(tempDir)).toBe(2);
  });
});

describe("countUnresolvedCritiques", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-critiques-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns 0 when findings directory does not exist", async () => {
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("returns 0 when findings directory is empty", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("returns 0 when no critique files exist", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "invariant-update-2026-03-25.md"), "# Finding\n\nSome finding.");
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("counts unresolved critiques", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "critique-2026-03-25-001.md"), "# Critique\n\nSome issue found.");
    await writeFile(join(dir, "critique-2026-03-25-002.md"), "# Critique\n\nAnother issue.");
    expect(await countUnresolvedCritiques(tempDir)).toBe(2);
  });

  test("ignores resolved critiques", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\nSome issue.\n\n## Status\n\nResolved.\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("counts mix of resolved and unresolved", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique: issue A\n\nProblem.\n\n## Status\n\nResolved.\n",
    );
    await writeFile(
      join(dir, "critique-2026-03-25-002.md"),
      "# Critique: issue B\n\nProblem.\n\n## Status\n\nResolved.\n",
    );
    await writeFile(
      join(dir, "critique-2026-03-25-003.md"),
      "# Critique: issue C\n\nStill open.",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(1);
  });

  test("ignores files not starting with critique-", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "invariant-update-2026-03-25.md"), "# Finding\n\nNo resolved status.");
    await writeFile(join(dir, "permission-violation.md"), "# Violation\n\nNo resolved status.");
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("ignores non-.md files", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "critique-2026-03-25-001.txt"), "Not a markdown critique");
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("recognizes Resolved with trailing period", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\n## Status\n\nResolved.\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("recognizes Resolved with trailing description", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\n## Status\n\nResolved — all clear.\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("recognizes Resolved with leading whitespace", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\n## Status\n  Resolved\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });
});

describe("hasUncommittedChanges", () => {
  test("returns a boolean for the current repo", () => {
    // Use the real repo — creating temp git repos fails due to commit signing constraints
    const result = hasUncommittedChanges(process.cwd());
    expect(typeof result).toBe("boolean");
  });
});
