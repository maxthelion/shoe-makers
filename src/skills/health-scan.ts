import { execSync } from "child_process";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export interface HealthResult {
  score: number;
  worstFiles: { path: string; score: number }[];
}

const OCTOCLEAN_CLI = "node_modules/octoclean/src/cli/index.ts";

/**
 * Check whether octoclean is installed (its CLI entry point exists).
 */
export function isOctocleanInstalled(repoRoot: string): boolean {
  return existsSync(join(repoRoot, OCTOCLEAN_CLI));
}

/**
 * Run octoclean's codehealth scan and return the health score (0–100)
 * plus the worst files by health score.
 * Returns null if octoclean is not installed or the scan fails.
 */
export async function getHealthResult(repoRoot: string, timeout: number = 120_000): Promise<HealthResult | null> {
  if (!isOctocleanInstalled(repoRoot)) return null;

  const outputPath = join(tmpdir(), `codehealth-${Date.now()}.json`);

  try {
    execSync(
      `bun run ${OCTOCLEAN_CLI} scan --no-llm --no-dynamic --output ${outputPath}`,
      { cwd: repoRoot, stdio: "pipe", timeout }
    );

    const raw = await readFile(outputPath, "utf-8");
    return parseHealthSnapshot(raw);
  } catch {
    return null;
  }
}

/**
 * Parse an octoclean snapshot JSON string into a HealthResult.
 * Returns null if the JSON is invalid or missing required fields.
 */
export function parseHealthSnapshot(raw: string): HealthResult | null {
  try {
    const snapshot = JSON.parse(raw);
    const score = snapshot?.summary?.health_score;

    if (typeof score !== "number") return null;

    const files: { path: string; score: number }[] = [];
    if (Array.isArray(snapshot.files)) {
      for (const f of snapshot.files) {
        if (f.path && typeof f.health_score === "number") {
          files.push({ path: f.path, score: Math.round(f.health_score * 100) });
        }
      }
    }

    files.sort((a, b) => a.score - b.score);

    return {
      score: Math.round(score * 100),
      worstFiles: files.slice(0, 5),
    };
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper that returns just the score for backward compatibility.
 */
export async function getHealthScore(repoRoot: string): Promise<number | null> {
  const result = await getHealthResult(repoRoot);
  return result?.score ?? null;
}
