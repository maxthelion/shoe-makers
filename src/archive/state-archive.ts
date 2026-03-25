import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ARCHIVE_DIR = ".shoe-makers/archive/state";
const STATE_DIR = ".shoe-makers/state";

/** State files that can be consumed by elf actions */
const CONSUMABLE_FILES: Record<string, string[]> = {
  "execute-work-item": ["work-item.md"],
  "dead-code": ["work-item.md"],
  "continue-work": ["partial-work.md"],
  "prioritise": ["candidates.md"],
};

/**
 * Archive state files that are about to be consumed by the given action.
 *
 * Called before writing the next-action prompt. Since state files are
 * gitignored, we archive them proactively when we know which action
 * will consume them.
 *
 * Returns the list of archived file names (for logging).
 */
export async function archiveConsumedStateFiles(
  repoRoot: string,
  action: string,
): Promise<string[]> {
  const filesToArchive = CONSUMABLE_FILES[action];
  if (!filesToArchive) return [];

  const archived: string[] = [];
  const archiveDir = join(repoRoot, ARCHIVE_DIR);

  for (const file of filesToArchive) {
    const sourcePath = join(repoRoot, STATE_DIR, file);
    try {
      const content = await readFile(sourcePath, "utf-8");
      await mkdir(archiveDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const baseName = file.replace(".md", "");
      const archiveName = `${baseName}-${timestamp}.md`;
      await writeFile(join(archiveDir, archiveName), content);
      archived.push(archiveName);
    } catch {
      // File doesn't exist — nothing to archive
    }
  }

  return archived;
}
