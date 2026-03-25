import { describe, test, expect } from "bun:test";
import {
  buildExplorePrompt,
  buildPrioritisePrompt,
  buildExecutePrompt,
  buildDeadCodePrompt,
  buildInnovatePrompt,
  buildEvaluateInsightPrompt,
} from "../prompts/three-phase";
import { makeState, makeAssessment, makeStateWithAssessment } from "./test-utils";

describe("buildExplorePrompt", () => {
  test("without gaps shows no major gaps tier", () => {
    const state = makeState();
    const result = buildExplorePrompt(state);
    expect(result).toContain("No major gaps detected");
    expect(result).toContain("Explore — Survey and Write Candidates");
  });

  test("with gaps shows hygiene/implementation tier", () => {
    const state = makeStateWithAssessment(makeAssessment({ specifiedOnly: 5, implementedUntested: 2 }));
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
    const state = makeStateWithAssessment(makeAssessment({}, {
      processPatterns: { reactiveRatio: 0.7, reviewLoopDetected: false, innovationCycleCount: 0 },
    }));
    const result = buildExplorePrompt(state);
    expect(result).toContain("high reactive ratio (70%)");
    expect(result).toContain("root causes");
  });

  test("with low reactive ratio includes stable signal", () => {
    const state = makeStateWithAssessment(makeAssessment({}, {
      processPatterns: { reactiveRatio: 0.2, reviewLoopDetected: false, innovationCycleCount: 0 },
    }));
    const result = buildExplorePrompt(state);
    expect(result).toContain("stable shift (20% reactive)");
  });

  test("with moderate reactive ratio has no process signal", () => {
    const state = makeStateWithAssessment(makeAssessment({}, {
      processPatterns: { reactiveRatio: 0.45, reviewLoopDetected: false, innovationCycleCount: 0 },
    }));
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
    const state = makeStateWithAssessment(makeAssessment({ specifiedOnly: 3, implementedUntested: 1 }));
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
    expect(result).toContain("never revert the wiki");
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

  test("with article includes article details and article.title in lens format", () => {
    const article = { title: "Ant Colony Optimization", summary: "Ants find shortest paths." };
    const result = buildInnovatePrompt(wikiSummary, article);
    expect(result).toContain("Ant Colony Optimization");
    expect(result).toContain("Ants find shortest paths.");
    expect(result).toContain("**MUST** use the Wikipedia article");
    expect(result).toContain("Start with the article title");
    // article.title should appear in the lens section format
    expect(result).toContain(article.title);
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

  test("requires insight file output and uses divergent/creative mode", () => {
    const result = buildInnovatePrompt(wikiSummary);
    expect(result).toContain(".shoe-makers/insights/");
    expect(result).toContain("No connection found");
    expect(result).toContain("NOT acceptable");
    expect(result).toContain("divergent/creative mode");
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
  test("includes generous disposition, outcomes, and role distinction", () => {
    const result = buildEvaluateInsightPrompt();
    expect(result).toContain("generous disposition");
    expect(result).toContain("constructive/convergent mode");
    expect(result).toContain("Promote");
    expect(result).toContain("Rework");
    expect(result).toContain("Dismiss");
    expect(result).toContain("NOT the prioritise elf");
  });
});
