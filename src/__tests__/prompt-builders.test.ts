import { describe, test, expect } from "bun:test";
import {
  buildFixTestsPrompt,
  buildFixCritiquePrompt,
  buildCritiquePrompt,
  buildReviewPrompt,
  buildInboxPrompt,
} from "../prompts/reactive";
import {
  buildExplorePrompt,
  buildPrioritisePrompt,
  buildExecutePrompt,
  buildDeadCodePrompt,
  buildInnovatePrompt,
  buildEvaluateInsightPrompt,
} from "../prompts/three-phase";
import { makeState, freshAssessment } from "./test-utils";
import type { Assessment } from "../types";

// ---------- reactive.ts ----------

describe("buildFixTestsPrompt", () => {
  test("includes skill section when provided", () => {
    const result = buildFixTestsPrompt("\n\n## Skill: fix-tests\n\nFix stuff.");
    expect(result).toContain("## Skill: fix-tests");
    expect(result).toContain("Fix stuff.");
  });

  test("includes off-limits section", () => {
    const result = buildFixTestsPrompt("");
    expect(result).toContain("Off-limits");
    expect(result).toContain("invariants.md");
  });

  test("includes core instructions", () => {
    const result = buildFixTestsPrompt("");
    expect(result).toContain("bun test");
    expect(result).toContain("Fix Failing Tests");
  });
});

describe("buildFixCritiquePrompt", () => {
  test("includes critique resolution instructions", () => {
    const result = buildFixCritiquePrompt();
    expect(result).toContain("Fix Unresolved Critiques");
    expect(result).toContain("critique-");
    expect(result).toContain("Resolved");
  });

  test("includes off-limits", () => {
    const result = buildFixCritiquePrompt();
    expect(result).toContain("Off-limits");
  });
});

describe("buildCritiquePrompt", () => {
  test("without violations has no warning", () => {
    const result = buildCritiquePrompt();
    expect(result).not.toContain("PERMISSION VIOLATIONS");
    expect(result).toContain("Adversarial Review");
  });

  test("with empty violations has no warning", () => {
    const result = buildCritiquePrompt([]);
    expect(result).not.toContain("PERMISSION VIOLATIONS");
  });

  test("with violations includes warning and file list", () => {
    const result = buildCritiquePrompt(["src/foo.ts", "wiki/bar.md"]);
    expect(result).toContain("PERMISSION VIOLATIONS");
    expect(result).toContain("src/foo.ts");
    expect(result).toContain("wiki/bar.md");
  });

  test("includes review steps", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("last-action.md");
    expect(result).toContain("last-reviewed-commit");
    expect(result).toContain("git log");
    expect(result).toContain("git diff");
  });

  test("reviewers cannot modify src or wiki", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("reviewers can only write findings");
  });

  test("includes all 5 wiki verification criteria", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("Did the elf stay within its permitted files");
    expect(result).toContain("Does the code correctly implement what was asked");
    expect(result).toContain("Do the tests actually verify the behaviour");
    expect(result).toContain("Were any invariants or evidence patterns modified to game the system");
    expect(result).toContain("Does the change match the wiki spec");
  });

  test("includes clean pass guidance", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("Not every review must find problems");
  });

  test("requires verdict format with Compliant/Non-compliant", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("Compliant");
    expect(result).toContain("Non-compliant");
  });
});

describe("buildReviewPrompt", () => {
  test("includes review instructions", () => {
    const result = buildReviewPrompt();
    expect(result).toContain("Review Uncommitted Work");
    expect(result).toContain("git diff");
  });

  test("includes structured criteria", () => {
    const result = buildReviewPrompt();
    expect(result).toContain("Does the code correctly implement what was asked");
    expect(result).toContain("Are there tests for the changes");
    expect(result).toContain("Does the change match the wiki spec");
  });
});

describe("buildInboxPrompt", () => {
  test("includes inbox count", () => {
    const state = makeState({ inboxCount: 3 });
    const result = buildInboxPrompt(state);
    expect(result).toContain("3 message(s)");
  });

  test("includes inbox directory", () => {
    const state = makeState({ inboxCount: 1 });
    const result = buildInboxPrompt(state);
    expect(result).toContain(".shoe-makers/inbox/");
  });
});

// ---------- three-phase.ts ----------

describe("buildExplorePrompt", () => {
  test("without gaps shows no major gaps tier", () => {
    const state = makeState();
    const result = buildExplorePrompt(state);
    expect(result).toContain("No major gaps detected");
    expect(result).toContain("Explore — Survey and Write Candidates");
  });

  test("with gaps shows hygiene/implementation tier", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      invariants: {
        ...freshAssessment.invariants!,
        specifiedOnly: 5,
        implementedUntested: 2,
      },
    };
    const state = makeState({
      blackboard: { assessment, priorities: null, currentTask: null, verification: null },
    });
    const result = buildExplorePrompt(state);
    expect(result).toContain("5 unimplemented spec claim(s)");
    expect(result).toContain("2 untested claim(s)");
  });

  test("with article includes creative lens", () => {
    const state = makeState();
    const article = { title: "Mycelium Networks", summary: "Fungi form vast underground networks." };
    const result = buildExplorePrompt(state, undefined, article);
    expect(result).toContain("Creative Lens");
    expect(result).toContain("Mycelium Networks");
    expect(result).toContain("Fungi form vast underground networks.");
  });

  test("without article has no creative lens", () => {
    const state = makeState();
    const result = buildExplorePrompt(state);
    expect(result).not.toContain("Creative Lens");
  });

  test("with high reactive ratio includes process signal", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      processPatterns: {
        reactiveRatio: 0.7,
        reviewLoopCount: 0,
        innovationCycleCount: 0,
      },
    };
    const state = makeState({
      blackboard: { assessment, priorities: null, currentTask: null, verification: null },
    });
    const result = buildExplorePrompt(state);
    expect(result).toContain("high reactive ratio (70%)");
    expect(result).toContain("root causes");
  });

  test("with low reactive ratio includes stable signal", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      processPatterns: {
        reactiveRatio: 0.2,
        reviewLoopCount: 0,
        innovationCycleCount: 0,
      },
    };
    const state = makeState({
      blackboard: { assessment, priorities: null, currentTask: null, verification: null },
    });
    const result = buildExplorePrompt(state);
    expect(result).toContain("stable shift (20% reactive)");
  });

  test("with moderate reactive ratio has no process signal", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      processPatterns: {
        reactiveRatio: 0.45,
        reviewLoopCount: 0,
        innovationCycleCount: 0,
      },
    };
    const state = makeState({
      blackboard: { assessment, priorities: null, currentTask: null, verification: null },
    });
    const result = buildExplorePrompt(state);
    expect(result).not.toContain("Process signal");
  });

  test("includes candidates output format", () => {
    const state = makeState();
    const result = buildExplorePrompt(state);
    expect(result).toContain("candidates.md");
    expect(result).toContain("at least 3 candidates");
  });
});

