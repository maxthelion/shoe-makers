import { assess } from "./skills/assess";
import { evaluate } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { generatePrompt } from "./prompts";
import { saveLastAction } from "./state/last-action";
import { checkUnreviewedCommits, countUnresolvedCritiques, hasUncommittedChanges } from "./state/world";
import { execSync } from "child_process";
import type { WorldState, Blackboard, ActionType, Config } from "./types";
import { isWithinWorkingHours, getShiftDate } from "./schedule";
import { loadSkills, type SkillDefinition } from "./skills/registry";
import { loadConfig } from "./config/load-config";
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

  // 2. Run assessment
  console.log("[setup] Running assessment...");
  const assessment = await assess(repoRoot);
  logAssessment(assessment);

  // 3. Read inbox messages
  const inboxMessages = await readInboxMessages(repoRoot);

  // 4. Load config and build world state for tree evaluation
  const config = await loadConfig(repoRoot);
  const state = await buildWorldState(repoRoot, branchName, assessment, inboxMessages.length, config);

  // 5. Load skills (filtered by enabledSkills config) and evaluate the tree
  const loadedSkills = await loadSkills(repoRoot, config.enabledSkills);
  const { skill } = evaluate(defaultTree, state);

  // 6. If explore, maybe fetch a Wikipedia lens for creative prompting
  let wikipediaLens: { title: string; summary: string } | null = null;
  if (skill === "explore" && shouldIncludeLens(config.insightFrequency ?? 0.3)) {
    console.log("[setup] Fetching random Wikipedia article for creative lens...");
    wikipediaLens = await fetchRandomArticle();
    if (wikipediaLens) {
      console.log(`[setup] Lens: ${wikipediaLens.title}`);
    }
  }

  const action = formatAction(skill, state, inboxMessages, loadedSkills, wikipediaLens);

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

function logAssessment(assessment: Awaited<ReturnType<typeof assess>>): void {
  console.log(`[setup] Tests: ${assessment.testsPass ? "pass" : "FAIL"}`);
  console.log(`[setup] Plans: ${assessment.openPlans.length}`);
  console.log(`[setup] Findings: ${assessment.findings.length}`);
  if (assessment.invariants) {
    console.log(
      `[setup] Invariants: ${assessment.invariants.specifiedOnly} specified-only, ${assessment.invariants.implementedUntested} untested, ${assessment.invariants.unspecified} unspecified`
    );
  }
}

async function readInboxMessages(repoRoot: string): Promise<{ file: string; content: string }[]> {
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
  config?: Config,
): Promise<WorldState> {
  const uncommitted = hasUncommittedChanges(repoRoot);
  const hasUnreviewedCommits = await checkUnreviewedCommits(repoRoot);
  const unresolvedCritiqueCount = await countUnresolvedCritiques(repoRoot);

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
    blackboard,
    config,
  };
}


function formatAction(
  skill: string | null,
  state: WorldState,
  inboxMessages: { file: string; content: string }[],
  loadedSkills?: Map<string, SkillDefinition>,
  wikipediaLens?: { title: string; summary: string } | null,
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
    const prompt = generatePrompt(actionType, state, loadedSkills, wikipediaLens);
    return `${prompt}

## After ${skill === "explore" ? "exploring" : "completing"}

Run \`bun run setup\` again to get your next action.
`;
  }

  return `# Nothing to Do

The tree found no applicable action. This shouldn't happen — check the tree definition.
`;
}

main().catch((err) => {
  console.error("[setup] Fatal error:", err);
  process.exit(1);
});
