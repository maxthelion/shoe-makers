import { execSync } from "child_process";
import { readdir, readFile, rename, mkdir, stat } from "fs/promises";
import { join } from "path";
import type { Assessment, Finding } from "../types";
import { RESOLVED_PATTERN } from "../state/world";
import { writeAssessment } from "../state/blackboard";
import { checkInvariants } from "../verify/invariants";
import { loadConfig } from "../config/load-config";
import { getHealthResult, isOctocleanInstalled } from "./health-scan";
import { getShiftProcessPatterns } from "../log/shift-log-parser";
import { parseFrontmatter, getFrontmatterField } from "../utils/frontmatter";

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
export function runTests(repoRoot: string): boolean {
  try {
    execSync("bun test", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run `tsc --noEmit` and return whether TypeScript compilation passes.
 * Returns undefined if the type checker can't run (e.g. missing type definitions).
 */
function runTypecheck(repoRoot: string): boolean | undefined {
  try {
    execSync("tsc --noEmit", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch (err: unknown) {
    const e = err as { stderr?: unknown; stdout?: unknown };
    const output = String(e?.stderr ?? "") + String(e?.stdout ?? "");
    // If the failure is due to missing type definitions (e.g. bun-types not installed),
    // treat as "unable to check" rather than "code has type errors"
    if (output.includes("Cannot find type definition file")) return undefined;
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
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      // Check frontmatter for category: plan (per wiki spec: plans-vs-spec.md)
      if (getFrontmatterField(parsed.frontmatter, "category") !== "plan") continue;
      // Skip plans that are blocked or done
      const status = getFrontmatterField(parsed.frontmatter, "status");
      if (status === "blocked" || status === "done") continue;
      plans.push(file.replace(".md", ""));
    }
  } catch {
    // wiki/pages may not exist
  }

  return plans;
}

/**
 * Archive resolved findings by moving them from findings/ to findings/archive/.
 * Returns the list of archived file names.
 */
export async function archiveResolvedFindings(repoRoot: string): Promise<string[]> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  const archiveDir = join(findingsDir, "archive");
  const archived: string[] = [];

  try {
    const files = await readdir(findingsDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const filePath = join(findingsDir, file);
      const content = await readFile(filePath, "utf-8");
      const isResolved = RESOLVED_PATTERN.test(content);

      // Auto-archive note-type findings older than 24 hours
      let isExpiredNote = false;
      if (!isResolved && file.startsWith("note-")) {
        const fileStat = await stat(filePath);
        const ageMs = Date.now() - fileStat.mtimeMs;
        isExpiredNote = ageMs > 24 * 60 * 60 * 1000;
      }

      if (isResolved || isExpiredNote) {
        await mkdir(archiveDir, { recursive: true });
        await rename(filePath, join(archiveDir, file));
        archived.push(file);
      }
    }
  } catch {
    // findings directory may not exist
  }

  return archived;
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
 * Build actionable suggestions from assessment data.
 * Used by setup, index, and shift to surface work opportunities.
 */
export function buildSuggestions(
  assessment: Assessment | null,
  options?: { includeFindings?: boolean }
): string[] {
  const suggestions: string[] = [];
  if (!assessment) return suggestions;
  if (assessment.invariants) {
    const { specifiedOnly, implementedUntested } = assessment.invariants;
    if (specifiedOnly > 0) suggestions.push(`${specifiedOnly} specified-only invariants need implementation`);
    if (implementedUntested > 0) suggestions.push(`${implementedUntested} implemented features need tests`);
  }
  if (assessment.openPlans.length > 0) suggestions.push(`${assessment.openPlans.length} open plan(s) to work on`);
  if (options?.includeFindings !== false && assessment.findings.length > 0) {
    suggestions.push(`${assessment.findings.length} finding(s) to review`);
  }
  return suggestions;
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

  const [testsPass, typecheckPass, recentGitActivity, openPlans, invariants, findings, healthResult, processPatterns] = await Promise.all([
    runTests(repoRoot),
    runTypecheck(repoRoot),
    getRecentGitActivity(repoRoot),
    findOpenPlans(repoRoot, wikiDir),
    checkInvariants(repoRoot, wikiDir),
    readFindings(repoRoot),
    getHealthResult(repoRoot),
    getShiftProcessPatterns(repoRoot),
  ]);

  // Track fields that couldn't be checked
  const uncertainties: { field: string; reason: string }[] = [];
  if (typecheckPass === undefined) {
    uncertainties.push({ field: "typecheckPass", reason: "missing type definitions (bun-types)" });
  }
  if (healthResult === null && !isOctocleanInstalled(repoRoot)) {
    uncertainties.push({ field: "healthScore", reason: "octoclean not installed" });
  }

  const assessment: Assessment = {
    timestamp: new Date().toISOString(),
    invariants,
    healthScore: healthResult?.score ?? null,
    worstFiles: healthResult?.worstFiles ?? [],
    openPlans,
    findings,
    testsPass,
    typecheckPass,
    recentGitActivity,
    processPatterns,
    ...(uncertainties.length > 0 ? { uncertainties } : {}),
  };

  await writeAssessment(repoRoot, assessment);
  return assessment;
}
