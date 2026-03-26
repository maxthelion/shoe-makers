import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ALL_HOUSEKEEPING_PATHS } from "../utils/housekeeping";

/** Paths considered housekeeping (archive moves, shift log entries) */
export const HOUSEKEEPING_PATHS = ALL_HOUSEKEEPING_PATHS;

/**
 * Check if all lines from `git status --porcelain` output are housekeeping changes.
 * Returns true if every changed file is under a housekeeping path.
 */
export function isAllHousekeeping(statusOutput: string): boolean {
  const lines = statusOutput.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return false;
  return lines.every(line => {
    // git status --porcelain format: XY filename (or XY old -> new for renames)
    const path = line.slice(3).split(" -> ").pop()!;
    return HOUSEKEEPING_PATHS.some(p => path.startsWith(p));
  });
}

/**
 * Auto-commit housekeeping changes (archive moves, shift log entries)
 * and update the review marker so they don't trigger the critique cycle.
 *
 * Only commits if ALL uncommitted changes are in housekeeping paths.
 * If there are mixed changes (e.g., findings + code), does nothing.
 */
export function autoCommitHousekeeping(repoRoot: string): void {
  try {
    const status = execSync("git status --porcelain", {
      cwd: repoRoot,
      encoding: "utf-8",
    });

    if (!isAllHousekeeping(status)) return;

    // Read the current review marker BEFORE committing
    const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
    let previousMarker: string | null = null;
    try {
      previousMarker = readFileSync(markerPath, "utf-8").trim();
    } catch {}

    // Stage all housekeeping changes
    for (const prefix of HOUSEKEEPING_PATHS) {
      execSync(`git add "${prefix}"`, { cwd: repoRoot, stdio: "pipe" });
    }

    execSync('git commit -m "Auto-commit setup housekeeping (archive, shift log)"', {
      cwd: repoRoot,
      stdio: "pipe",
    });

    const head = execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();

    // Only advance the marker if the auto-commit is the ONLY unreviewed commit.
    // This prevents skipping review of code commits made between the old marker
    // and the auto-commit.
    const parentOfHead = execSync("git rev-parse HEAD~1", {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();

    if (previousMarker === parentOfHead) {
      writeFileSync(markerPath, head);
    }

    console.log("[setup] Auto-committed housekeeping changes");
  } catch {
    // If anything fails, just skip — the elf will handle it
  }
}
