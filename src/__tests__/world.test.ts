import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { readWorldState, checkUnreviewedCommits, readWorkItemSkillType } from "../state/world";

describe("readWorldState", () => {
  test("reads current repo world state", async () => {
    // Use the actual repo root — we're running inside the shoe-makers repo
    const repoRoot = process.cwd();
    const state = await readWorldState(repoRoot);

    // We should be on the shoemakers branch
    expect(state.branch).toContain("shoemakers");
    expect(typeof state.hasUncommittedChanges).toBe("boolean");

    // Blackboard should have the right shape
    expect(state.blackboard).toHaveProperty("assessment");
    expect(state.blackboard).toHaveProperty("priorities");
    expect(state.blackboard).toHaveProperty("currentTask");
    expect(state.blackboard).toHaveProperty("verification");

    // Inbox count should be a number
    expect(typeof state.inboxCount).toBe("number");

    // Insight count should be a number
    expect(typeof state.insightCount).toBe("number");

    // Gatekeeping fields should exist
    expect(typeof state.hasUnreviewedCommits).toBe("boolean");
    expect(typeof state.unresolvedCritiqueCount).toBe("number");
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

  test("returns true when commits exist after marker", async () => {
    // Use a parent commit as the marker — there are definitely commits after it
    const parent = execSync("git rev-parse HEAD~1", {
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
});
