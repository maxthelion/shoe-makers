import { execSync } from "child_process";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { WorldState } from "../types";
import { readBlackboard } from "./blackboard";
import { loadConfig } from "../config/load-config";

/**
 * Get the current git branch name.
 */
function getCurrentBranch(repoRoot: string): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
}

/**
 * Check if the working tree has uncommitted changes (staged or unstaged).
 */
function hasUncommittedChanges(repoRoot: string): boolean {
  const status = execSync("git status --porcelain", {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
  return status.length > 0;
}

/**
 * Count markdown files in the inbox directory.
 */
async function countInboxMessages(repoRoot: string): Promise<number> {
  try {
    const files = await readdir(join(repoRoot, ".shoe-makers", "inbox"));
    return files.filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

/**
 * Check if there are commits since the last reviewed commit.
 */
async function checkUnreviewedCommits(repoRoot: string): Promise<boolean> {
  try {
    const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
    const lastReviewed = (await readFile(markerPath, "utf-8")).trim();
    const log = execSync(`git log ${lastReviewed}..HEAD --oneline`, {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();
    return log.length > 0;
  } catch {
    return false;
  }
}

/**
 * Count unresolved critique findings.
 */
async function countUnresolvedCritiques(repoRoot: string): Promise<number> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  let count = 0;
  try {
    const files = await readdir(findingsDir);
    for (const file of files) {
      if (!file.startsWith("critique-") || !file.endsWith(".md")) continue;
      const content = await readFile(join(findingsDir, file), "utf-8");
      if (!/^## Status\s*\n\s*Resolved\.?\s*$/mi.test(content)) {
        count++;
      }
    }
  } catch {}
  return count;
}

/**
 * Read the full world state: git info + blackboard + inbox count.
 */
export async function readWorldState(repoRoot: string): Promise<WorldState> {
  const [branch, dirty, blackboard, config, inboxCount, hasUnreviewedCommits, unresolvedCritiqueCount] = await Promise.all([
    getCurrentBranch(repoRoot),
    hasUncommittedChanges(repoRoot),
    readBlackboard(repoRoot),
    loadConfig(repoRoot),
    countInboxMessages(repoRoot),
    checkUnreviewedCommits(repoRoot),
    countUnresolvedCritiques(repoRoot),
  ]);

  return {
    branch,
    hasUncommittedChanges: dirty,
    blackboard,
    inboxCount,
    hasUnreviewedCommits,
    unresolvedCritiqueCount,
    config,
  };
}
