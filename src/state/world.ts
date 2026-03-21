import { execSync } from "child_process";
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
 * Read the full world state: git info + blackboard.
 */
export async function readWorldState(repoRoot: string): Promise<WorldState> {
  const [branch, dirty, blackboard, config] = await Promise.all([
    getCurrentBranch(repoRoot),
    hasUncommittedChanges(repoRoot),
    readBlackboard(repoRoot),
    loadConfig(repoRoot),
  ]);

  return {
    branch,
    hasUncommittedChanges: dirty,
    blackboard,
    config,
  };
}
