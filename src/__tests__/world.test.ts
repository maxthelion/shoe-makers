import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { readWorldState, checkUnreviewedCommits, readWorkItemSkillType, getCurrentBranch, checkHasWorkItem, checkHasCandidates, checkHasPartialWork, countInsights, hasUncommittedChanges, countUnresolvedCritiques } from "../state/world";
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
    await withTempDir("unreviewed", async (dir) => {
      expect(await checkUnreviewedCommits(dir)).toBe(false);
    });
  });
});

describe("readWorkItemSkillType", () => {
  test("returns skill type when skill-type: line is present", async () => {
    await withTempDir("skill-type", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      await writeFile(join(dir, ".shoe-makers", "state", "work-item.md"), "# Remove unused exports\nskill-type: dead-code\n\n## Context\n...");
      expect(await readWorkItemSkillType(dir)).toBe("dead-code");
    });
  });

  test("returns null when no skill-type line exists", async () => {
    await withTempDir("skill-type", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      await writeFile(join(dir, ".shoe-makers", "state", "work-item.md"), "# Add tests for prompts\n\n## Context\n...");
      expect(await readWorkItemSkillType(dir)).toBeNull();
    });
  });

  test("does not false-positive on keyword dead-code in title", async () => {
    await withTempDir("skill-type", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      await writeFile(join(dir, ".shoe-makers", "state", "work-item.md"), "# Add tests for the dead-code prompt\n\n## Context\nThis is about testing, not dead-code removal.\n");
      expect(await readWorkItemSkillType(dir)).toBeNull();
    });
  });

  test("returns null when work-item.md does not exist", async () => {
    await withTempDir("skill-type", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      expect(await readWorkItemSkillType(dir)).toBeNull();
    });
  });
});

describe("checkHasWorkItem", () => {
  test("returns true when work-item.md exists", async () => {
    await withTempDir("has-work-item", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      await writeFile(join(dir, ".shoe-makers", "state", "work-item.md"), "# Work item");
      expect(await checkHasWorkItem(dir)).toBe(true);
    });
  });

  test("returns false when work-item.md does not exist", async () => {
    await withTempDir("has-work-item", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      expect(await checkHasWorkItem(dir)).toBe(false);
    });
  });

  test("returns false when state directory does not exist", async () => {
    await withTempDir("has-work-item", async (dir) => {
      expect(await checkHasWorkItem(dir)).toBe(false);
    });
  });
});

describe("checkHasCandidates", () => {
  test("returns true when candidates.md exists", async () => {
    await withTempDir("has-candidates", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      await writeFile(join(dir, ".shoe-makers", "state", "candidates.md"), "# Candidates");
      expect(await checkHasCandidates(dir)).toBe(true);
    });
  });

  test("returns false when candidates.md does not exist", async () => {
    await withTempDir("has-candidates", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      expect(await checkHasCandidates(dir)).toBe(false);
    });
  });
});

describe("checkHasPartialWork", () => {
  test("returns true when partial-work.md exists", async () => {
    await withTempDir("has-partial-work", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      await writeFile(join(dir, ".shoe-makers", "state", "partial-work.md"), "# Partial work");
      expect(await checkHasPartialWork(dir)).toBe(true);
    });
  });

  test("returns false when partial-work.md does not exist", async () => {
    await withTempDir("has-partial-work", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
      expect(await checkHasPartialWork(dir)).toBe(false);
    });
  });

  test("returns false when state directory does not exist", async () => {
    await withTempDir("has-partial-work", async (dir) => {
      expect(await checkHasPartialWork(dir)).toBe(false);
    });
  });
});

describe("countInsights", () => {
  test("returns 0 when insights directory does not exist", async () => {
    await withTempDir("insights", async (dir) => {
      expect(await countInsights(dir)).toBe(0);
    });
  });

  test("returns 0 when insights directory is empty", async () => {
    await withTempDir("insights", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "insights"), { recursive: true });
      expect(await countInsights(dir)).toBe(0);
    });
  });

  test("counts only .md files", async () => {
    await withTempDir("insights", async (dir) => {
      const insightsDir = join(dir, ".shoe-makers", "insights");
      await mkdir(insightsDir, { recursive: true });
      await writeFile(join(insightsDir, "2026-03-25-001.md"), "# Insight");
      await writeFile(join(insightsDir, "2026-03-25-002.md"), "# Insight 2");
      await writeFile(join(insightsDir, "notes.txt"), "not an insight");
      expect(await countInsights(dir)).toBe(2);
    });
  });
});

