import { assess, buildSuggestions, archiveResolvedFindings } from "./skills/assess";
import { evaluateWithTrace, formatTrace } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { generatePrompt } from "./prompts";
import { readLastAction, saveLastAction } from "./state/last-action";
import { parseActionTypeFromPrompt, ACTION_TO_SKILL_TYPE } from "./prompts/helpers";
import { checkUnreviewedCommits, countUnresolvedCritiques, hasUncommittedChanges, checkHasWorkItem, checkHasCandidates, readWorkItemSkillType, countInsights, checkHasPartialWork } from "./state/world";
import { execSync } from "child_process";
import type { WorldState, Blackboard, ActionType, Config } from "./types";
import { detectPermissionViolations } from "./verify/detect-violations";
import { writePermissionViolationFinding } from "./verify/violation-findings";
import { isWithinWorkingHours, getShiftDate } from "./schedule";
import { loadSkills, type SkillDefinition } from "./skills/registry";
import { loadConfig } from "./config/load-config";
import { readBlackboard } from "./state/blackboard";
import { checkHealthRegression } from "./verify/health-regression";
import { verify as commitOrRevert } from "./verify/commit-or-revert";
import { fetchArticleForAction } from "./creative/wikipedia";
import { archiveConsumedStateFiles } from "./archive/state-archive";
import { autoCommitHousekeeping, isAllHousekeeping, HOUSEKEEPING_PATHS } from "./scheduler/housekeeping";

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

  // Verification gate: revert the elf's last commit if tests fail or health regresses.
  // Only applies to work actions (not orchestration like explore/prioritise).
  const WORK_ACTIONS: ActionType[] = ["execute-work-item", "fix-tests", "fix-critique", "dead-code", "continue-work", "inbox"];
  const prevActionRaw = await readLastAction(repoRoot);
  const prevActionType = prevActionRaw ? parseActionTypeFromPrompt(prevActionRaw) : null;
  if (prevActionType && WORK_ACTIONS.includes(prevActionType)) {
    const gate = commitOrRevert(assessment.testsPass, healthRegression);
    if (gate.decision === "revert") {
      console.warn(`[setup] Verification gate: reverting last commit (${gate.reason})`);
      try {
        execSync("git revert --no-edit HEAD", { cwd: repoRoot, stdio: "pipe" });
        await appendToShiftLog(repoRoot, `## ${new Date().toISOString()} — Verification Gate\n\n- Reverted last commit: ${gate.reason}\n`);
      } catch (e) {
        console.warn("[setup] Revert failed — manual intervention may be needed");
      }
    }
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
    repoRoot,
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

  // Detect permission violations for critique actions
  const permissionViolations = skill === "critique"
    ? await detectPermissionViolations(repoRoot)
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

  // Look up validation patterns for critique actions
  let validationPatterns: string[] | undefined;
  if (skill === "critique" && loadedSkills && previousAction) {
    const prevType = parseActionTypeFromPrompt(previousAction);
    if (prevType) {
      const prevSkillType = ACTION_TO_SKILL_TYPE[prevType];
      if (prevSkillType) {
        for (const s of loadedSkills.values()) {
          if (s.mapsTo === prevSkillType && s.validationPatterns.length > 0) {
            validationPatterns = s.validationPatterns;
            break;
          }
        }
      }
    }
  }

  const action = formatAction(skill, state, inboxMessages, loadedSkills, article, permissionViolations, wikiSummary, validationPatterns);

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

// Re-export for backward compatibility with existing test imports
export { isAllHousekeeping, HOUSEKEEPING_PATHS } from "./scheduler/housekeeping";

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


export function formatAction(
  skill: string | null,
  state: WorldState,
  inboxMessages: { file: string; content: string }[],
  loadedSkills?: Map<string, SkillDefinition>,
  article?: { title: string; summary: string },
  permissionViolations?: string[],
  wikiSummary?: string,
  validationPatterns?: string[],
): string {
  if (skill === "inbox" && inboxMessages.length > 0) {
    const msgs = inboxMessages
      .map((m) => `### ${m.file}\n\n${m.content}`)
      .join("\n\n---\n\n");
    return `# Inbox Messages — Act on These First

The human has left ${inboxMessages.length} message(s) for you. Read them, do what they ask, commit your work, then delete the message files from \`.shoe-makers/inbox/\`. Log what you did in the shift log.

${msgs}

## After handling inbox

Run \`bun run setup\` again to get your next action.
`;
  }

  if (skill) {
    const actionType = skill as ActionType;
    const prompt = generatePrompt(actionType, state, loadedSkills, (actionType === "explore" || actionType === "innovate") ? article : undefined, permissionViolations, wikiSummary, validationPatterns);
    return `${prompt}

## After ${skill === "explore" ? "exploring" : "completing"}

Run \`bun run setup\` again to get your next action.
`;
  }

  return `# Nothing to Do

The tree found no applicable action. This shouldn't happen — check the tree definition.
`;
}

/**
 * Read wiki overview pages for the innovate creative brief.
 * Reads architecture.md and other key overview pages to build a system summary.
 */
export async function readWikiOverview(repoRoot: string, wikiDir: string = "wiki"): Promise<string> {
  const overviewFiles = ["architecture.md", "behaviour-tree.md", "pure-function-agents.md"];
  const sections: string[] = [];

  for (const file of overviewFiles) {
    try {
      const content = await readFile(join(repoRoot, wikiDir, "pages", file), "utf-8");
      // Strip frontmatter
      const stripped = content.replace(/^---[\s\S]*?---\n*/, "");
      sections.push(stripped.trim());
    } catch {
      // File doesn't exist — skip
    }
  }

  return sections.length > 0
    ? sections.join("\n\n---\n\n")
    : "Shoe-makers is a behaviour tree system that runs autonomous AI agents to improve codebases overnight.";
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("[setup] Fatal error:", err);
    process.exit(1);
  });
}
