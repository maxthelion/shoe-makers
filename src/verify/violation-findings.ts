import { writeFile, readdir, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { RESOLVED_PATTERN } from "../state/world";

/**
 * Write a structured finding file when permission violations are detected.
 *
 * Uses the `critique-` prefix so the tree's `unresolved-critiques` condition
 * catches it — a permission violation IS a blocking critique.
 *
 * Deduplicates: won't write a new finding if an unresolved permission violation
 * finding already exists.
 */
export async function writePermissionViolationFinding(
  repoRoot: string,
  violations: string[],
): Promise<string | null> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  await mkdir(findingsDir, { recursive: true });

  // Deduplication: check for existing unresolved permission violation findings
  try {
    const files = await readdir(findingsDir);
    for (const file of files) {
      if (!file.startsWith("critique-") || !file.includes("permission-violation")) continue;
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(findingsDir, file), "utf-8");
      if (!RESOLVED_PATTERN.test(content)) {
        // An unresolved permission violation finding already exists
        return null;
      }
    }
  } catch {
    // findings dir may not exist yet — that's fine
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `critique-${date}-permission-violation.md`;
  const filepath = join(findingsDir, filename);

  const content =
    `# Permission Violation Detected\n\n` +
    `The previous elf modified files outside their permitted scope:\n\n` +
    violations.map((f) => `- \`${f}\``).join("\n") +
    `\n\n` +
    `This was detected automatically by the setup script. ` +
    `The fix-critique elf should investigate whether these changes are legitimate ` +
    `and either revert them or explain why they were necessary.\n`;

  await writeFile(filepath, content);
  return filename;
}
