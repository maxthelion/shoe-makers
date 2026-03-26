import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import type { CritiqueContext } from "../prompts/critique";

const MAX_DIFF_CHARS = 8000;

export async function gatherCritiqueContext(
  repoRoot: string,
  lastAction?: string,
  permissionViolations?: string[],
): Promise<CritiqueContext | undefined> {
  // Read last-reviewed-commit
  const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
  let lastReviewed: string;
  try {
    const raw = (await readFile(markerPath, "utf-8")).trim();
    if (!/^[0-9a-f]{7,40}$/.test(raw)) return undefined;
    lastReviewed = raw;
  } catch {
    return undefined;
  }

  const commitRange = `${lastReviewed}..HEAD`;

  // Gather git log and diff
  let commitLog: string;
  let diff: string;
  try {
    commitLog = execSync(`git log ${commitRange} --oneline`, {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const fullDiff = execSync(`git diff ${commitRange}`, {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (fullDiff.length > MAX_DIFF_CHARS) {
      diff = fullDiff.slice(0, MAX_DIFF_CHARS) + `\n\n... [truncated — ${fullDiff.length} chars total, showing first ${MAX_DIFF_CHARS}]`;
    } else {
      diff = fullDiff;
    }
  } catch {
    return undefined;
  }

  // Auto-number the critique filename
  const critiqueFilename = await nextCritiqueFilename(repoRoot);

  return {
    commitRange,
    commitLog,
    diff,
    lastAction: lastAction ?? "(no previous action recorded)",
    critiqueFilename,
    permissionViolations,
  };
}

export async function nextCritiqueFilename(repoRoot: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const prefix = `critique-${today}-`;
  let maxNum = 0;

  // Check both findings/ and findings/archive/
  for (const dir of [".shoe-makers/findings", ".shoe-makers/findings/archive"]) {
    try {
      const files = await readdir(join(repoRoot, dir));
      for (const f of files) {
        if (f.startsWith(prefix) && f.endsWith(".md")) {
          const num = parseInt(f.slice(prefix.length, -3), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    } catch {
      // Directory doesn't exist — skip
    }
  }

  const nnn = String(maxNum + 1).padStart(3, "0");
  return `${prefix}${nnn}.md`;
}
