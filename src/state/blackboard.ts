import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type {
  Blackboard,
  Assessment,
  PriorityList,
  CurrentTask,
  Verification,
} from "../types";

const STATE_DIR = ".shoe-makers/state";

const FILES = {
  assessment: "assessment.json",
  priorities: "priorities.json",
  currentTask: "current-task.json",
  verification: "verification.json",
} as const;

/**
 * Read a JSON file from the state directory, returning null if it doesn't exist.
 */
async function readJsonFile<T>(repoRoot: string, filename: string): Promise<T | null> {
  try {
    const content = await readFile(join(repoRoot, STATE_DIR, filename), "utf-8");
    return JSON.parse(content) as T;
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

/**
 * Write a JSON file to the state directory, creating the directory if needed.
 */
async function writeJsonFile<T>(repoRoot: string, filename: string, data: T): Promise<void> {
  const dir = join(repoRoot, STATE_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/**
 * Read the full blackboard state from `.shoe-makers/state/`.
 *
 * The primary state file is assessment.json (written by explore action).
 * Priorities, currentTask, and verification are legacy files from the
 * old tick-type model — they're still read for backward compatibility.
 */
export async function readBlackboard(repoRoot: string): Promise<Blackboard> {
  const [assessment, priorities, currentTask, verification] = await Promise.all([
    readJsonFile<Assessment>(repoRoot, FILES.assessment),
    readJsonFile<PriorityList>(repoRoot, FILES.priorities),
    readJsonFile<CurrentTask>(repoRoot, FILES.currentTask),
    readJsonFile<Verification>(repoRoot, FILES.verification),
  ]);

  return { assessment, priorities, currentTask, verification };
}

/**
 * Write the assessment to the blackboard.
 * This is the primary state file — written by the explore action.
 */
export async function writeAssessment(repoRoot: string, data: Assessment): Promise<void> {
  await writeJsonFile(repoRoot, FILES.assessment, data);
}

/**
 * Write current task (used by the task lifecycle CLI).
 */
export async function writeCurrentTask(repoRoot: string, data: CurrentTask): Promise<void> {
  await writeJsonFile(repoRoot, FILES.currentTask, data);
}
