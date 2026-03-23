import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { shift } from "../scheduler/shift";
import type { WorldState, Blackboard, Assessment } from "../types";

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
  invariants: {
    specifiedOnly: 0,
    implementedUntested: 0,
    implementedTested: 50,
    unspecified: 0,
    topSpecGaps: [],
    topUntested: [],
    topUnspecified: [],
  },
  healthScore: 80,
  worstFiles: [],
  openPlans: [],
  findings: [],
  testsPass: true,
  recentGitActivity: [],
};

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-shift-"));
  await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function mockStateSequence(states: WorldState[]) {
  let index = 0;
  return async (_repoRoot: string): Promise<WorldState> => {
    const state = states[Math.min(index, states.length - 1)];
    index++;
    return state;
  };
}

async function noopLog(_repoRoot: string, _entry: string): Promise<void> {}

describe("shift runner", () => {
  test("returns action for non-explore actions", async () => {
    // Tests failing → fix-tests action → shift stops for elf
    const state: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      inboxCount: 0,
      hasUnreviewedCommits: false,
      unresolvedCritiqueCount: 0,
      hasWorkItem: false,
      hasCandidates: false,
      workItemSkillType: null,
      insightCount: 0,
      blackboard: {
        ...emptyBlackboard(),
        assessment: { ...freshAssessment, testsPass: false },
      },
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state]),
      runSkill: async (_root, action) => `${action} done`,
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("action");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].tick.action).toBe("fix-tests");
    expect(result.steps[0].skillResult).toContain("fix-tests");
  });

  test("loops through explore and then stops on next action", async () => {
    const skillLog: string[] = [];

    // Tick 1: nothing to do → explore
    const state1: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      inboxCount: 0,
      hasUnreviewedCommits: false,
      unresolvedCritiqueCount: 0,
      hasWorkItem: false,
      hasCandidates: false,
      workItemSkillType: null,
      insightCount: 0,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
      },
    };

    // Tick 2: after explore wrote candidates.md → prioritise
    const state2: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      inboxCount: 0,
      hasUnreviewedCommits: false,
      unresolvedCritiqueCount: 0,
      hasWorkItem: false,
      hasCandidates: true,
      workItemSkillType: null,
      insightCount: 0,
      blackboard: {
        ...emptyBlackboard(),
        assessment: freshAssessment,
      },
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state1, state2]),
      runSkill: async (_root, action) => {
        skillLog.push(action);
        return `${action} done`;
      },
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("action");
    expect(skillLog).toEqual(["explore", "prioritise"]);
    expect(result.steps).toHaveLength(2);
  });

  test("stops on error", async () => {
    const state: WorldState = {
      branch: "shoemakers/2026-03-21",
      hasUncommittedChanges: false,
      inboxCount: 0,
      hasUnreviewedCommits: false,
      unresolvedCritiqueCount: 0,
      hasWorkItem: false,
      hasCandidates: false,
      workItemSkillType: null,
      insightCount: 0,
      blackboard: emptyBlackboard(),
    };

    const result = await shift(tempDir, {
      readState: mockStateSequence([state]),
      runSkill: async () => {
        throw new Error("skill exploded");
      },
      writeLog: noopLog,
    });

    expect(result.outcome).toBe("error");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBe("skill exploded");
  });
});
