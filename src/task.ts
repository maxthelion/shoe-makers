/**
 * Task lifecycle CLI — manage current task status.
 *
 * Usage:
 *   bun run task:status  — show current task details
 *   bun run task:done    — mark task as completed
 *   bun run task:fail    — mark task as failed (optional reason as args)
 */

import { readBlackboard, writeCurrentTask } from "./state/blackboard";
import type { CurrentTask } from "./types";

const repoRoot = process.cwd();
const command = process.argv[2] || "status";

async function status(): Promise<void> {
  const blackboard = await readBlackboard(repoRoot);
  const task = blackboard.currentTask;

  if (!task) {
    console.log("[task] No active task.");
    return;
  }

  console.log(`[task] Status: ${task.status}`);
  console.log(`[task] Started: ${task.startedAt}`);
  console.log(`[task] Type: ${task.priority.type}`);
  console.log(`[task] Description: ${task.priority.description}`);
  console.log(`[task] Impact: ${task.priority.impact} | Confidence: ${task.priority.confidence} | Risk: ${task.priority.risk}`);
  console.log();
  console.log("--- Task Prompt ---");
  console.log(task.priority.taskPrompt);
}

async function markDone(): Promise<void> {
  const blackboard = await readBlackboard(repoRoot);
  const task = blackboard.currentTask;

  if (!task) {
    console.error("[task] No active task to mark as done.");
    process.exit(1);
  }

  if (task.status !== "in-progress") {
    console.error(`[task] Task is already "${task.status}".`);
    process.exit(1);
  }

  const updated: CurrentTask = { ...task, status: "done" };
  await writeCurrentTask(repoRoot, updated);
  console.log(`[task] Marked as done: ${task.priority.description}`);
  console.log("[task] Run `bun run shift` to trigger verification.");
}

async function markFailed(): Promise<void> {
  const blackboard = await readBlackboard(repoRoot);
  const task = blackboard.currentTask;

  if (!task) {
    console.error("[task] No active task to mark as failed.");
    process.exit(1);
  }

  if (task.status !== "in-progress") {
    console.error(`[task] Task is already "${task.status}".`);
    process.exit(1);
  }

  const updated: CurrentTask = { ...task, status: "failed" };
  await writeCurrentTask(repoRoot, updated);
  console.log(`[task] Marked as failed: ${task.priority.description}`);
  console.log("[task] Run `bun run shift` to trigger verification.");
}

switch (command) {
  case "status":
    await status();
    break;
  case "done":
    await markDone();
    break;
  case "fail":
    await markFailed();
    break;
  default:
    console.error(`[task] Unknown command: ${command}`);
    console.error("[task] Usage: bun run src/task.ts [status|done|fail]");
    process.exit(1);
}
