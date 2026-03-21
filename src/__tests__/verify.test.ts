import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { verify } from "../skills/verify";
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

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-verify-"));
  // Create a minimal bun project with a passing test so `bun test` succeeds
  await writeFile(
    join(tempDir, "package.json"),
    JSON.stringify({ name: "test-project", type: "module" })
  );
  await mkdir(join(tempDir, "src/__tests__"), { recursive: true });
  await writeFile(
    join(tempDir, "src/__tests__/pass.test.ts"),
    `import { test, expect } from "bun:test";\ntest("ok", () => { expect(true).toBe(true); });\n`
  );
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("verify skill", () => {
  test("throws when no current task exists", async () => {
    await expect(verify(tempDir)).rejects.toThrow("no current task");
  });

  test("throws when task is still in progress", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "in-progress",
    });
    await expect(verify(tempDir)).rejects.toThrow("still in progress");
  });

  test("passes verification when task is done and tests pass", async () => {
    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await verify(tempDir);

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

    const result = await verify(tempDir);

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

    await verify(tempDir);

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

    const result = await verify(tempDir);

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

    await verify(tempDir);

    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
    expect(bb.priorities).toBeNull();
  });

  test("fails verification when tests fail", async () => {
    // Create a failing test
    await mkdir(join(tempDir, "src/__tests__"), { recursive: true });
    await writeFile(
      join(tempDir, "src/__tests__/fail.test.ts"),
      `import { test, expect } from "bun:test";\ntest("fail", () => { expect(1).toBe(2); });\n`
    );

    await writeCurrentTask(tempDir, {
      startedAt: now,
      priority: sampleItem,
      status: "done",
    });

    const result = await verify(tempDir);

    expect(result.testsPass).toBe(false);
    expect(result.reviewPassed).toBe(false);
    expect(result.action).toBe("revert");
    expect(result.issues).toContain("Test suite failed.");
  });
});
