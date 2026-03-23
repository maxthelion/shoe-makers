import { describe, test, expect } from "bun:test";
import { evaluate, evaluateWithTrace, formatTrace } from "../tree/evaluate";
import { defaultTree } from "../tree/default-tree";
import type { WorldState, Blackboard, Config } from "../types";
import { emptyBlackboard, freshAssessment, makeState } from "./test-utils";

function failingTestsBlackboard(): Blackboard {
  return { ...emptyBlackboard(), assessment: { ...freshAssessment, testsPass: false } };
}

describe("evaluate edge cases", () => {
  test("selector with no successful children returns failure", () => {
    const result = evaluate(
      {
        type: "selector",
        name: "test-selector",
        children: [
          {
            type: "condition",
            name: "always-false",
            condition: { name: "always-false", check: () => false },
          },
        ],
      },
      makeState()
    );
    expect(result.status).toBe("failure");
    expect(result.skill).toBeNull();
  });

  test("sequence with only conditions (no actions) returns success with null skill", () => {
    const result = evaluate(
      {
        type: "sequence",
        name: "test-sequence",
        children: [
          {
            type: "condition",
            name: "always-true",
            condition: { name: "always-true", check: () => true },
          },
        ],
      },
      makeState()
    );
    expect(result.status).toBe("success");
    expect(result.skill).toBeNull();
  });

  test("condition node with missing condition returns failure", () => {
    const result = evaluate(
      { type: "condition", name: "no-condition" },
      makeState()
    );
    expect(result.status).toBe("failure");
    expect(result.skill).toBeNull();
  });

  test("action node with no skill returns success with null skill", () => {
    const result = evaluate(
      { type: "action", name: "no-skill" },
      makeState()
    );
    expect(result.status).toBe("success");
    expect(result.skill).toBeNull();
  });
});

describe("selector and sequence evaluation", () => {
  test("selector tries children in order and returns first success", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        blackboard: failingTestsBlackboard(),
      })
    );
    expect(result.skill).toBe("fix-tests");
    expect(result.status).toBe("success");
  });

  test("selector falls through when condition fails", () => {
    // Tests pass, no uncommitted changes, no inbox, innovation tier → falls through to innovate
    const result = evaluate(defaultTree, makeState());
    expect(result.skill).toBe("innovate");
  });
});

describe("verification model: commit or revert", () => {
  test("review action handles uncommitted changes for commit or revert decision", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUncommittedChanges: true })
    );
    expect(result.skill).toBe("review");
  });
});

describe("cross-elf gatekeeping", () => {
  test("returns fix-critique when there are unresolved critiques", () => {
    const result = evaluate(
      defaultTree,
      makeState({ unresolvedCritiqueCount: 2 })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("returns critique when there are unreviewed commits", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUnreviewedCommits: true })
    );
    expect(result.skill).toBe("critique");
  });

  test("fix-critique takes priority over critique", () => {
    const result = evaluate(
      defaultTree,
      makeState({ unresolvedCritiqueCount: 1, hasUnreviewedCommits: true })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("critiques take priority over inbox and work-item", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        unresolvedCritiqueCount: 1,
        inboxCount: 3,
        hasWorkItem: true,
      })
    );
    expect(result.skill).toBe("fix-critique");
  });

  test("unreviewed commits take priority over inbox", () => {
    const result = evaluate(
      defaultTree,
      makeState({ hasUnreviewedCommits: true, inboxCount: 2 })
    );
    expect(result.skill).toBe("critique");
  });

  test("fix-tests still takes priority over critiques", () => {
    const result = evaluate(
      defaultTree,
      makeState({
        unresolvedCritiqueCount: 1,
        blackboard: failingTestsBlackboard(),
      })
    );
    expect(result.skill).toBe("fix-tests");
  });
});

describe("game-style behaviour tree — routing", () => {
  const routingCases: [string, Partial<WorldState>, string][] = [
    ["fix-tests when tests failing", { blackboard: failingTestsBlackboard() }, "fix-tests"],
    ["review when uncommitted changes", { hasUncommittedChanges: true }, "review"],
    ["inbox when inbox messages", { inboxCount: 2 }, "inbox"],
    ["execute-work-item when work-item exists", { hasWorkItem: true }, "execute-work-item"],
    ["dead-code when work item has dead-code type", { hasWorkItem: true, workItemSkillType: "dead-code" }, "dead-code"],
    ["execute-work-item when work item has null skill type", { hasWorkItem: true, workItemSkillType: null }, "execute-work-item"],
    ["prioritise when candidates exist", { hasCandidates: true }, "prioritise"],
    ["evaluate-insight when insights exist", { insightCount: 2 }, "evaluate-insight"],
    ["innovate when nothing else matches (innovation tier)", {}, "innovate"],
    ["explore when no assessment (not innovation tier)", { blackboard: emptyBlackboard() }, "explore"],
  ];

  for (const [label, overrides, expected] of routingCases) {
    test(`returns ${label}`, () => {
      const result = evaluate(defaultTree, makeState(overrides));
      expect(result.skill).toBe(expected);
    });
  }
});

