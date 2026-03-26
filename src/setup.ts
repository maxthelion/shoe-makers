import { assess, archiveResolvedFindings } from "./skills/assess";
import { evaluateWithTrace, formatTrace } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { readLastAction, saveLastAction } from "./state/last-action";
import { parseActionTypeFromPrompt } from "./prompts/helpers";
import type { WorldState } from "./types";
import { detectPermissionViolations } from "./verify/detect-violations";
import { writePermissionViolationFinding } from "./verify/violation-findings";
import { isWithinWorkingHours } from "./schedule";
import { loadSkills } from "./skills/registry";
import { loadConfig } from "./config/load-config";
import { readBlackboard } from "./state/blackboard";
import { checkHealthRegression } from "./verify/health-regression";
import { fetchArticleForAction } from "./creative/wikipedia";
import { archiveConsumedStateFiles } from "./archive/state-archive";
import { gatherCritiqueContext } from "./setup/critique-context";

// Import from focused modules
import { ensureBranch } from "./setup/branch";
import { buildWorldState } from "./setup/world-state";
import { formatAction, readWikiOverview } from "./setup/format-action";
import { autoCommitHousekeeping, isAllHousekeeping, HOUSEKEEPING_PATHS, logAssessment, readInboxMessages } from "./setup/housekeeping";

// Re-export for backward compatibility (used by tests and other modules)
export { formatAction, readWikiOverview } from "./setup/format-action";
export { autoCommitHousekeeping, isAllHousekeeping, HOUSEKEEPING_PATHS, logAssessment, readInboxMessages } from "./setup/housekeeping";

/**
 * Setup script: runs before the elf starts.
 *
 * 1. Ensure we're on today's shoemakers branch
 * 2. Run assessment (deterministic — gathers world state)
 * 3. Evaluate the behaviour tree
 * 4. Write a focused prompt to .shoe-makers/state/next-action.md
 *
 * The elf then just reads next-action.md and does what it says.
 */
async function main() {
  const repoRoot = process.cwd();

  // 0. Check working hours (uses shared schedule module)
  if (!isWithinWorkingHours(repoRoot)) {
    console.log("[setup] Outside working hours. Exiting.");
    const stateDir = join(repoRoot, ".shoe-makers", "state");
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      join(stateDir, "next-action.md"),
      "# Outside Working Hours\n\nThe shoemakers are sleeping. Do nothing. Exit immediately.\n"
    );
    return;
  }

  // 1. Branch setup
  const branchName = ensureBranch(repoRoot);

  // 2. Archive resolved findings, auto-commit, then run assessment
  const archived = await archiveResolvedFindings(repoRoot);
  if (archived.length > 0) {
    console.log(`[setup] Archived ${archived.length} resolved finding(s)`);
    // Auto-commit archive changes BEFORE tree evaluation so they don't
    // appear as uncommitted work in the world state
    autoCommitHousekeeping(repoRoot);
  }

  console.log("[setup] Running assessment...");
  const previousBlackboard = await readBlackboard(repoRoot);
  const healthBefore = previousBlackboard.assessment?.healthScore ?? null;
  const assessment = await assess(repoRoot);
  const healthAfter = assessment.healthScore;
  const healthRegression = checkHealthRegression(healthBefore, healthAfter);
  if (healthRegression) {
    console.warn(`[setup] WARNING: ${healthRegression}`);
  }
  logAssessment(assessment);

  // 3. Read inbox messages
  const inboxMessages = await readInboxMessages(repoRoot);

  // 4. Load config and build world state for tree evaluation
  const config = await loadConfig(repoRoot);
  console.log(`[setup] Config: tick every ${config.tickInterval}m, max ${config.maxTicksPerShift} ticks/shift`);
  const state = await buildWorldState(repoRoot, branchName, assessment, inboxMessages.length, config);

  // 5. Load skills (filtered by enabledSkills config) and evaluate the tree
  const loadedSkills = await loadSkills(repoRoot, config.enabledSkills);
  const { skill, trace } = evaluateWithTrace(defaultTree, state);

  // Annotate trace entries with uncertainty info when relevant
  const uncertainties = assessment.uncertainties ?? [];
  if (uncertainties.length > 0) {
    for (const entry of trace) {
      if (!entry.passed && entry.condition === "tests-failing") {
        const fields = uncertainties.map(u => u.field).join(", ");
        entry.note = `${uncertainties.length} unknown${uncertainties.length > 1 ? "s" : ""}: ${fields}`;
      }
    }
  }

  if (trace.length > 0) {
    console.log(`[setup] Tree trace:\n${formatTrace(trace)}`);
  }

  // Fetch a Wikipedia article for creative exploration
  const article = await fetchArticleForAction(
    skill,
    config.insightFrequency,
    (entry) => appendToShiftLog(repoRoot, entry),
  );

  // Read wiki overview for innovate action
  let wikiSummary: string | undefined;
  if (skill === "innovate") {
    wikiSummary = await readWikiOverview(repoRoot, config.wikiDir);
  }

  // Snapshot the previous action type before detection reads it.
  // This must happen BEFORE detectPermissionViolations so it reads
  // the action that was actually issued to the previous elf.
  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });
  const previousAction = await readLastAction(repoRoot);
  if (previousAction) {
    const prevType = parseActionTypeFromPrompt(previousAction);
    if (prevType) {
      await writeFile(join(stateDir, "previous-action-type"), prevType);
    }
  }

  // Detect permission violations and gather structured context for critique actions
  const permissionViolations = skill === "critique"
    ? await detectPermissionViolations(repoRoot)
    : undefined;
  const critiqueContext = skill === "critique"
    ? await gatherCritiqueContext(repoRoot, previousAction ?? undefined, permissionViolations)
    : undefined;

  // Write a structured finding if permission violations were detected
  if (permissionViolations && permissionViolations.length > 0) {
    const findingFile = await writePermissionViolationFinding(repoRoot, permissionViolations);
    if (findingFile) {
      console.log(`[setup] Permission violation finding written: ${findingFile}`);
    }
  }

  // Archive state files that will be consumed by this action
  if (skill) {
    const archivedState = await archiveConsumedStateFiles(repoRoot, skill);
    if (archivedState.length > 0) {
      console.log(`[setup] Archived ${archivedState.length} state file(s) for traceability`);
    }
  }

  const action = formatAction(skill, state, inboxMessages, loadedSkills, article, permissionViolations, wikiSummary, critiqueContext);

  await writeFile(join(stateDir, "next-action.md"), action);
  await saveLastAction(repoRoot, action);
  console.log(`[setup] Wrote action to ${join(stateDir, "next-action.md")}`);

  const actionTitle = action.split("\n")[0].replace("# ", "");
  await appendToShiftLog(
    repoRoot,
    `## ${new Date().toISOString()} — Setup\n\n- Action: ${actionTitle}\n`
  );

  // Auto-commit housekeeping changes (archive, shift log) so they don't
  // trigger review cycles — these are mechanical, not elf-authored
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
