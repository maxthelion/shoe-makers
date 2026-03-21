import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { work } from "../skills/work";
import {
  readBlackboard,
  writeAssessment,
  writePriorities,
  writeCurrentTask,
} from "../state/blackboard";
import type { Assessment, PriorityList, PriorityItem, CurrentTask } from "../types";

let tempDir: string;

const now = new Date().toISOString();

const sampleItem: PriorityItem = {
  rank: 1,
  type: "implement",
  description: "Build the work skill",
  taskPrompt: "Implement the work skill that reads priorities and starts a task.",
  reasoning: "Closes the third tick type.",
  impact: "high",
  confidence: "high",
  risk: "low",
};

const sampleAssessment: Assessment = {
  timestamp: now,
  invariants: null,
  healthScore: null,
  openPlans: [],
  findings: [],
  testsPass: true,
  recentGitActivity: [],
};

const samplePriorities: PriorityList = {
  timestamp: now,
  assessedAt: now,
  items: [sampleItem],
};

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-work-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("work skill", () => {
  test("throws when no priorities exist", async () => {
    await expect(work(tempDir)).rejects.toThrow("Cannot work without priorities");
  });

  test("throws when priority list is empty", async () => {
    await writeAssessment(tempDir, sampleAssessment);
    await writePriorities(tempDir, { ...samplePriorities, items: [] });
    await expect(work(tempDir)).rejects.toThrow("No priority items");
  });

  test("throws when task is already in progress", async () => {
    await writePriorities(tempDir, samplePriorities);
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "in-progress",
    });
    await expect(work(tempDir)).rejects.toThrow("already in progress");
  });

  test("picks top priority and writes current-task.json", async () => {
    await writePriorities(tempDir, samplePriorities);

    const result = await work(tempDir);

    expect(result.task.status).toBe("in-progress");
    expect(result.task.priority.description).toBe("Build the work skill");
    expect(result.task.startedAt).toBeTruthy();

    // Verify it was written to disk
    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toEqual(result.task);
  });

  test("returns instructions containing the task prompt", async () => {
    await writePriorities(tempDir, samplePriorities);

    const result = await work(tempDir);

    expect(result.instructions).toContain("Build the work skill");
    expect(result.instructions).toContain(sampleItem.taskPrompt);
    expect(result.instructions).toContain("implement");
  });

  test("can start work after a previous task was completed", async () => {
    await writePriorities(tempDir, samplePriorities);
    // Previous task is done (not in-progress)
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await work(tempDir);
    expect(result.task.status).toBe("in-progress");
  });
});
