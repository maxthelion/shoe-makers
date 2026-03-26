import { assess, archiveResolvedFindings } from "./skills/assess";
import { evaluateWithTrace, formatTrace } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { readLastAction, saveLastAction } from "./state/last-action";
import { parseActionTypeFromPrompt } from "./prompts/helpers";
import type { WorldState, Config } from "./types";
import { isWithinWorkingHours } from "./schedule";
import { loadSkills, type SkillDefinition } from "./skills/registry";
import { loadConfig } from "./config/load-config";
import { readBlackboard } from "./state/blackboard";
import { checkHealthRegression } from "./verify/health-regression";
import { fetchArticleForAction } from "./creative/wikipedia";
import { archiveConsumedStateFiles } from "./archive/state-archive";
import { gatherCritiqueContext } from "./setup/critique-context";
import { detectPermissionViolations } from "./verify/detect-violations";
import { writePermissionViolationFinding } from "./verify/violation-findings";
import { runVerificationGate } from "./scheduler/verification-gate";

// Import from focused modules
import { ensureBranch } from "./setup/branch";
import { buildWorldState } from "./setup/world-state";
import { formatAction, readWikiOverview, readNotes } from "./setup/format-action";
import { autoCommitHousekeeping, isAllHousekeeping, HOUSEKEEPING_PATHS, logAssessment, readInboxMessages } from "./setup/housekeeping";

// Re-export for backward compatibility (used by tests and other modules)
export { formatAction, readWikiOverview, readNotes } from "./setup/format-action";
export { autoCommitHousekeeping, isAllHousekeeping, HOUSEKEEPING_PATHS, logAssessment, readInboxMessages } from "./setup/housekeeping";

async function main() {
  const repoRoot = process.cwd();

  if (!(await handleWorkingHoursCheck(repoRoot))) return;

  // 1. Load config early so branchPrefix is available for branch setup
  const config = await loadConfig(repoRoot);

  // 2. Branch setup
  const branchName = ensureBranch(repoRoot, config.branchPrefix);

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
  // Archive resolved findings, auto-commit, then run assessment
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
  // Read inbox messages
  const inboxMessages = await readInboxMessages(repoRoot);

  // Build world state for tree evaluation
  const state = await buildWorldState(repoRoot, branchName, assessment, inboxMessages.length, config);

  // Load skills (filtered by enabledSkills config) and evaluate the tree
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

  // Detect permission violations and gather structured context for critique actions
  const permissionViolations = skill === "critique"
    ? await detectPermissionViolations(repoRoot)
    : undefined;
  const critiqueContext = skill === "critique"
    ? await gatherCritiqueContext(repoRoot, prevActionRaw ?? undefined, permissionViolations)
    : undefined;

  // Write a structured finding if permission violations were detected
  if (permissionViolations && permissionViolations.length > 0) {
    const findingFile = await writePermissionViolationFinding(repoRoot, permissionViolations);
    if (findingFile) {
      console.log(`[setup] Permission violation finding written: ${findingFile}`);
    }
  }

  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });

  // Archive state files that will be consumed by this action
  if (skill) {
    const archivedState = await archiveConsumedStateFiles(repoRoot, skill);
    if (archivedState.length > 0) {
      console.log(`[setup] Archived ${archivedState.length} state file(s) for traceability`);
    }
  }

  const elfNotes = await readNotes(repoRoot);
  const action = formatAction(skill, state, inboxMessages, loadedSkills, article, permissionViolations, wikiSummary, critiqueContext, elfNotes);

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

if (import.meta.main) {
  main().catch((err) => {
    console.error("[setup] Fatal error:", err);
    process.exit(1);
  });
}