describe("buildPrioritisePrompt", () => {
  test("without gaps prefers implementation and creative work", () => {
    const state = makeState();
    const result = buildPrioritisePrompt(state);
    expect(result).toContain("Prefer implementation, improvement, and creative work");
    expect(result).toContain("Prioritise — Pick a Work Item");
  });

  test("with gaps prefers closing gaps", () => {
    const assessment: Assessment = {
      ...freshAssessment,
      invariants: {
        ...freshAssessment.invariants!,
        specifiedOnly: 3,
        implementedUntested: 1,
      },
    };
    const state = makeState({
      blackboard: { assessment, priorities: null, currentTask: null, verification: null },
    });
    const result = buildPrioritisePrompt(state);
    expect(result).toContain("3 unimplemented spec claim(s)");
    expect(result).toContain("1 untested claim(s)");
    expect(result).toContain("close these gaps");
  });

  test("includes work item format instructions", () => {
    const state = makeState();
    const result = buildPrioritisePrompt(state);
    expect(result).toContain("work-item.md");
    expect(result).toContain("skill-type");
    expect(result).toContain("Decision Rationale");
  });
});

describe("buildExecutePrompt", () => {
  test("includes skill section", () => {
    const result = buildExecutePrompt("\n\n## Skill: implement\n\nBuild it.");
    expect(result).toContain("## Skill: implement");
    expect(result).toContain("Build it.");
  });

  test("includes core instructions", () => {
    const result = buildExecutePrompt("");
    expect(result).toContain("Execute Work Item");
    expect(result).toContain("work-item.md");
    expect(result).toContain("bun test");
  });

  test("includes wiki-wins-over-code rule", () => {
    const result = buildExecutePrompt("");
    expect(result).toContain("wiki is always the source of truth");
  });
});

describe("buildDeadCodePrompt", () => {
  test("includes dead code removal instructions", () => {
    const result = buildDeadCodePrompt("");
    expect(result).toContain("Remove Dead Code");
    expect(result).toContain("grep for all references");
    expect(result).toContain("permitted to delete test files");
  });

  test("includes skill section", () => {
    const result = buildDeadCodePrompt("\n\n## Skill: dead-code\n\nRemove it.");
    expect(result).toContain("## Skill: dead-code");
  });
});

describe("buildInnovatePrompt", () => {
  const wikiSummary = "Shoe-makers is a behaviour tree system.";

  test("with article includes article details", () => {
    const article = { title: "Ant Colony Optimization", summary: "Ants find shortest paths." };
    const result = buildInnovatePrompt(wikiSummary, article);
    expect(result).toContain("Ant Colony Optimization");
    expect(result).toContain("Ants find shortest paths.");
    expect(result).toContain("**MUST** use the Wikipedia article");
  });

  test("without article prompts self-chosen lens", () => {
    const result = buildInnovatePrompt(wikiSummary);
    expect(result).toContain("No Wikipedia article was available");
    expect(result).toContain("Pick a concept");
    expect(result).toContain("unrelated to software engineering");
  });

  test("includes wiki summary", () => {
    const result = buildInnovatePrompt(wikiSummary);
    expect(result).toContain("Shoe-makers is a behaviour tree system.");
  });

  test("requires insight file output", () => {
    const result = buildInnovatePrompt(wikiSummary);
    expect(result).toContain(".shoe-makers/insights/");
    expect(result).toContain("No connection found");
    expect(result).toContain("NOT acceptable");
  });

  test("includes required insight sections", () => {
    const article = { title: "Test Article", summary: "Test summary." };
    const result = buildInnovatePrompt(wikiSummary, article);
    expect(result).toContain("Lens");
    expect(result).toContain("Connection");
    expect(result).toContain("Proposal");
  });
});

describe("buildEvaluateInsightPrompt", () => {
  test("has generous disposition", () => {
    const result = buildEvaluateInsightPrompt();
    expect(result).toContain("generous disposition");
    expect(result).toContain("constructive/convergent");
  });

  test("includes three outcomes", () => {
    const result = buildEvaluateInsightPrompt();
    expect(result).toContain("Promote");
    expect(result).toContain("Rework");
    expect(result).toContain("Dismiss");
  });

  test("distinguishes from prioritise elf", () => {
    const result = buildEvaluateInsightPrompt();
    expect(result).toContain("NOT the prioritise elf");
  });
});
