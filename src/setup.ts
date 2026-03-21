import { readWorldState } from "./state/world";
import { assess } from "./skills/assess";
import { evaluate } from "./tree/evaluate";
import { defaultTree } from "./tree/default-tree";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import { join } from "path";
import { loadConfig } from "./config/load-config";
import { findSkillForType } from "./skills/registry";
import { appendToShiftLog } from "./log/shift-log";
import { execSync } from "child_process";

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

  // 1. Branch setup
  const today = new Date().toISOString().split("T")[0];
  const branchName = `shoemakers/${today}`;

  try {
    execSync("git fetch origin", { cwd: repoRoot, stdio: "pipe" });
  } catch {}

  const currentBranch = execSync("git branch --show-current", {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();

  if (currentBranch !== branchName) {
    // Check if remote branch exists
    try {
      execSync(`git rev-parse --verify origin/${branchName}`, {
        cwd: repoRoot,
        stdio: "pipe",
      });
      // Remote exists — check it out
      try {
        execSync(`git checkout ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
        execSync(`git pull`, { cwd: repoRoot, stdio: "pipe" });
      } catch {
        execSync(`git checkout -b ${branchName} origin/${branchName}`, {
          cwd: repoRoot,
          stdio: "pipe",
        });
      }
    } catch {
      // No remote branch — create from main
      execSync(`git checkout -b ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
    }
  }

  // 2. Run assessment
  console.log("[setup] Running assessment...");
  const assessment = await assess(repoRoot);
  console.log(`[setup] Tests: ${assessment.testsPass ? "pass" : "FAIL"}`);
  console.log(`[setup] Plans: ${assessment.openPlans.length}`);
  console.log(`[setup] Findings: ${assessment.findings.length}`);
  if (assessment.invariants) {
    console.log(
      `[setup] Invariants: ${assessment.invariants.specifiedOnly} specified-only, ${assessment.invariants.implementedUntested} untested, ${assessment.invariants.unspecified} unspecified`
    );
  }

  // 3. Check inbox
  const inboxDir = join(repoRoot, ".shoe-makers", "inbox");
  let inboxMessages: { file: string; content: string }[] = [];
  try {
    const files = await readdir(inboxDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(inboxDir, file), "utf-8");
      inboxMessages.push({ file, content });
    }
  } catch {}

  // 4. Determine action
  const stateDir = join(repoRoot, ".shoe-makers", "state");
  await mkdir(stateDir, { recursive: true });
  const actionPath = join(stateDir, "next-action.md");

  let action: string;

  if (inboxMessages.length > 0) {
    // Inbox takes priority
    const msgs = inboxMessages
      .map((m) => `### ${m.file}\n\n${m.content}`)
      .join("\n\n---\n\n");
    action = `# Inbox Messages — Act on These First

The human has left ${inboxMessages.length} message(s) for you. Read them, do what they ask, commit your work, then delete the message files from \`.shoe-makers/inbox/\`. Log what you did in the shift log.

${msgs}

## After handling inbox

Run \`bun run setup\` again to get your next action.
`;
  } else if (!assessment.testsPass) {
    action = `# Fix Failing Tests

Tests are failing. This is the highest priority — fix them before doing anything else.

Run \`bun test\` to see the failures. Fix them. Run \`bun test\` again to confirm. Commit.

## After fixing

Run \`bun run setup\` again to get your next action.
`;
  } else if (assessment.openPlans.length > 0) {
    const planFiles = assessment.openPlans.map((p) => `wiki/pages/${p}.md`);
    action = `# Implement Plan

There are ${assessment.openPlans.length} open plan(s): ${assessment.openPlans.join(", ")}

Read the plan page(s) to understand what needs to be built:
${planFiles.map((f) => `- ${f}`).join("\n")}

Pick the most impactful thing from the plan and implement it. Write tests. Run \`bun test\`. Commit.

If you complete all items in a plan, update its frontmatter to \`status: done\` and update the relevant spec pages in the wiki.

## After implementing

Run \`bun run setup\` again to get your next action.
`;
  } else if (
    assessment.invariants &&
    assessment.invariants.specifiedOnly > 0
  ) {
    const gaps = assessment.invariants.topSpecGaps
      .map((g) => `- **${g.id}**: ${g.description} (group: ${g.group})`)
      .join("\n");

    // Try to find the implement skill for instructions
    let skillInstructions = "";
    try {
      const skill = await findSkillForType("implement");
      if (skill) {
        skillInstructions = `\n## Skill Instructions\n\n${skill.body}\n`;
      }
    } catch {}

    action = `# Implement Specified-Only Invariant

The wiki specifies ${assessment.invariants.specifiedOnly} thing(s) that aren't implemented yet. Pick the most impactful one:

${gaps}

Read the relevant wiki page to understand the spec. Build it. Write tests. Run \`bun test\`. Commit.
${skillInstructions}
## After implementing

Run \`bun run setup\` again to get your next action.
`;
  } else if (
    assessment.invariants &&
    assessment.invariants.implementedUntested > 0
  ) {
    const untested = assessment.invariants.topUntested
      .map((g) => `- **${g.id}**: ${g.description} (group: ${g.group})`)
      .join("\n");

    action = `# Add Tests for Untested Code

There are ${assessment.invariants.implementedUntested} implemented but untested invariant(s). Pick the riskiest one:

${untested}

Write tests that verify this behaviour. Run \`bun test\`. Commit.

## After testing

Run \`bun run setup\` again to get your next action.
`;
  } else if (
    assessment.invariants &&
    assessment.invariants.unspecified > 0
  ) {
    const unspecified = assessment.invariants.topUnspecified
      .map((g) => `- **${g.id}**: ${g.description} (group: ${g.group})`)
      .join("\n");

    action = `# Document Unspecified Code

There are ${assessment.invariants.unspecified} thing(s) in the code not documented in the wiki:

${unspecified}

Update or create wiki pages to document this behaviour. Commit.

## After documenting

Run \`bun run setup\` again to get your next action.
`;
  } else if (
    assessment.healthScore !== null &&
    assessment.healthScore < 70
  ) {
    action = `# Improve Code Health

Code health score is ${assessment.healthScore}/100 (below threshold of 70).

Find the worst file and improve it: reduce complexity, extract helpers, remove duplication. Run \`bun test\`. Commit.

## After improving

Run \`bun run setup\` again to get your next action.
`;
  } else {
    // Explore — nothing matched, suggest deeper analysis
    action = `# Explore — Find Work

The assessment found nothing obvious to do. But the system should almost never sleep. Look deeper:

1. Read the wiki pages in \`wiki/pages/\` carefully — are there claims that aren't implemented?
2. Read \`.shoe-makers/invariants.md\` — compare against the code, are there gaps the invariants checker missed?
3. Read the shift log — did previous elves flag anything?
4. Read findings in \`.shoe-makers/findings/\`
5. Look at test coverage — are there untested paths?
6. Look at code quality — any files that are too complex or duplicated?

If you find something, do it. Write tests. Commit. If you find something the invariants checker should catch, update \`src/verify/invariants.ts\` so future ticks find it automatically.

If you genuinely find nothing, log that in the shift log and exit.

## After exploring

Run \`bun run setup\` again if you found and fixed something.
`;
  }

  await writeFile(actionPath, action);
  console.log(`[setup] Wrote action to ${actionPath}`);

  // Log what setup decided
  const actionType = action.split("\n")[0].replace("# ", "");
  await appendToShiftLog(
    repoRoot,
    `## ${new Date().toISOString()} — Setup\n\n- Action: ${actionType}\n`
  );

  console.log(`[setup] Action: ${actionType}`);
  console.log("[setup] Done. The elf should read .shoe-makers/state/next-action.md");
}

main().catch((err) => {
  console.error("[setup] Fatal error:", err);
  process.exit(1);
});
