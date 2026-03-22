import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  readBlackboard,
  writeAssessment,
  writeCurrentTask,
  writePriorities,
  writeVerification,
  clearCurrentTask,
  clearPriorities,
} from "../state/blackboard";
import type { Assessment, CurrentTask, PriorityList, Verification } from "../types";

const STATE_DIR = ".shoe-makers/state";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

describe("readBlackboard", () => {
  test("returns all nulls when state directory does not exist", async () => {
    const bb = await readBlackboard(tempDir);
    expect(bb).toEqual({
      assessment: null,
      priorities: null,
      currentTask: null,
      verification: null,
    });
  });

  test("throws on invalid JSON (non-ENOENT error)", async () => {
    await mkdir(join(tempDir, STATE_DIR), { recursive: true });
    await writeFile(join(tempDir, STATE_DIR, "assessment.json"), "not valid json{{{");

    await expect(readBlackboard(tempDir)).rejects.toThrow();
  });

  test("reads assessment.json when present", async () => {
    const assessment: Assessment = {
      timestamp: "2026-03-21T01:00:00Z",
      invariants: null,
      healthScore: null,
      worstFiles: [],
      openPlans: [],
      findings: [],
      testsPass: true,
      recentGitActivity: ["initial commit"],
    };

    await writeAssessment(tempDir, assessment);
    const bb = await readBlackboard(tempDir);
    expect(bb.assessment).toEqual(assessment);
    expect(bb.priorities).toBeNull();
  });
});

describe("write functions", () => {
  test("writeAssessment creates the state directory and writes JSON", async () => {
    const assessment: Assessment = {
      timestamp: "2026-03-21T02:00:00Z",
      invariants: null,
      healthScore: null,
      worstFiles: [],
      openPlans: [],
      findings: [],
      testsPass: null,
      recentGitActivity: [],
    };

    await writeAssessment(tempDir, assessment);

    const raw = await readFile(join(tempDir, STATE_DIR, "assessment.json"), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(assessment);
  });

  test("writeAssessment overwrites existing data", async () => {
    const first: Assessment = {
      timestamp: "2026-03-21T01:00:00Z",
      invariants: null,
      healthScore: 50,
      worstFiles: [],
      openPlans: [],
      findings: [],
      testsPass: false,
      recentGitActivity: [],
    };
    const second: Assessment = {
      timestamp: "2026-03-21T02:00:00Z",
      invariants: null,
      healthScore: 90,
      worstFiles: [],
      openPlans: ["plan-b"],
      findings: [],
      testsPass: true,
      recentGitActivity: ["added tests"],
    };

    await writeAssessment(tempDir, first);
    await writeAssessment(tempDir, second);

    const bb = await readBlackboard(tempDir);
    expect(bb.assessment).toEqual(second);
  });

  test("writeCurrentTask writes task for CLI usage", async () => {
    const task: CurrentTask = {
      startedAt: "2026-03-21T01:00:00Z",
      priority: {
        rank: 1,
        type: "implement",
        description: "test",
        taskPrompt: "test",
        reasoning: "test",
        impact: "low",
        confidence: "high",
        risk: "low",
      },
      status: "in-progress",
    };

    await writeCurrentTask(tempDir, task);
    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toEqual(task);
  });

  test("writePriorities writes and reads back correctly", async () => {
    const priorities: PriorityList = {
      timestamp: "2026-03-21T03:00:00Z",
      assessedAt: "2026-03-21T02:00:00Z",
      items: [
        {
          rank: 1,
          type: "implement",
          description: "Build config loader",
          taskPrompt: "Implement config loading",
          reasoning: "Foundation for other features",
          impact: "high",
          confidence: "high",
          risk: "low",
        },
      ],
    };

    await writePriorities(tempDir, priorities);
    const bb = await readBlackboard(tempDir);
    expect(bb.priorities).toEqual(priorities);
  });

  test("writeVerification writes and reads back correctly", async () => {
    const verification: Verification = {
      timestamp: "2026-03-21T04:00:00Z",
      taskDescription: "Implement config loader",
      testsPass: true,
      reviewPassed: true,
      issues: [],
      action: "commit",
    };

    await writeVerification(tempDir, verification);
    const bb = await readBlackboard(tempDir);
    expect(bb.verification).toEqual(verification);
  });
});

describe("clear functions", () => {
  test("clearCurrentTask removes the file", async () => {
    const task: CurrentTask = {
      startedAt: "2026-03-21T01:00:00Z",
      priority: {
        rank: 1,
        type: "implement",
        description: "test",
        taskPrompt: "test",
        reasoning: "test",
        impact: "low",
        confidence: "high",
        risk: "low",
      },
      status: "in-progress",
    };

    await writeCurrentTask(tempDir, task);
    let bb = await readBlackboard(tempDir);
    expect(bb.currentTask).not.toBeNull();

    await clearCurrentTask(tempDir);
    bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
  });

  test("clearPriorities removes the file", async () => {
    const priorities: PriorityList = {
      timestamp: "2026-03-21T03:00:00Z",
      assessedAt: "2026-03-21T02:00:00Z",
      items: [],
    };

    await writePriorities(tempDir, priorities);
    let bb = await readBlackboard(tempDir);
    expect(bb.priorities).not.toBeNull();

    await clearPriorities(tempDir);
    bb = await readBlackboard(tempDir);
    expect(bb.priorities).toBeNull();
  });

  test("clearCurrentTask is safe when file doesn't exist", async () => {
    // Should not throw
    await clearCurrentTask(tempDir);
    const bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
  });

  test("clearPriorities is safe when file doesn't exist", async () => {
    // Should not throw
    await clearPriorities(tempDir);
    const bb = await readBlackboard(tempDir);
    expect(bb.priorities).toBeNull();
  });
});
