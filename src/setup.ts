import { assess, buildSuggestions, archiveResolvedFindings } from "./skills/assess";
import { evaluateWithTrace, formatTrace } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { readLastAction, saveLastAction } from "./state/last-action";
import { parseActionTypeFromPrompt, findValidationPatterns } from "./prompts/helpers";
import { checkUnreviewedCommits, countUnresolvedCritiques, hasUncommittedChanges, checkHasWorkItem, checkHasCandidates, readWorkItemSkillType, countInsights, checkHasPartialWork } from "./state/world";
import { execSync } from "child_process";
import type { WorldState, Blackboard, Config } from "./types";
import { isWithinWorkingHours, getShiftDate } from "./schedule";
import { loadSkills, type SkillDefinition } from "./skills/registry";
import { loadConfig } from "./config/load-config";
import { readBlackboard } from "./state/blackboard";
import { checkHealthRegression } from "./verify/health-regression";
import { fetchArticleForAction } from "./creative/wikipedia";
import { archiveConsumedStateFiles } from "./archive/state-archive";
import { autoCommitHousekeeping } from "./scheduler/housekeeping";
import { runVerificationGate } from "./scheduler/verification-gate";
import { setupPermissionContext } from "./scheduler/permission-setup";
import { formatAction, readWikiOverview } from "./scheduler/format-action";

// Re-export for backward compatibility (tests import from setup.ts)
export { formatAction, readWikiOverview } from "./scheduler/format-action";

async function main() {
  const repoRoot = process.cwd();

  if (!(await handleWorkingHoursCheck(repoRoot))) return;

  const branchName = ensureBranch(repoRoot);
  const config = await loadConfig(repoRoot);
  console.log(`[setup] Config: tick every ${config.tickInterval}m, max ${config.maxTicksPerShift} ticks/shift`);

  const { assessment, prevActionRaw } = await runAssessmentPhase(repoRoot, config);

  const { skill, trace, state, inboxMessages, loadedSkills } =
    await evaluateTreePhase(repoRoot, branchName, assessment, config);

  if (trace.length > 0) {
    console.log(`[setup] Tree trace:\n${formatTrace(trace)}`);
  }

  await writeActionAndLog(repoRoot, skill, state, inboxMessages, loadedSkills, config, prevActionRaw, assessment);
}

async function handleWorkingHoursCheck(repoRoot: string): Promise<boolean> {
  if (isWithinWorkingHours(repoRoot)) return true;

  console.log("[setup] Outside working hours. Exiting.");
  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });
  await writeFile(
    join(stateDir, "next-action.md"),
    "# Outside Working Hours\n\nThe shoemakers are sleeping. Do nothing. Exit immediately.\n"
  );
  return false;
}

async function runAssessmentPhase(repoRoot: string, config: Config) {
  const archived = await archiveResolvedFindings(repoRoot);
  if (archived.length > 0) {
    console.log(`[setup] Archived ${archived.length} resolved finding(s)`);
    autoCommitHousekeeping(repoRoot);
  }

  console.log("[setup] Running assessment...");
  const previousBlackboard = await readBlackboard(repoRoot);
  const healthBefore = previousBlackboard.assessment?.healthScore ?? null;
  const assessment = await assess(repoRoot);
  const healthRegression = checkHealthRegression(healthBefore, assessment.healthScore, config.healthRegressionThreshold);
  if (healthRegression) {
    console.warn(`[setup] WARNING: ${healthRegression}`);
  }

  const prevActionRaw = await readLastAction(repoRoot);
  const prevActionType = prevActionRaw ? parseActionTypeFromPrompt(prevActionRaw) : null;
  await runVerificationGate(repoRoot, assessment.testsPass ?? true, prevActionType, healthRegression);

  logAssessment(assessment);
  return { assessment, prevActionRaw };
}

async function evaluateTreePhase(
  repoRoot: string, branchName: string,
  assessment: Awaited<ReturnType<typeof assess>>, config: Config,
) {
  const inboxMessages = await readInboxMessages(repoRoot);
  const state = await buildWorldState(repoRoot, branchName, assessment, inboxMessages.length, config);
  const loadedSkills = await loadSkills(repoRoot, config.enabledSkills);
  const { skill, trace } = evaluateWithTrace(defaultTree, state);

  const uncertainties = assessment.uncertainties ?? [];
  if (uncertainties.length > 0) {
    for (const entry of trace) {
      if (!entry.passed && entry.condition === "tests-failing") {
        const fields = uncertainties.map(u => u.field).join(", ");
        entry.note = `${uncertainties.length} unknown${uncertainties.length > 1 ? "s" : ""}: ${fields}`;
      }
    }
  }

  return { skill, trace, state, inboxMessages, loadedSkills };
}

