import { describe, test, expect } from "bun:test";
import { generatePrompt } from "../prompts";
import { makeStateWith } from "./test-utils";
import { makeState, allActions, expectPromptContains, makeSkillMap, makeSkill } from "./prompts-test-helpers";

describe("explore prompt creative lens", () => {
  test("includes creative lens section when article provided", () => {
    const article = { title: "Fractal Geometry", summary: "Fractals are self-similar patterns..." };
    const prompt = generatePrompt("explore", makeState(), undefined, article);
    expect(prompt).toContain("## Creative Lens");
    expect(prompt).toContain("Fractal Geometry");
    expect(prompt).toContain("Fractals are self-similar patterns...");
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("does NOT include creative lens when no article provided", () => {
    expectPromptContains("explore", makeState(), [], ["## Creative Lens"]);
  });

  test("creative lens is only added for explore action", () => {
    const prompt = generatePrompt("fix-tests", makeState(), undefined, { title: "Test", summary: "A".repeat(100) });
    expect(prompt).not.toContain("## Creative Lens");
  });
});

describe("explore prompt process temperature", () => {
  test("includes high reactive ratio guidance when ratio > 0.6", () => {
    const state = makeStateWith({ processPatterns: { reactiveRatio: 0.75, reviewLoopCount: 0, innovationCycleCount: 0 } });
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("high reactive ratio");
    expect(prompt).toContain("75%");
    expect(prompt).toContain("root causes");
  });

  test("includes stability guidance when ratio < 0.3", () => {
    const state = makeStateWith({ processPatterns: { reactiveRatio: 0.1, reviewLoopCount: 0, innovationCycleCount: 0 } });
    const prompt = generatePrompt("explore", state);
    expect(prompt).toContain("stable shift");
    expect(prompt).toContain("10%");
    expect(prompt).toContain("ambitious");
  });

  test("no extra guidance when ratio is moderate", () => {
    const state = makeStateWith({ processPatterns: { reactiveRatio: 0.45, reviewLoopCount: 0, innovationCycleCount: 0 } });
    const prompt = generatePrompt("explore", state);
    expect(prompt).not.toContain("high reactive ratio");
    expect(prompt).not.toContain("stable shift");
    expect(prompt).not.toContain("Process signal");
  });

  test("no extra guidance when processPatterns is missing", () => {
    const state = makeState();
    const prompt = generatePrompt("explore", state);
    expect(prompt).not.toContain("Process signal");
  });
});

describe("explore and prioritise tier switching", () => {
  const tierCases: [string, import("../types").ActionType, () => import("../types").WorldState, string[], string[]][] = [
    ["explore shows no-gaps tier when no gaps", "explore", () => makeStateWith({ invariants: { specifiedOnly: 0, implementedUntested: 0 } }), ["No major gaps"], []],
    ["explore shows Hygiene/Implementation tier when spec gaps exist", "explore", () => makeStateWith({ invariants: { specifiedOnly: 5, implementedUntested: 0 } }), ["Hygiene / Implementation", "unimplemented spec claim"], []],
    ["prioritise shows gap guidance when spec gaps exist", "prioritise", () => makeStateWith({ invariants: { specifiedOnly: 5, implementedUntested: 0 } }), ["unimplemented spec claim"], []],
    ["prioritise shows innovation guidance when no gaps", "prioritise", () => makeStateWith({ invariants: { specifiedOnly: 0, implementedUntested: 0 } }), ["highest impact"], []],
    ["explore Hygiene tier includes top spec gap descriptions", "explore", () => makeStateWith({ invariants: { specifiedOnly: 3, implementedUntested: 0, topSpecGaps: [{ id: "foo", description: "gap", group: "core" }] } }), ["gap", "Top invariant gaps"], []],
    ["prioritise includes top spec gap descriptions when gaps exist", "prioritise", () => makeStateWith({ invariants: { specifiedOnly: 3, implementedUntested: 0, topSpecGaps: [{ id: "foo", description: "gap", group: "core" }] } }), ["Top invariant gaps", "gap"], []],
    ["prioritise does not include gap details when no gaps", "prioritise", () => makeStateWith({ invariants: { specifiedOnly: 0, implementedUntested: 0 } }), [], ["Top invariant gaps"]],
  ];

  for (const [label, action, stateFactory, contains, notContains] of tierCases) {
    test(label, () => {
      expectPromptContains(action, stateFactory(), contains, notContains);
    });
  }

  test("explore uses specifiedOnly count to determine tier", () => {
    const promptWithGaps = generatePrompt("explore", makeStateWith({ invariants: { specifiedOnly: 3, implementedUntested: 0 } }));
    expect(promptWithGaps).toContain("3 unimplemented spec claim");

    const promptNoGaps = generatePrompt("explore", makeStateWith({ invariants: { specifiedOnly: 0, implementedUntested: 0 } }));
    expect(promptNoGaps).not.toContain("unimplemented spec claim");
  });
});

describe("explore prompt skill catalog", () => {
  test("includes skill catalog when skills are provided", () => {
    const skills = makeSkillMap(
      makeSkill({ name: "implement", mapsTo: "implement", description: "Implement features" }),
      makeSkill({ name: "fix-tests", mapsTo: "fix", description: "Fix failing tests" }),
    );
    const prompt = generatePrompt("explore", makeState(), skills);
    expect(prompt).toContain("Available skills");
    expect(prompt).toContain("implement");
    expect(prompt).toContain("fix-tests");
  });

  test("omits skill catalog when no skills provided", () => {
    expectPromptContains("explore", makeState(), [], ["Available skills"]);
  });
});

describe("insight lifecycle in prompts", () => {
  const article = { title: "Mycelial Networks", summary: "Fungi connect trees underground." };

  test("explore prompt includes creative lens when article provided", () => {
    const prompt = generatePrompt("explore", makeState(), undefined, article);
    expect(prompt).toContain("Creative Lens");
    expect(prompt).toContain("Mycelial Networks");
    expect(prompt).toContain("Fungi connect trees underground.");
  });

  test("explore prompt omits creative lens when no article", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).not.toContain("Creative Lens");
  });

  test("explore prompt mentions writing insights to .shoe-makers/insights/", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("evaluate-insight prompt mentions reading insights from .shoe-makers/insights/", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("innovate and evaluate-insight reference the same insight path", () => {
    const innovatePrompt = generatePrompt("innovate", makeState());
    const evaluatePrompt = generatePrompt("evaluate-insight", makeState());
    const insightPath = ".shoe-makers/insights/";
    expect(innovatePrompt).toContain(insightPath);
    expect(evaluatePrompt).toContain(insightPath);
  });

  test("explore prompt mentions insight file naming format", () => {
    const prompt = generatePrompt("explore", makeState());
    expect(prompt).toContain("YYYY-MM-DD");
  });
});

describe("innovate prompt", () => {
  const article = { title: "Mycelial Networks", summary: "Fungi connect trees underground via root networks." };
  const wikiSummary = "Shoe-makers is a behaviour tree system for autonomous overnight codebase improvement.";

  test("includes wiki summary and article", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("Mycelial Networks");
    expect(prompt).toContain("Fungi connect trees underground");
    expect(prompt).toContain("behaviour tree system");
  });

  test("mandates writing an insight file", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("MUST");
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("YYYY-MM-DD-NNN");
  });

  test("says no connection found is not acceptable", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("No connection found");
    expect(prompt).toContain("NOT acceptable");
  });

  test("mentions divergent/creative mode", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("divergent/creative mode");
  });

  test("mentions off-limits", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("Off-limits");
    expect(prompt).toContain("invariants.md");
  });

  test("requires Wikipedia article as the lens — MUST use the Wikipedia article", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("**MUST** use the Wikipedia article");
    expect(prompt).toContain("Do not use general knowledge");
  });

  test("Lens section uses pre-filled article title in template", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("**Mycelial Networks** —");
    expect(prompt).toContain("[YOUR CONTENT HERE");
  });

  test("Lens section references article.title", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("Lens");
    expect(prompt).toContain(article.title);
  });

  test("handles missing article gracefully", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, undefined, undefined, wikiSummary);
    expect(prompt).not.toContain("Wikipedia article provided above");
    expect(prompt).toContain("No Wikipedia article was available");
    expect(prompt).toContain("Pick your own creative lens");
    expect(prompt).toContain("MUST");
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("still requires insight file when no article", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, undefined, undefined, wikiSummary);
    expect(prompt).toContain("YYYY-MM-DD-NNN");
    expect(prompt).toContain("NOT acceptable");
  });
});

describe("evaluate-insight prompt", () => {
  test("mentions generous disposition", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain("generous disposition");
  });

  test("mentions promote, rework, dismiss actions", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain("Promote");
    expect(prompt).toContain("Rework");
    expect(prompt).toContain("Dismiss");
  });

  test("says it is NOT the prioritise elf", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain("NOT the prioritise elf");
  });

  test("mentions constructive/convergent mode", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain("constructive/convergent mode");
  });

  test("mentions reading insights directory", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain(".shoe-makers/insights/");
  });

  test("mentions off-limits", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain("Off-limits");
    expect(prompt).toContain("invariants.md");
  });
});
