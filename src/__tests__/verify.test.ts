import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { verify } from "../skills/verify";
import type { VerifyInput } from "../skills/verify";
import {
  readBlackboard,
  writeCurrentTask,
  writePriorities,
} from "../state/blackboard";
import type { PriorityItem, PriorityList } from "../types";

let tempDir: string;

const now = new Date().toISOString();

const samplePriorities: PriorityList = {
  timestamp: now,
  assessedAt: now,
  items: [],
};

const sampleItem: PriorityItem = {
  rank: 1,
  type: "implement",
  description: "Build something",
  taskPrompt: "Build it.",
  reasoning: "Needed.",
  impact: "high",
  confidence: "high",
  risk: "low",
};

const passingInput: VerifyInput = { testsPass: true, healthScore: null };
const failingInput: VerifyInput = { testsPass: false, healthScore: null };

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-verify-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("verify skill", () => {
  test("throws when no current task exists", async () => {
    await expect(verify(tempDir, passingInput)).rejects.toThrow("no current task");
  });

  test("throws when task is still in progress", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "in-progress",
    });
    await expect(verify(tempDir, passingInput)).rejects.toThrow("still in progress");
  });

  test("passes verification when task is done and tests pass", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await verify(tempDir, passingInput);

    expect(result.testsPass).toBe(true);
    expect(result.reviewPassed).toBe(true);
    expect(result.action).toBe("commit");
    expect(result.issues).toHaveLength(0);
    expect(result.taskDescription).toBe("Build something");
  });

  test("writes verification.json to disk", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await verify(tempDir, passingInput);

    const bb = await readBlackboard(tempDir);
    expect(bb.verification).toEqual(result);
  });

  test("clears currentTask and priorities after verification", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });
    await writePriorities(tempDir, samplePriorities);

    await verify(tempDir, passingInput);

    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
    expect(bb.priorities).toBeNull();
    expect(bb.verification).not.toBeNull();
  });

  test("fails verification when task status is failed", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "failed",
    });

    const result = await verify(tempDir, passingInput);

    expect(result.reviewPassed).toBe(false);
    expect(result.action).toBe("revert");
    expect(result.issues).toContain('Task status is "failed", not "done".');
  });

  test("clears currentTask and priorities even on revert", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "failed",
    });
    await writePriorities(tempDir, samplePriorities);

    await verify(tempDir, passingInput);

    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
    expect(bb.priorities).toBeNull();
  });

  test("fails verification when tests fail", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await verify(tempDir, failingInput);

    expect(result.testsPass).toBe(false);
    expect(result.reviewPassed).toBe(false);
    expect(result.action).toBe("revert");
    expect(result.issues).toContain("Test suite failed.");
  });

  test("defaults to tests passing when no input provided", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await verify(tempDir);

    expect(result.testsPass).toBe(true);
    expect(result.reviewPassed).toBe(true);
  });
});
