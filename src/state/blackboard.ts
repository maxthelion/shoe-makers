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
 * Write an individual blackboard entry.
 */
export async function writeAssessment(repoRoot: string, data: Assessment): Promise<void> {
  await writeJsonFile(repoRoot, FILES.assessment, data);
}

export async function writePriorities(repoRoot: string, data: PriorityList): Promise<void> {
  await writeJsonFile(repoRoot, FILES.priorities, data);
}

export async function writeCurrentTask(repoRoot: string, data: CurrentTask): Promise<void> {
  await writeJsonFile(repoRoot, FILES.currentTask, data);
}

export async function writeVerification(repoRoot: string, data: Verification): Promise<void> {
  await writeJsonFile(repoRoot, FILES.verification, data);
}

/**
 * Clear a blackboard entry by deleting the file.
 */
async function clearFile(repoRoot: string, filename: string): Promise<void> {
  const { unlink } = await import("fs/promises");
  try {
    await unlink(join(repoRoot, STATE_DIR, filename));
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return; // already gone
    }
    throw err;
  }
}

export async function clearCurrentTask(repoRoot: string): Promise<void> {
  await clearFile(repoRoot, FILES.currentTask);
}

export async function clearPriorities(repoRoot: string): Promise<void> {
  await clearFile(repoRoot, FILES.priorities);
}
