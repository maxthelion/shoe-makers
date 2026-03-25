import { assess, buildSuggestions, archiveResolvedFindings } from "./skills/assess";
import { evaluateWithTrace, formatTrace } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { generatePrompt } from "./prompts";
import { saveLastAction } from "./state/last-action";
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
import { fetchRandomArticle, shouldIncludeLens } from "./creative/wikipedia";
import { archiveConsumedStateFiles } from "./archive/state-archive";

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
  if (trace.length > 0) {
    console.log(`[setup] Tree trace:\n${formatTrace(trace)}`);
  }

  // Fetch a Wikipedia article for creative exploration
  // For innovate: always fetch (deterministic creative brief)
  // For explore: probabilistic based on config
  let article: { title: string; summary: string } | undefined;
  if (skill === "innovate") {
    article = (await fetchRandomArticle()) ?? undefined;
    if (article) {
      await appendToShiftLog(repoRoot, `- Wikipedia article fetched: "${article.title}"\n`);
    } else {
      await appendToShiftLog(repoRoot, `- Wikipedia article fetch failed\n`);
    }
  } else if (skill === "explore" && shouldIncludeLens(config.insightFrequency)) {
    article = (await fetchRandomArticle()) ?? undefined;
  }

  // Read wiki overview for innovate action
  let wikiSummary: string | undefined;
  if (skill === "innovate") {
    wikiSummary = await readWikiOverview(repoRoot, config.wikiDir);
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

  const action = formatAction(skill, state, inboxMessages, loadedSkills, article, permissionViolations, wikiSummary);

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

  // Auto-commit housekeeping changes (archive, shift log) so they don't
  // trigger review cycles — these are mechanical, not elf-authored
  autoCommitHousekeeping(repoRoot);

  console.log(`[setup] Action: ${actionTitle}`);
  console.log("[setup] Done. The elf should read .shoe-makers/state/next-action.md");
}

/** Paths considered housekeeping (archive moves, shift log entries) */
export const HOUSEKEEPING_PATHS = [".shoe-makers/findings/", ".shoe-makers/log/", ".shoe-makers/archive/"];

/**
 * Check if all lines from `git status --porcelain` output are housekeeping changes.
 * Returns true if every changed file is under a housekeeping path.
 */
export function isAllHousekeeping(statusOutput: string): boolean {
  const lines = statusOutput.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return false;
  return lines.every(line => {
    // git status --porcelain format: XY filename (or XY old -> new for renames)
    const path = line.slice(3).split(" -> ").pop()!;
    return HOUSEKEEPING_PATHS.some(p => path.startsWith(p));
  });
}

/**
 * Auto-commit housekeeping changes (archive moves, shift log entries)
 * and update the review marker so they don't trigger the critique cycle.
 *
 * Only commits if ALL uncommitted changes are in housekeeping paths.
 * If there are mixed changes (e.g., findings + code), does nothing.
 */
export function autoCommitHousekeeping(repoRoot: string): void {
  try {
    const status = execSync("git status --porcelain", {
      cwd: repoRoot,
      encoding: "utf-8",
    });

    if (!isAllHousekeeping(status)) return;

    // Read the current review marker BEFORE committing
    const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
    let previousMarker: string | null = null;
    try {
      previousMarker = readFileSync(markerPath, "utf-8").trim();
    } catch {}

    // Stage all housekeeping changes
    for (const prefix of HOUSEKEEPING_PATHS) {
      execSync(`git add "${prefix}"`, { cwd: repoRoot, stdio: "pipe" });
    }

    execSync('git commit -m "Auto-commit setup housekeeping (archive, shift log)"', {
      cwd: repoRoot,
      stdio: "pipe",
    });

    const head = execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();

    // Only advance the marker if the auto-commit is the ONLY unreviewed commit.
    // This prevents skipping review of code commits made between the old marker
    // and the auto-commit.
    const parentOfHead = execSync("git rev-parse HEAD~1", {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();

    if (previousMarker === parentOfHead) {
      writeFileSync(markerPath, head);
    }

    console.log("[setup] Auto-committed housekeeping changes");
  } catch {
    // If anything fails, just skip — the elf will handle it
  }
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
    const prompt = generatePrompt(actionType, state, loadedSkills, (actionType === "explore" || actionType === "innovate") ? article : undefined, permissionViolations, wikiSummary);
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
