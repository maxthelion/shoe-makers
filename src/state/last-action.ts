import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const LAST_ACTION_PATH = ".shoe-makers/state/last-action.md";

/**
 * Save the current action prompt as last-action.md.
 *
 * The reviewer uses this to know what rules the previous elf was given,
 * enabling adversarial compliance checking.
 */
export async function saveLastAction(
  repoRoot: string,
  action: string
): Promise<void> {
  const dir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(dir, { recursive: true });
  await writeFile(join(repoRoot, LAST_ACTION_PATH), action);
}

/**
 * Read the last action that was given to the previous elf.
 * Returns null if no last-action exists.
 */
export async function readLastAction(
  repoRoot: string
): Promise<string | null> {
  try {
    return await readFile(join(repoRoot, LAST_ACTION_PATH), "utf-8");
  } catch {
    return null;
  }
}
