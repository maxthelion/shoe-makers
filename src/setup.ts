import { assess, buildSuggestions, archiveResolvedFindings } from "./skills/assess";
import { evaluateWithTrace, formatTrace } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { generatePrompt } from "./prompts";
import { saveLastAction } from "./state/last-action";
import { checkUnreviewedCommits, countUnresolvedCritiques, hasUncommittedChanges, checkHasWorkItem, checkHasCandidates, readWorkItemSkillType } from "./state/world";
import { execSync } from "child_process";
import type { WorldState, Blackboard, ActionType, Config } from "./types";
import { isWithinWorkingHours, getShiftDate } from "./schedule";
import { loadSkills, type SkillDefinition } from "./skills/registry";
import { loadConfig } from "./config/load-config";
import { readBlackboard } from "./state/blackboard";
import { checkHealthRegression } from "./verify/health-regression";
import { fetchRandomArticle, shouldIncludeLens } from "./creative/wikipedia";

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

  // 2. Archive resolved findings, then run assessment
  const archived = await archiveResolvedFindings(repoRoot);
  if (archived.length > 0) {
    console.log(`[setup] Archived ${archived.length} resolved finding(s)`);
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
  if (trace.length > 0) {
    console.log(`[setup] Tree trace:\n${formatTrace(trace)}`);
  }

  // Fetch a Wikipedia article for creative exploration (explore actions only)
  let article: { title: string; summary: string } | undefined;
  if (skill === "explore" && shouldIncludeLens(config.insightFrequency)) {
    article = (await fetchRandomArticle()) ?? undefined;
  }

  const action = formatAction(skill, state, inboxMessages, loadedSkills, article);

  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });
  await writeFile(join(stateDir, "next-action.md"), action);
  await saveLastAction(repoRoot, action);
  console.log(`[setup] Wrote action to ${join(stateDir, "next-action.md")}`);

  const actionTitle = action.split("\n")[0].replace("# ", "");
  await appendToShiftLog(
    repoRoot,
    `## ${new Date().toISOString()} — Setup\n\n- Action: ${actionTitle}\n`
  );

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
    console.log(`[setup] Typecheck: ${assessment.typecheckPass ? "pass" : "FAIL"}`);
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
  const [uncommitted, hasUnreviewedCommits, unresolvedCritiqueCount, hasWorkItem, hasCandidates, workItemSkillType] = await Promise.all([
    hasUncommittedChanges(repoRoot),
    checkUnreviewedCommits(repoRoot),
    countUnresolvedCritiques(repoRoot),
    checkHasWorkItem(repoRoot),
    checkHasCandidates(repoRoot),
    readWorkItemSkillType(repoRoot),
  ]);

  const blackboard: Blackboard = {
    assessment,
    priorities: null,
    currentTask: null,
    verification: null,
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
    insightCount: 0,
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
    const prompt = generatePrompt(actionType, state, loadedSkills, actionType === "explore" ? article : undefined);
    return `${prompt}

## After ${skill === "explore" ? "exploring" : "completing"}

Run \`bun run setup\` again to get your next action.
`;
  }

  return `# Nothing to Do

The tree found no applicable action. This shouldn't happen — check the tree definition.
`;
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("[setup] Fatal error:", err);
    process.exit(1);
  });
}
