import { describe, test, expect } from "bun:test";
import { readWorldState } from "../state/world";

describe("readWorldState", () => {
  test("reads current repo world state", async () => {
    // Use the actual repo root — we're running inside the shoe-makers repo
    const repoRoot = process.cwd();
    const state = await readWorldState(repoRoot);

    // We should be on the shoemakers branch
    expect(state.branch).toContain("shoemakers");
    expect(typeof state.hasUncommittedChanges).toBe("boolean");

    // Blackboard should have the right shape
    expect(state.blackboard).toHaveProperty("assessment");
    expect(state.blackboard).toHaveProperty("priorities");
    expect(state.blackboard).toHaveProperty("currentTask");
    expect(state.blackboard).toHaveProperty("verification");

    // Inbox count should be a number
    expect(typeof state.inboxCount).toBe("number");

    // Gatekeeping fields should exist
    expect(typeof state.hasUnreviewedCommits).toBe("boolean");
    expect(typeof state.unresolvedCritiqueCount).toBe("number");
  });
});