describe("evaluateWithTrace", () => {
  test("returns same skill as evaluate for default state", () => {
    const state = makeState();
    const evalResult = evaluate(defaultTree, state);
    const traceResult = evaluateWithTrace(defaultTree, state);
    expect(traceResult.skill).toBe(evalResult.skill);
    expect(traceResult.status).toBe(evalResult.status);
  });

  test("returns same skill as evaluate when tests failing", () => {
    const state = makeState({ blackboard: failingTestsBlackboard() });
    const evalResult = evaluate(defaultTree, state);
    const traceResult = evaluateWithTrace(defaultTree, state);
    expect(traceResult.skill).toBe(evalResult.skill);
  });

  test("trace records all conditions up to winning one when innovate wins (default state is innovation tier)", () => {
    const state = makeState();
    const { trace } = evaluateWithTrace(defaultTree, state);
    // Default state has all invariants met → innovation tier → innovate fires
    const winner = trace.find(e => e.passed);
    expect(winner).toBeDefined();
    expect(winner!.skill).toBe("innovate");
    // All preceding conditions should have failed
    for (const entry of trace) {
      if (entry === winner) break;
      expect(entry.passed).toBe(false);
    }
  });

  test("trace stops at first passing condition", () => {
    const state = makeState({ blackboard: failingTestsBlackboard() });
    const { trace } = evaluateWithTrace(defaultTree, state);
    expect(trace.length).toBe(1);
    expect(trace[0].passed).toBe(true);
    expect(trace[0].skill).toBe("fix-tests");
  });

  test("trace records correct condition names", () => {
    const state = makeState();
    const { trace } = evaluateWithTrace(defaultTree, state);
    const names = trace.map((e) => e.condition);
    expect(names).toContain("tests-failing");
    expect(names).toContain("unresolved-critiques");
    expect(names).toContain("unreviewed-commits");
    expect(names).toContain("innovation-tier");
  });

  test("trace for mid-tree match records failed conditions before winner", () => {
    const state = makeState({ hasWorkItem: true });
    const { trace } = evaluateWithTrace(defaultTree, state);
    const winner = trace.find((e) => e.passed);
    expect(winner).toBeDefined();
    expect(winner!.skill).toBe("execute-work-item");
    // Should have failed conditions before the winner
    const failedBefore = trace.filter((e) => !e.passed);
    expect(failedBefore.length).toBeGreaterThan(0);
  });
});

describe("formatTrace", () => {
  test("uses check mark for passing condition", () => {
    const output = formatTrace([{ condition: "tests-failing", passed: true, skill: "fix-tests" }]);
    expect(output).toContain("✓");
    expect(output).toContain("tests-failing");
    expect(output).toContain("→ fix-tests");
  });

  test("uses cross mark for failing condition", () => {
    const output = formatTrace([{ condition: "tests-failing", passed: false, skill: "fix-tests" }]);
    expect(output).toContain("✗");
    expect(output).toContain("tests-failing");
    expect(output).not.toContain("→");
  });

  test("formats multiple entries on separate lines", () => {
    const output = formatTrace([
      { condition: "tests-failing", passed: false, skill: "fix-tests" },
      { condition: "explore", passed: true, skill: "explore" },
    ]);
    const lines = output.split("\n");
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("✗");
    expect(lines[1]).toContain("✓");
  });
});

describe("game-style behaviour tree — priority ordering", () => {
  const priorityCases: [string, Partial<WorldState>, string][] = [
    ["fix-tests over review", { hasUncommittedChanges: true, blackboard: failingTestsBlackboard() }, "fix-tests"],
    ["work-item over candidates", { hasWorkItem: true, hasCandidates: true }, "execute-work-item"],
    ["inbox over work-item", { inboxCount: 1, hasWorkItem: true }, "inbox"],
    ["fix-tests over everything", { hasUncommittedChanges: true, inboxCount: 3, hasWorkItem: true, hasCandidates: true, blackboard: failingTestsBlackboard() }, "fix-tests"],
  ];

  for (const [label, overrides, expected] of priorityCases) {
    test(`${label}`, () => {
      const result = evaluate(defaultTree, makeState(overrides));
      expect(result.skill).toBe(expected);
    });
  }
});
