import { assess } from "./skills/assess";
import { evaluate } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { join } from "path";
import { appendToShiftLog } from "./log/shift-log";
import { generatePrompt } from "./prompts";
import { execSync } from "child_process";
import type { WorldState, Blackboard, ActionType } from "./types";

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

  // 0. Check working hours
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

  // 4. Build world state for tree evaluation
  const state = await buildWorldState(repoRoot, branchName, assessment, inboxMessages.length);

  // 5. Evaluate the tree and generate prompt
  const { skill } = evaluate(defaultTree, state);
  const action = formatAction(skill, state, inboxMessages);

  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });
  await writeFile(join(stateDir, "next-action.md"), action);
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
  const shiftDate = getShiftDate(repoRoot);
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
  inboxCount: number
): Promise<WorldState> {
  const hasUncommittedChanges = checkUncommittedChanges(repoRoot);
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
    hasUncommittedChanges,
    inboxCount,
    hasUnreviewedCommits,
    unresolvedCritiqueCount,
    blackboard,
  };
}

function checkUncommittedChanges(repoRoot: string): boolean {
  try {
    const status = execSync("git status --porcelain", { cwd: repoRoot, encoding: "utf-8" }).trim();
    return status.length > 0;
  } catch {
    return false;
  }
}

async function checkUnreviewedCommits(repoRoot: string): Promise<boolean> {
  try {
    const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
    const lastReviewed = (await readFile(markerPath, "utf-8")).trim();
    const log = execSync(`git log ${lastReviewed}..HEAD --oneline`, {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();
    return log.length > 0;
  } catch {
    return false;
  }
}

async function countUnresolvedCritiques(repoRoot: string): Promise<number> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  let count = 0;
  try {
    const files = await readdir(findingsDir);
    for (const file of files) {
      if (!file.startsWith("critique-") || !file.endsWith(".md")) continue;
      const content = await readFile(join(findingsDir, file), "utf-8");
      if (!/^## Status\s*\n\s*Resolved\.?\s*$/mi.test(content)) {
        count++;
      }
    }
  } catch {}
  return count;
}

function formatAction(
  skill: string | null,
  state: WorldState,
  inboxMessages: { file: string; content: string }[]
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
    const prompt = generatePrompt(actionType, state);
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
 * Get the shift date — the date the shift started, not the current date.
 * If we're past midnight but before the shift end hour, use yesterday's date.
 * This ensures the whole shift uses one branch name.
 */
function getShiftDate(repoRoot: string): string {
  const now = new Date();
  const nowHour = now.getUTCHours();

  try {
    const schedulePath = join(repoRoot, ".shoe-makers", "schedule.md");
    const content = require("fs").readFileSync(schedulePath, "utf-8");
    const startMatch = content.match(/start:\s*(\d{1,2})/);
    const endMatch = content.match(/end:\s*(\d{1,2})/);

    if (startMatch && endMatch) {
      const start = parseInt(startMatch[1], 10);
      const end = parseInt(endMatch[1], 10);

      // If shift wraps midnight (e.g. 22-06) and we're in the early morning part
      if (start > end && nowHour < end) {
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        return yesterday.toISOString().split("T")[0];
      }
    }
  } catch {}

  return now.toISOString().split("T")[0];
}

/**
 * Check if the current time is within configured working hours.
 * Reads .shoe-makers/schedule.md for start/end hours (24h format, UTC).
 * If no schedule file exists, always returns true (no restriction).
 */
function isWithinWorkingHours(repoRoot: string): boolean {
  try {
    const schedulePath = join(repoRoot, ".shoe-makers", "schedule.md");
    const content = require("fs").readFileSync(schedulePath, "utf-8");
    const startMatch = content.match(/start:\s*(\d{1,2})/);
    const endMatch = content.match(/end:\s*(\d{1,2})/);
    if (!startMatch || !endMatch) return true;

    const start = parseInt(startMatch[1], 10);
    const end = parseInt(endMatch[1], 10);
    const nowHour = new Date().getUTCHours();

    if (start < end) {
      // e.g. start: 22, end: 6 doesn't apply here
      return nowHour >= start && nowHour < end;
    } else {
      // Wraps midnight: e.g. start: 22, end: 6
      return nowHour >= start || nowHour < end;
    }
  } catch {
    return true; // no schedule file = always work
  }
}

main().catch((err) => {
  console.error("[setup] Fatal error:", err);
  process.exit(1);
});
