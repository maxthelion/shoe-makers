import { writeFileSync, readFileSync } from "fs";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { buildSuggestions } from "../skills/assess";
import type { assess } from "../skills/assess";
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

export function logAssessment(assessment: Awaited<ReturnType<typeof assess>>): void {
  console.log(`[setup] Tests: ${assessment.testsPass ? "pass" : "FAIL"}`);
  if (assessment.typecheckPass !== undefined) {
    const label = assessment.typecheckPass === null ? "skipped" : assessment.typecheckPass ? "pass" : "FAIL";
    console.log(`[setup] Typecheck: ${label}`);
  }
  console.log(`[setup] Plans: ${assessment.openPlans.length}`);
  console.log(`[setup] Findings: ${assessment.findings.length}`);
  if (assessment.invariants) {
    console.log(
      `[setup] Invariants: ${assessment.invariants.specifiedOnly} specified-only, ${assessment.invariants.implementedUntested} untested, ${assessment.invariants.unspecified} unspecified`
    );
  }
  if (assessment.healthScore !== null) {
    console.log(`[setup] Health: ${assessment.healthScore}/100`);
    if (assessment.healthScore < 100 && assessment.worstFiles.length > 0) {
      const worst = assessment.worstFiles.slice(0, 3).map(f => `${f.path} (${f.score})`).join(", ");
      console.log(`[setup] Worst files: ${worst}`);
    }
  }
  if (assessment.uncertainties && assessment.uncertainties.length > 0) {
    const items = assessment.uncertainties.map(u => `${u.field} (${u.reason})`).join(", ");
    console.log(`[setup] Uncertainties: ${items}`);
  }
  const suggestions = buildSuggestions(assessment, { includeFindings: false });
  if (suggestions.length > 0) {
    console.log(`[setup] Suggestions: ${suggestions.join("; ")}`);
  }
}

export async function readInboxMessages(repoRoot: string): Promise<{ file: string; content: string }[]> {
  const inboxDir = join(repoRoot, ".shoe-makers", "inbox");
  const messages: { file: string; content: string }[] = [];
  try {
    const files = await readdir(inboxDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(inboxDir, file), "utf-8");
      messages.push({ file, content });
    }
  } catch {}
  return messages;
}
