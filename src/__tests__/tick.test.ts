import { describe, test, expect } from "bun:test";
import { tick } from "../scheduler/tick";
import { emptyBlackboard, freshAssessment, makeState } from "./test-utils";

describe("tick", () => {
  test("returns fix-tests when tests are failing", () => {
    const result = tick(
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: false },
        },
      })
    );
    expect(result.action).toBe("fix-tests");
    expect(result.skill).toBe("fix-tests");
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });

  test("returns inbox when there are messages", () => {
    const result = tick(makeState({ inboxCount: 1 }));
    expect(result.action).toBe("inbox");
  });

  test("returns execute-work-item when work-item.md exists", () => {
    const result = tick(makeState({ hasWorkItem: true }));
    expect(result.action).toBe("execute-work-item");
  });

  test("returns prioritise when candidates.md exists", () => {
    const result = tick(makeState({ hasCandidates: true }));
    expect(result.action).toBe("prioritise");
  });

  test("returns fix-critique when there are unresolved critiques", () => {
    const result = tick(makeState({ unresolvedCritiqueCount: 2 }));
    expect(result.action).toBe("fix-critique");
    expect(result.skill).toBe("fix-critique");
  });

  test("returns critique when there are unreviewed commits", () => {
    const result = tick(makeState({ hasUnreviewedCommits: true }));
    expect(result.action).toBe("critique");
    expect(result.skill).toBe("critique");
  });

  test("fix-critique takes priority over critique", () => {
    const result = tick(makeState({
      unresolvedCritiqueCount: 1,
      hasUnreviewedCommits: true,
    }));
    expect(result.action).toBe("fix-critique");
  });

  test("fix-tests takes priority over fix-critique", () => {
    const result = tick(makeState({
      unresolvedCritiqueCount: 1,
      blackboard: {
        ...emptyBlackboard(),
        assessment: { ...freshAssessment, testsPass: false },
      },
    }));
    expect(result.action).toBe("fix-tests");
  });

  test("returns innovate when everything is current (innovation tier)", () => {
    const result = tick(makeState());
    expect(result.action).toBe("innovate");
    expect(result.skill).toBe("innovate");
  });

  test("returns review when there are uncommitted changes", () => {
    const result = tick(makeState({ hasUncommittedChanges: true }));
    expect(result.action).toBe("review");
    expect(result.skill).toBe("review");
  });

  test("reactive conditions take priority over proactive work", () => {
    // Tests failing AND has candidates → fix-tests wins
    const result = tick(makeState({
      hasCandidates: true,
      blackboard: {
        ...emptyBlackboard(),
        assessment: { ...freshAssessment, testsPass: false },
      },
    }));
    expect(result.action).toBe("fix-tests");
  });

  test("returns fix-tests when typecheck fails", () => {
    const result = tick(
      makeState({
        blackboard: {
          ...emptyBlackboard(),
          assessment: { ...freshAssessment, testsPass: true, typecheckPass: false },
        },
      })
    );
    expect(result.action).toBe("fix-tests");
    expect(result.skill).toBe("fix-tests");
  });

  test("returns dead-code when work item is dead-code type", () => {
    const result = tick(makeState({ hasWorkItem: true, workItemSkillType: "dead-code" }));
    expect(result.action).toBe("dead-code");
    expect(result.skill).toBe("dead-code");
  });

  test("dead-code work item takes priority over regular work item routing", () => {
    // Both hasWorkItem is true and workItemSkillType is "dead-code"
    // dead-code condition (line 86) comes before work-item (line 87) in tree
    const result = tick(makeState({ hasWorkItem: true, workItemSkillType: "dead-code" }));
    expect(result.action).toBe("dead-code");
    expect(result.action).not.toBe("execute-work-item");
  });

  test("returns explore when no assessment exists", () => {
    const result = tick(makeState({
      blackboard: {
        ...emptyBlackboard(),
        assessment: null,
      },
    }));
    expect(result.action).toBe("explore");
  });

  test("always includes timestamp and branch", () => {
    const result = tick(makeState());
    expect(result.timestamp).toBeTruthy();
    expect(result.branch).toBe("shoemakers/2026-03-21");
  });

  test("routes to explore instead of innovate when innovation cycle cap reached", () => {
    const result = tick(makeState({
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0, reviewLoopCount: 0, innovationCycleCount: 5 },
        },
      },
      config: {
        branchPrefix: "shoemakers",
        tickInterval: 5,
        wikiDir: "wiki",
        assessmentStaleAfter: 30,
        maxTicksPerShift: 10,
        enabledSkills: null,
        insightFrequency: 0.3,
        maxInnovationCycles: 3,
      },
    }));
    expect(result.action).toBe("explore");
  });

  test("routes to innovate when below innovation cycle cap", () => {
    const result = tick(makeState({
      blackboard: {
        ...emptyBlackboard(),
        assessment: {
          ...freshAssessment,
          processPatterns: { reactiveRatio: 0, reviewLoopCount: 0, innovationCycleCount: 2 },
        },
      },
      config: {
        branchPrefix: "shoemakers",
        tickInterval: 5,
        wikiDir: "wiki",
        assessmentStaleAfter: 30,
        maxTicksPerShift: 10,
        enabledSkills: null,
        insightFrequency: 0.3,
        maxInnovationCycles: 3,
      },
    }));
    expect(result.action).toBe("innovate");
  });
});
