import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  readBlackboard,
  writeAssessment,
  writeCurrentTask,
} from "../state/blackboard";
import type { Assessment, CurrentTask } from "../types";

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
      currentTask: null,
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
});
