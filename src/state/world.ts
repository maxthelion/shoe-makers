import { execSync } from "child_process";
import { readdir, readFile, access } from "fs/promises";
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
export function hasUncommittedChanges(repoRoot: string): boolean {
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
 * Count markdown files in the insights directory.
 */
async function countInsights(repoRoot: string): Promise<number> {
  try {
    const files = await readdir(join(repoRoot, ".shoe-makers", "insights"));
    return files.filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

/**
 * Check if there are commits since the last reviewed commit.
 * If no marker file exists, all commits are considered unreviewed.
 */
export async function checkUnreviewedCommits(repoRoot: string): Promise<boolean> {
  const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
  let lastReviewed: string;
  try {
    const raw = (await readFile(markerPath, "utf-8")).trim();
    // Validate that the marker is a git commit hash (prevent shell injection)
    if (!/^[0-9a-f]{7,40}$/.test(raw)) return true;
    lastReviewed = raw;
  } catch {
    // No marker file — check if the branch has any commits at all
    try {
      const log = execSync("git log --oneline -1", {
        cwd: repoRoot,
        encoding: "utf-8",
      }).trim();
      return log.length > 0;
    } catch {
      return false;
    }
  }

  try {
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
/** Pattern to detect resolved findings: matches `## Status\nResolved.` */
export const RESOLVED_PATTERN = /^## Status\s*\n\s*Resolved\.?\s*$/mi;

export async function countUnresolvedCritiques(repoRoot: string): Promise<number> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  let count = 0;
  try {
    const files = await readdir(findingsDir);
    for (const file of files) {
      if (!file.startsWith("critique-") || !file.endsWith(".md")) continue;
      const content = await readFile(join(findingsDir, file), "utf-8");
      if (!RESOLVED_PATTERN.test(content)) {
        count++;
      }
    }
  } catch {}
  return count;
}

/**
 * Check if a file exists.
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if .shoe-makers/state/work-item.md exists.
 */
export async function checkHasWorkItem(repoRoot: string): Promise<boolean> {
  return fileExists(join(repoRoot, ".shoe-makers", "state", "work-item.md"));
}

/**
 * Check if .shoe-makers/state/candidates.md exists.
 */
export async function checkHasCandidates(repoRoot: string): Promise<boolean> {
  return fileExists(join(repoRoot, ".shoe-makers", "state", "candidates.md"));
}

/**
 * Read the skill type from work-item.md header (first 5 lines).
 * Returns the skill type if detected, null otherwise.
 */
export async function readWorkItemSkillType(repoRoot: string): Promise<string | null> {
  try {
    const content = await readFile(join(repoRoot, ".shoe-makers", "state", "work-item.md"), "utf-8");
    const header = content.split("\n").slice(0, 5).join("\n").toLowerCase();
    if (header.includes("dead-code") || header.includes("dead code")) return "dead-code";
    return null;
  } catch {
    return null;
  }
}

/**
 * Read the full world state: git info + blackboard + inbox count.
 */
export async function readWorldState(repoRoot: string): Promise<WorldState> {
  const [branch, dirty, blackboard, config, inboxCount, hasUnreviewedCommits, unresolvedCritiqueCount, hasWorkItem, hasCandidates, workItemSkillType, insightCount] = await Promise.all([
    getCurrentBranch(repoRoot),
    hasUncommittedChanges(repoRoot),
    readBlackboard(repoRoot),
    loadConfig(repoRoot),
    countInboxMessages(repoRoot),
    checkUnreviewedCommits(repoRoot),
    countUnresolvedCritiques(repoRoot),
    checkHasWorkItem(repoRoot),
    checkHasCandidates(repoRoot),
    readWorkItemSkillType(repoRoot),
    countInsights(repoRoot),
  ]);

  return {
    branch,
    hasUncommittedChanges: dirty,
    blackboard,
    inboxCount,
    hasUnreviewedCommits,
    unresolvedCritiqueCount,
    hasWorkItem,
    hasCandidates,
    workItemSkillType,
    insightCount,
    config,
  };
}
