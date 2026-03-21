import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  readBlackboard,
  writeAssessment,
  writePriorities,
  writeCurrentTask,
  writeVerification,
  clearCurrentTask,
  clearPriorities,
} from "../state/blackboard";
import type { Assessment, PriorityList, CurrentTask, Verification } from "../types";

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

  test("reads assessment.json when present", async () => {
    const assessment: Assessment = {
      timestamp: "2026-03-21T01:00:00Z",
      invariants: null,
      healthScore: null,
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

  test("reads all files when all are present", async () => {
    const assessment: Assessment = {
      timestamp: "2026-03-21T01:00:00Z",
      invariants: null,
      healthScore: 85,
      openPlans: ["plan-a"],
      findings: [],
      testsPass: true,
      recentGitActivity: [],
    };

    const priorities: PriorityList = {
      timestamp: "2026-03-21T01:05:00Z",
      assessedAt: "2026-03-21T01:00:00Z",
      items: [
        {
          rank: 1,
          type: "implement",
          description: "Build world state reader",
          taskPrompt: "Implement the world state reader",
          reasoning: "Most foundational unbuilt piece",
          impact: "high",
          confidence: "high",
          risk: "low",
        },
      ],
    };

    const currentTask: CurrentTask = {
      startedAt: "2026-03-21T01:10:00Z",
      priority: priorities.items[0],
      status: "done",
    };

    const verification: Verification = {
      timestamp: "2026-03-21T01:15:00Z",
      taskDescription: "Build world state reader",
      testsPass: true,
      reviewPassed: true,
      issues: [],
      action: "commit",
    };

    await Promise.all([
      writeAssessment(tempDir, assessment),
      writePriorities(tempDir, priorities),
      writeCurrentTask(tempDir, currentTask),
      writeVerification(tempDir, verification),
    ]);

    const bb = await readBlackboard(tempDir);
    expect(bb.assessment).toEqual(assessment);
    expect(bb.priorities).toEqual(priorities);
    expect(bb.currentTask).toEqual(currentTask);
    expect(bb.verification).toEqual(verification);
  });
});

describe("write functions", () => {
  test("writeAssessment creates the state directory and writes JSON", async () => {
    const assessment: Assessment = {
      timestamp: "2026-03-21T02:00:00Z",
      invariants: null,
      healthScore: null,
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
      openPlans: [],
      findings: [],
      testsPass: false,
      recentGitActivity: [],
    };
    const second: Assessment = {
      timestamp: "2026-03-21T02:00:00Z",
      invariants: null,
      healthScore: 90,
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
});

describe("clearCurrentTask", () => {
  test("removes current-task.json", async () => {
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
      status: "done",
    };

    await writeCurrentTask(tempDir, task);
    let bb = await readBlackboard(tempDir);
    expect(bb.currentTask).not.toBeNull();

    await clearCurrentTask(tempDir);
    bb = await readBlackboard(tempDir);
    expect(bb.currentTask).toBeNull();
  });

  test("does not throw when file does not exist", async () => {
    // Should not throw
    await clearCurrentTask(tempDir);
  });
});

describe("clearPriorities", () => {
  test("removes priorities.json", async () => {
    const priorities: PriorityList = {
      timestamp: "2026-03-21T01:00:00Z",
      assessedAt: "2026-03-21T01:00:00Z",
      items: [],
    };

    await writePriorities(tempDir, priorities);
    let bb = await readBlackboard(tempDir);
    expect(bb.priorities).not.toBeNull();

    await clearPriorities(tempDir);
    bb = await readBlackboard(tempDir);
    expect(bb.priorities).toBeNull();
  });

  test("does not throw when file does not exist", async () => {
    await clearPriorities(tempDir);
  });
});