async function writeActionAndLog(
  repoRoot: string, skill: string | null, state: WorldState,
  inboxMessages: { file: string; content: string }[], loadedSkills: Map<string, SkillDefinition>,
  config: Config, prevActionRaw: string | null, assessment: Awaited<ReturnType<typeof assess>>,
) {
  const article = await fetchArticleForAction(
    skill,
    config.insightFrequency,
    (entry) => appendToShiftLog(repoRoot, entry),
    repoRoot,
  );

  let wikiSummary: string | undefined;
  if (skill === "innovate") {
    wikiSummary = await readWikiOverview(repoRoot, config.wikiDir);
  }

  const permissionViolations = await setupPermissionContext(repoRoot, skill);

  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });

  if (skill) {
    const archivedState = await archiveConsumedStateFiles(repoRoot, skill);
    if (archivedState.length > 0) {
      console.log(`[setup] Archived ${archivedState.length} state file(s) for traceability`);
    }
  }

  const validationPatterns = (skill === "critique" && loadedSkills)
    ? findValidationPatterns(prevActionRaw, loadedSkills)
    : undefined;

  const action = formatAction(skill, state, inboxMessages, loadedSkills, article, permissionViolations, wikiSummary, validationPatterns);

  await writeFile(join(stateDir, "next-action.md"), action);
  await saveLastAction(repoRoot, action);
  console.log(`[setup] Wrote action to ${join(stateDir, "next-action.md")}`);

  const actionTitle = action.split("\n")[0].replace("# ", "");
  await appendToShiftLog(
    repoRoot,
    `## ${new Date().toISOString()} — Setup\n\n- Action: ${actionTitle}\n`
  );

  autoCommitHousekeeping(repoRoot);

  console.log(`[setup] Action: ${actionTitle}`);
  console.log("[setup] Done. The elf should read .shoe-makers/state/next-action.md");
}


function ensureBranch(repoRoot: string): string {
  const shiftDate = getShiftDate(repoRoot); // uses shared schedule module
  const branchName = `shoemakers/${shiftDate}`;

  try {
    execSync("git fetch origin", { cwd: repoRoot, stdio: "pipe" });
  } catch {}

  const currentBranch = execSync("git branch --show-current", {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();

  if (currentBranch !== branchName) {
    checkoutOrCreateBranch(repoRoot, branchName);
  }

  return branchName;
}

function checkoutOrCreateBranch(repoRoot: string, branchName: string): void {
  try {
    execSync(`git rev-parse --verify origin/${branchName}`, { cwd: repoRoot, stdio: "pipe" });
    try {
      execSync(`git checkout ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
      execSync(`git pull`, { cwd: repoRoot, stdio: "pipe" });
    } catch {
      execSync(`git checkout -b ${branchName} origin/${branchName}`, { cwd: repoRoot, stdio: "pipe" });
    }
  } catch {
    execSync(`git checkout -b ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
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

async function buildWorldState(
  repoRoot: string,
  branchName: string,
  assessment: Awaited<ReturnType<typeof assess>>,
  inboxCount: number,
  config: Config,
): Promise<WorldState> {
  const [uncommitted, hasUnreviewedCommits, unresolvedCritiqueCount, hasWorkItem, hasCandidates, workItemSkillType, insightCount, hasPartialWork] = await Promise.all([
    hasUncommittedChanges(repoRoot),
    checkUnreviewedCommits(repoRoot),
    countUnresolvedCritiques(repoRoot),
    checkHasWorkItem(repoRoot),
    checkHasCandidates(repoRoot),
    readWorkItemSkillType(repoRoot),
    countInsights(repoRoot),
    checkHasPartialWork(repoRoot),
  ]);

  const blackboard: Blackboard = {
    assessment,
    currentTask: null,
  };

  return {
    branch: branchName,
    hasUncommittedChanges: uncommitted,
    inboxCount,
    hasUnreviewedCommits,
    unresolvedCritiqueCount,
    hasWorkItem,
    hasCandidates,
    workItemSkillType,
    hasPartialWork,
    insightCount,
    blackboard,
    config,
  };
}


if (import.meta.main) {
  main().catch((err) => {
    console.error("[setup] Fatal error:", err);
    process.exit(1);
  });
}
