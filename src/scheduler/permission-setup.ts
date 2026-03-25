import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { readLastAction } from "../state/last-action";
import { parseActionTypeFromPrompt } from "../prompts/helpers";
import { detectPermissionViolations } from "../verify/detect-violations";
import { writePermissionViolationFinding } from "../verify/violation-findings";

/**
 * Snapshot the previous action type and detect permission violations.
 *
 * Writes previous-action-type file for critique detection, then
 * runs violation detection if the current skill is "critique".
 * Returns any violations found (or undefined).
 */
export async function setupPermissionContext(
  repoRoot: string,
  skill: string | null,
): Promise<string[] | undefined> {
  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });

  const previousAction = await readLastAction(repoRoot);
  if (previousAction) {
    const prevType = parseActionTypeFromPrompt(previousAction);
    if (prevType) {
      await writeFile(join(stateDir, "previous-action-type"), prevType);
    }
  }

  if (skill !== "critique") return undefined;

  const permissionViolations = await detectPermissionViolations(repoRoot);

  if (permissionViolations && permissionViolations.length > 0) {
    const findingFile = await writePermissionViolationFinding(repoRoot, permissionViolations);
    if (findingFile) {
      console.log(`[setup] Permission violation finding written: ${findingFile}`);
    }
  }

  return permissionViolations;
}
