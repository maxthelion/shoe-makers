import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { shift } from "../scheduler/shift";
import type { WorldState, Blackboard, Assessment, PriorityList, PriorityItem, TickType } from "../types";
import { writePriorities, writeCurrentTask } from "../state/blackboard";

let tempDir: string;

const now = new Date().toISOString();

function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    priorities: null,
    currentTask: null,
    verification: null,
  };
}

const freshAssessment: Assessment = {
  timestamp: now,
  invariants: null,
  healthScore: null,
  openPlans: [],
  findings: [],
  testsPass: true,
  recentGitActivity: [],
};

const sampleItem: PriorityItem = {
  rank: 1,
  type: "implement",
  description: "Build the scheduler",
  taskPrompt: "Implement the tick scheduler.",
  reasoning: "Foundational piece.",
  impact: "high",
  confidence: "high",
  risk: "low",
};

const samplePriorities: PriorityList = {
  timestamp: now,
  assessedAt: now,
  items: [sampleItem],
};

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-shift-"));
  // Create state directory for blackboard writes
  await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

/**
 * Helper: create a mock readState that returns a sequence of states.
 * Each call returns the next state in the sequence. If exhausted, repeats the last.
 */
function mockStateSequence(states: WorldState[]) {
  let index = 0;
  return async (_repoRoot: string): Promise<WorldState> => {
    const state = states[Math.min(index, states.length - 1)];
    index++;
    return state;
  };
}

/** No-op log writer for tests */
async function noopLog(_repoRoot: string, _entry: string): Promise<void> {}

describe("shift runner", () => {
  test("stops immediately on sleep (nothing to do)", async () => {
    // State where everything is current → tree says sleep
    const state: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: { timestamp: now, assessedAt: now, items: [] },
      },
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state]),
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("sleep");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].tick.tickType).toBeNull();
    expect(result.workInstructions).toBeNull();
  });

  test("runs assess then prioritise then sleep", async () => {
    const skillLog: TickType[] = [];

    // Tick 1: no assessment → assess
    const state1: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: emptyBlackboard(),
    };

    // Tick 2: fresh assessment, no priorities → prioritise
    const state2: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
      },
    };

    // Tick 3: assessment + empty priorities → sleep
    const state3: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: { timestamp: now, assessedAt: now, items: [] },
      },
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state1, state2, state3]),
      runSkill: async (_root, tickType) => {
        skillLog.push(tickType);
        return `${tickType} done`;
      },
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("sleep");
    expect(result.steps).toHaveLength(3);
    expect(skillLog).toEqual(["assess", "prioritise"]);
    expect(result.steps[0].tick.tickType).toBe("assess");
    expect(result.steps[1].tick.tickType).toBe("prioritise");
    expect(result.steps[2].tick.tickType).toBeNull(); // sleep
  });

  test("stops on work and returns instructions", async () => {
    // State where priorities exist → tree says work
    const state: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: samplePriorities,
      },
    };

    // Pre-write priorities so the work skill can read them
    await writePriorities(tempDir, samplePriorities);

    const result = await shift(tempDir, {
      readState: mockStateSequence([state]),
      runSkill: async (root, tickType) => {
        // Simulate the work skill writing current-task
        await writeCurrentTask(root, {
          startedAt: now,
          priority: sampleItem,
          status: "in-progress",
        });
        return `Work started: "${sampleItem.description}"`;
      },
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("work");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].tick.tickType).toBe("work");
    expect(result.workInstructions).toContain("Build the scheduler");
    expect(result.workInstructions).toContain("task:status");
  });

  test("stops on error", async () => {
    const state: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: emptyBlackboard(),
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state]),
      runSkill: async () => {
        throw new Error("assess exploded");
      },
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("error");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBe("assess exploded");
  });

  test("respects maxTicks limit", async () => {
    // State that always triggers assess (stale assessment)
    const staleState: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: emptyBlackboard(),
    };

    const result = await shift(tempDir, {
      maxTicks: 3,
      readState: mockStateSequence([staleState]), // always returns stale state
      runSkill: async () => "done",
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("max-ticks");
    expect(result.steps).toHaveLength(3);
  });

  test("calls onTick for each step", async () => {
    const ticks: string[] = [];

    const state1: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: emptyBlackboard(),
    };
    const state2: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: { timestamp: now, assessedAt: now, items: [] },
      },
    };

    await shift(tempDir, {
      readState: mockStateSequence([state1, state2]),
      runSkill: async () => "done",
      writeLog: noopLog,
      onTick(step) {
        ticks.push(step.tick.tickType ?? "sleep");
      },
    });

    expect(ticks).toEqual(["assess", "sleep"]);
  });

  test("runs verify automatically as housekeeping", async () => {
    const skillLog: TickType[] = [];

    // Task done, needs verification
    const state1: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: samplePriorities,
        currentTask: {
          startedAt: now,
          priority: sampleItem,
          status: "done",
        },
      },
    };

    // After verify clears state → sleep
    const state2: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: { timestamp: now, assessedAt: now, items: [] },
      },
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state1, state2]),
      runSkill: async (_root, tickType) => {
        skillLog.push(tickType);
        return `${tickType} done`;
      },
      writeLog: noopLog,
    });

    expect(skillLog).toContain("verify");
    expect(result.steps[0].tick.tickType).toBe("verify");
  });

  test("writes to log by default when using real shift log", async () => {
    const state: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
        priorities: { timestamp: now, assessedAt: now, items: [] },
      },
    };

    // Use default writeLog (real shift log) but mock readState/runSkill
    await shift(tempDir, {
      readState: mockStateSequence([state]),
    });

    // Check that a log file was created
    const { readFile } = await import("fs/promises");
    const logDir = join(tempDir, ".shoe-makers", "log");
    const today = new Date().toISOString().slice(0, 10);
    const logContent = await readFile(join(logDir, `${today}.md`), "utf-8");
    expect(logContent).toContain("sleep");
  });
});
