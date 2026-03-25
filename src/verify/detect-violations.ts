import { readFile } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { readLastAction } from "../state/last-action";
import { parseActionTypeFromPrompt } from "../prompts/helpers";
import { checkPermissionViolations } from "./permissions";

/**
 * Detect permission violations by the previous elf.
 * Reads last-action.md to determine the action type, then checks
 * changed files since last-reviewed-commit against that role's permissions.
 */
export async function detectPermissionViolations(repoRoot: string): Promise<string[] | undefined> {
  try {
    const lastAction = await readLastAction(repoRoot);
    if (!lastAction) return undefined;

    const actionType = parseActionTypeFromPrompt(lastAction);
    if (!actionType) return undefined;

    // Read last-reviewed-commit to get the diff range
    const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
    let lastReviewed: string;
    try {
      const raw = (await readFile(markerPath, "utf-8")).trim();
      if (!/^[0-9a-f]{7,40}$/.test(raw)) return undefined;
      lastReviewed = raw;
    } catch {
      return undefined;
    }

    // Get changed files since last review, excluding auto-commit housekeeping
    const changedFiles = getElfChangedFiles(repoRoot, lastReviewed);
    if (changedFiles.length === 0) return [];

    const violations = checkPermissionViolations(actionType, changedFiles);
    return violations;
  } catch {
    return undefined;
  }
}

const HOUSEKEEPING_PREFIX = "Auto-commit setup housekeeping";

/** Paths that are orchestration state — commits touching only these don't need review */
const STATE_PREFIX = ".shoe-makers/state/";

/**
 * Get the files changed by a single commit.
 */
function getCommitFiles(repoRoot: string, hash: string): string[] {
  const files = execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
  return files ? files.split("\n").filter(f => f.length > 0) : [];
}

/**
 * Get files changed by elf commits only, excluding auto-commit housekeeping
 * and state-file-only commits (orchestration artifacts like candidates.md,
 * work-item.md). This prevents false-positive permission violations and
 * unnecessary review cycles for planning commits.
 */
export function getElfChangedFiles(repoRoot: string, sinceCommit: string): string[] {
  const commitsRaw = execSync(
    `git log --format="%H %s" ${sinceCommit}..HEAD`,
    { cwd: repoRoot, encoding: "utf-8" }
  ).trim();

  if (!commitsRaw) return [];

  const nonHousekeepingCommits = commitsRaw
    .split("\n")
    .filter(line => {
      const subject = line.substring(line.indexOf(" ") + 1);
      return !subject.startsWith(HOUSEKEEPING_PREFIX);
    })
    .map(line => line.split(" ")[0])
    .filter(Boolean);

  if (nonHousekeepingCommits.length === 0) return [];

  // Filter out commits that only touch orchestration state files
  const elfCommitHashes = nonHousekeepingCommits.filter(hash => {
    const files = getCommitFiles(repoRoot, hash);
    return files.length === 0 || !files.every(f => f.startsWith(STATE_PREFIX));
  });

  if (elfCommitHashes.length === 0) return [];

  const changedFiles = new Set<string>();
  for (const hash of elfCommitHashes) {
    for (const f of getCommitFiles(repoRoot, hash)) {
      changedFiles.add(f);
    }
  }

  return [...changedFiles];
}