describe("countUnresolvedCritiques", () => {
  test("returns 0 when findings directory does not exist", async () => {
    await withTempDir("critiques", async (dir) => {
      expect(await countUnresolvedCritiques(dir)).toBe(0);
    });
  });

  test("returns 0 when findings directory is empty", async () => {
    await withTempDir("critiques", async (dir) => {
      await mkdir(join(dir, ".shoe-makers", "findings"), { recursive: true });
      expect(await countUnresolvedCritiques(dir)).toBe(0);
    });
  });

  test("returns 0 when no critique files exist", async () => {
    await withTempDir("critiques", async (dir) => {
      const findingsDir = join(dir, ".shoe-makers", "findings");
      await mkdir(findingsDir, { recursive: true });
      await writeFile(join(findingsDir, "invariant-update-2026-03-25.md"), "# Finding\n\nSome finding.");
      expect(await countUnresolvedCritiques(dir)).toBe(0);
    });
  });

  test("counts unresolved critiques", async () => {
    await withTempDir("critiques", async (dir) => {
      const findingsDir = join(dir, ".shoe-makers", "findings");
      await mkdir(findingsDir, { recursive: true });
      await writeFile(join(findingsDir, "critique-2026-03-25-001.md"), "# Critique\n\nSome issue found.");
      await writeFile(join(findingsDir, "critique-2026-03-25-002.md"), "# Critique\n\nAnother issue.");
      expect(await countUnresolvedCritiques(dir)).toBe(2);
    });
  });

  test("ignores resolved critiques", async () => {
    await withTempDir("critiques", async (dir) => {
      const findingsDir = join(dir, ".shoe-makers", "findings");
      await mkdir(findingsDir, { recursive: true });
      await writeFile(join(findingsDir, "critique-2026-03-25-001.md"), "# Critique\n\nSome issue.\n\n## Status\n\nResolved.\n");
      expect(await countUnresolvedCritiques(dir)).toBe(0);
    });
  });

  test("counts mix of resolved and unresolved", async () => {
    await withTempDir("critiques", async (dir) => {
      const findingsDir = join(dir, ".shoe-makers", "findings");
      await mkdir(findingsDir, { recursive: true });
      await writeFile(join(findingsDir, "critique-2026-03-25-001.md"), "# Critique: issue A\n\nProblem.\n\n## Status\n\nResolved.\n");
      await writeFile(join(findingsDir, "critique-2026-03-25-002.md"), "# Critique: issue B\n\nProblem.\n\n## Status\n\nResolved.\n");
      await writeFile(join(findingsDir, "critique-2026-03-25-003.md"), "# Critique: issue C\n\nStill open.");
      expect(await countUnresolvedCritiques(dir)).toBe(1);
    });
  });

  test("ignores files not starting with critique-", async () => {
    await withTempDir("critiques", async (dir) => {
      const findingsDir = join(dir, ".shoe-makers", "findings");
      await mkdir(findingsDir, { recursive: true });
      await writeFile(join(findingsDir, "invariant-update-2026-03-25.md"), "# Finding\n\nNo resolved status.");
      await writeFile(join(findingsDir, "permission-violation.md"), "# Violation\n\nNo resolved status.");
      expect(await countUnresolvedCritiques(dir)).toBe(0);
    });
  });

  test("ignores non-.md files", async () => {
    await withTempDir("critiques", async (dir) => {
      const findingsDir = join(dir, ".shoe-makers", "findings");
      await mkdir(findingsDir, { recursive: true });
      await writeFile(join(findingsDir, "critique-2026-03-25-001.txt"), "Not a markdown critique");
      expect(await countUnresolvedCritiques(dir)).toBe(0);
    });
  });
});

describe("hasUncommittedChanges", () => {
  test("returns a boolean for the current repo", () => {
    // Use the real repo — creating temp git repos fails due to commit signing constraints
    const result = hasUncommittedChanges(process.cwd());
    expect(typeof result).toBe("boolean");
  });
});
