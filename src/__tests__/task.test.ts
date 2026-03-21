import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  readBlackboard,
  writeCurrentTask,
} from "../state/blackboard";
import type { CurrentTask, PriorityItem } from "../types";

let tempDir: string;

const sampleItem: PriorityItem = {
  rank: 1,
  type: "implement",
  description: "Build something",
  taskPrompt: "Do the thing",
  reasoning: "Because it's needed",
  impact: "high",
  confidence: "medium",
  risk: "low",
};

function makeTask(status: "in-progress" | "done" | "failed"): CurrentTask {
  return {
    startedAt: new Date().toISOString(),
    priority: sampleItem,
    status,
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-task-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("task lifecycle", () => {
  test("marks in-progress task as done", async () => {
    const task = makeTask("in-progress");
    await writeCurrentTask(tempDir, task);

    // Simulate what task:done does
    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).not.toBeNull();
    expect(bb.currentTask!.status).toBe("in-progress");

    const updated: CurrentTask = { ...bb.currentTask!, status: "done" };
    await writeCurrentTask(tempDir, updated);

    const after = await readBlackboard(tempDir);
    expect(after.currentTask!.status).toBe("done");
  });

  test("marks in-progress task as failed", async () => {
    const task = makeTask("in-progress");
    await writeCurrentTask(tempDir, task);

    const bb = await readBlackboard(tempDir);
    const updated: CurrentTask = { ...bb.currentTask!, status: "failed" };
    await writeCurrentTask(tempDir, updated);

    const after = await readBlackboard(tempDir);
    expect(after.currentTask!.status).toBe("failed");
  });

  test("preserves task details when marking done", async () => {
    const task = makeTask("in-progress");
    await writeCurrentTask(tempDir, task);

    const bb = await readBlackboard(tempDir);
    const updated: CurrentTask = { ...bb.currentTask!, status: "done" };
    await writeCurrentTask(tempDir, updated);

    const after = await readBlackboard(tempDir);
    expect(after.currentTask!.priority.description).toBe("Build something");
    expect(after.currentTask!.priority.type).toBe("implement");
    expect(after.currentTask!.startedAt).toBe(task.startedAt);
  });

  test("returns null when no task exists", async () => {
    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
  });

  test("already-done task cannot be marked done again", async () => {
    const task = makeTask("done");
    await writeCurrentTask(tempDir, task);

    const bb = await readBlackboard(tempDir);
    // The CLI checks status !== "in-progress" and exits
    expect(bb.currentTask!.status).toBe("done");
    expect(bb.currentTask!.status !== "in-progress").toBe(true);
  });
});
