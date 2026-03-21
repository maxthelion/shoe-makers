import { execSync } from "child_process";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { Assessment, Finding } from "../types";
import { writeAssessment } from "../state/blackboard";
import { checkInvariants } from "../verify/invariants";
import { loadConfig } from "../config/load-config";
import { getHealthResult } from "./health-scan";

/**
 * Gather recent git activity (last 10 commits, one-line).
 */
function getRecentGitActivity(repoRoot: string): string[] {
  try {
    const log = execSync("git log --oneline -10", {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

/**
 * Run `bun test` and return whether tests pass.
 */
function runTests(repoRoot: string): boolean {
  try {
    execSync("bun test", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * List open plans by scanning wiki/pages/ for files with category: plan in frontmatter.
 * Plans with status: blocked or status: done are excluded.
 */
async function findOpenPlans(repoRoot: string, wikiDir: string = "wiki"): Promise<string[]> {
  const pagesDir = join(repoRoot, wikiDir, "pages");
  const plans: string[] = [];

  try {
    const files = await readdir(pagesDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(pagesDir, file), "utf-8");
      const frontmatter = content.match(/^---[\s\S]*?---/m)?.[0] ?? "";
      // Check frontmatter for category: plan (per wiki spec: plans-vs-spec.md)
      if (!frontmatter.match(/category:\s*plan/)) continue;
      // Skip plans that are blocked or done
      if (frontmatter.match(/status:\s*(blocked|done)/)) continue;
      plans.push(file.replace(".md", ""));
    }
  } catch {
    // wiki/pages may not exist
  }

  return plans;
}

/**
 * Read all findings from .shoe-makers/findings/ directory.
 * Findings are persistent observations left by previous elves.
 */
async function readFindings(repoRoot: string): Promise<Finding[]> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  const findings: Finding[] = [];

  try {
    const files = await readdir(findingsDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(findingsDir, file), "utf-8");
      findings.push({
        id: file.replace(".md", ""),
        content,
      });
    }
  } catch {
    // .shoe-makers/findings/ may not exist
  }

  return findings;
}

/**
 * The assess skill: gather world information and write assessment.json.
 *
 * Gathers: test results, git activity, open plans, invariants pipeline,
 * findings, and octoclean health score — all in parallel.
 */
export async function assess(repoRoot: string): Promise<Assessment> {
  const config = await loadConfig(repoRoot);
  const wikiDir = config.wikiDir;

  const [testsPass, recentGitActivity, openPlans, invariants, findings, healthResult] = await Promise.all([
    runTests(repoRoot),
    getRecentGitActivity(repoRoot),
    findOpenPlans(repoRoot, wikiDir),
    checkInvariants(repoRoot, wikiDir),
    readFindings(repoRoot),
    getHealthResult(repoRoot),
  ]);

  const assessment: Assessment = {
    timestamp: new Date().toISOString(),
    invariants,
    healthScore: healthResult?.score ?? null,
    worstFiles: healthResult?.worstFiles ?? [],
    openPlans,
    findings,
    testsPass,
    recentGitActivity,
  };

  await writeAssessment(repoRoot, assessment);
  return assessment;
}
