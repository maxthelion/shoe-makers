import { describe, test, expect } from "bun:test";
import { evaluate } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";
import type { WorldState } from "../types";

function makeState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    branch: "shoemakers/2026-03-21",
    hasUncommittedChanges: false,
    testsPass: true,
    invariants: {
      specifiedOnly: 0,
      implementedUntested: 0,
      implementedTested: 10,
      unspecified: 0,
    },
    healthScore: 85,
    openPlans: [],
    ...overrides,
  };
}

describe("behaviour tree evaluation", () => {
  test("returns null when everything is green", () => {
    const result = evaluate(defaultTree, makeState());
    expect(result.skill).toBeNull();
  });

  test("failing tests take highest priority", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        testsPass: false,
        invariants: {
          specifiedOnly: 5,
          implementedUntested: 10,
          implementedTested: 0,
          unspecified: 3,
        },
        openPlans: ["add-search"],
      })
    );
    expect(result.skill).toBe("fix");
  });

  test("unfinished work is second priority", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        hasUncommittedChanges: true,
        openPlans: ["add-search"],
      })
    );
    expect(result.skill).toBe("continue");
  });

  test("open plans take priority over invariant gaps", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        openPlans: ["add-search"],
        invariants: {
          specifiedOnly: 5,
          implementedUntested: 10,
          implementedTested: 0,
          unspecified: 3,
        },
      })
    );
    expect(result.skill).toBe("implement-plan");
  });

  test("specified-only invariants trigger implement", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        invariants: {
          specifiedOnly: 5,
          implementedUntested: 0,
          implementedTested: 10,
          unspecified: 0,
        },
      })
    );
    expect(result.skill).toBe("implement");
  });

  test("untested invariants trigger test-coverage", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        invariants: {
          specifiedOnly: 0,
          implementedUntested: 5,
          implementedTested: 10,
          unspecified: 0,
        },
      })
    );
    expect(result.skill).toBe("test-coverage");
  });

  test("unspecified invariants trigger doc-sync", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        invariants: {
          specifiedOnly: 0,
          implementedUntested: 0,
          implementedTested: 10,
          unspecified: 5,
        },
      })
    );
    expect(result.skill).toBe("doc-sync");
  });

  test("low health score triggers octoclean-fix", () => {
    const result = evaluate(
      defaultTree,
      makeState({ healthScore: 45 })
    );
    expect(result.skill).toBe("octoclean-fix");
  });
});
