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

    // Get changed files since last review
    const changedFilesRaw = execSync(`git diff --name-only ${lastReviewed}..HEAD`, {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();

    if (!changedFilesRaw) return [];

    const changedFiles = changedFilesRaw.split("\n").filter(f => f.length > 0);
    const violations = checkPermissionViolations(actionType, changedFiles);
    return violations;
  } catch {
    return undefined;
  }
}
