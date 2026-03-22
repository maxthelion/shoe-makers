import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { readWorldState, checkUnreviewedCommits } from "../state/world";

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
