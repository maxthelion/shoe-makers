import { describe, test, expect } from "bun:test";
import { generatePrompt, parseActionTypeFromPrompt } from "../prompts";
import type { ActionType, WorldState } from "../types";
import { makeState as _makeState, makeAssessment, makeStateWithAssessment } from "./test-utils";

// Local makeState with inboxCount: 2 to match original test expectations
function makeState(): WorldState {
  return _makeState({ inboxCount: 2 });
}

const allActions: ActionType[] = [
  "fix-tests", "fix-critique", "critique", "continue-work", "review",
  "inbox", "execute-work-item", "dead-code", "prioritise", "innovate",
  "evaluate-insight", "explore",
];

describe("parseActionTypeFromPrompt", () => {
  const cases: [string, ActionType][] = [
    ["# Fix Failing Tests\n\nSome prompt text", "fix-tests"],
    ["# Fix Unresolved Critiques\n\nMore text", "fix-critique"],
    ["# Adversarial Review — Critique Previous Elf's Work\n\nText", "critique"],
    ["# Continue Partial Work\n\nText", "continue-work"],
    ["# Review Uncommitted Work\n\nText", "review"],
    ["# Inbox Messages — Act on These First\n\nText", "inbox"],
    ["# Execute Work Item\n\nText", "execute-work-item"],
    ["# Remove Dead Code\n\nText", "dead-code"],
    ["# Prioritise — Pick a Work Item\n\nText", "prioritise"],
    ["# Innovate — Creative Insight from Random Conceptual Collision\n\nText", "innovate"],
    ["# Evaluate Insight — Build on Creative Ideas\n\nText", "evaluate-insight"],
    ["# Explore — Survey and Write Candidates\n\nText", "explore"],
  ];

  for (const [prompt, expected] of cases) {
    test(`parses "${expected}" from prompt title`, () => {
      expect(parseActionTypeFromPrompt(prompt)).toBe(expected);
    });
  }

  test("returns null for unrecognised title", () => {
    expect(parseActionTypeFromPrompt("# Unknown Action\n\nText")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseActionTypeFromPrompt("")).toBeNull();
  });

  test("round-trip: generatePrompt then parseActionTypeFromPrompt for all actions", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      const parsed = parseActionTypeFromPrompt(prompt);
      expect(parsed).toBe(action);
    }
  });
});

describe("critique prompt permission violations", () => {
  test("includes violation warning when violations are present", () => {
    const violations = ["src/types.ts", "wiki/pages/foo.md"];
    const prompt = generatePrompt("critique", makeState(), undefined, undefined, violations);
    expect(prompt).toContain("PERMISSION VIOLATIONS DETECTED");
    expect(prompt).toContain("`src/types.ts`");
    expect(prompt).toContain("`wiki/pages/foo.md`");
    expect(prompt).toContain("outside their permitted scope");
  });

  test("omits violation warning when no violations", () => {
    const prompt = generatePrompt("critique", makeState(), undefined, undefined, []);
    expect(prompt).not.toContain("PERMISSION VIOLATIONS");
  });

  test("omits violation warning when violations undefined", () => {
    const prompt = generatePrompt("critique", makeState());
    expect(prompt).not.toContain("PERMISSION VIOLATIONS");
  });

  test("includes structured critique context when passed through generatePrompt", () => {
    const context = {
      commitRange: "abc123..def456",
      commitLog: "def456 Some commit",
      diff: "diff --git a/src/foo.ts",
      lastAction: "# Fix Tests",
      critiqueFilename: "critique-2026-03-26-001.md",
      permissionViolations: ["src/bad.ts"],
    };
    const prompt = generatePrompt("critique", makeState(), undefined, undefined, undefined, undefined, context);
    expect(prompt).toContain("abc123..def456");
    expect(prompt).toContain("PERMISSION VIOLATIONS");
    expect(prompt).toContain("src/bad.ts");
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

  test("creative lens is only added for explore action", () => {
    const prompt = generatePrompt("fix-tests", makeState(), undefined, { title: "Test", summary: "A".repeat(100) });
    expect(prompt).not.toContain("## Creative Lens");
  });
});

describe("innovate prompt", () => {
  const article = { title: "Mycelial Networks", summary: "Fungi connect trees underground via root networks." };
  const wikiSummary = "Shoe-makers is a behaviour tree system for autonomous overnight codebase improvement.";

  test("with article: MUST use the Wikipedia article and include all required content", () => {
    const prompt = generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary);
    expect(prompt).toContain("Mycelial Networks");
    expect(prompt).toContain("Fungi connect trees underground");
    expect(prompt).toContain("behaviour tree system");
    expect(prompt).toContain("MUST");
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("YYYY-MM-DD-NNN");
    expect(prompt).toContain("No connection found");
    expect(prompt).toContain("NOT acceptable");
    expect(prompt).toContain("divergent/creative mode");
    expect(prompt).toContain("Off-limits");
    expect(prompt).toContain("invariants.md");
    expect(prompt).toContain("**MUST** use the Wikipedia article");
    expect(prompt).toContain("Do not use general knowledge");
    expect(prompt).toContain("## Lens");
    expect(prompt).toContain("[YOUR CONTENT HERE");
    expect(prompt).toContain(article.title);
  });

  test("handles missing article gracefully", () => {
    const noArticlePrompt = generatePrompt("innovate", makeState(), undefined, undefined, undefined, wikiSummary);
    expect(noArticlePrompt).not.toContain("Wikipedia article provided above");
    expect(noArticlePrompt).toContain("No Wikipedia article was available");
    expect(noArticlePrompt).toContain("Pick your own creative lens");
    expect(noArticlePrompt).toContain("MUST");
    expect(noArticlePrompt).toContain(".shoe-makers/insights/");
    expect(noArticlePrompt).toContain("YYYY-MM-DD-NNN");
    expect(noArticlePrompt).toContain("NOT acceptable");
  });
});

describe("evaluate-insight prompt", () => {
  test("includes disposition, outcomes, role, mode, paths, and off-limits", () => {
    const prompt = generatePrompt("evaluate-insight", makeState());
    expect(prompt).toContain("generous disposition");
    expect(prompt).toContain("Promote");
    expect(prompt).toContain("Rework");
    expect(prompt).toContain("Dismiss");
    expect(prompt).toContain("NOT the prioritise elf");
    expect(prompt).toContain("constructive/convergent mode");
    expect(prompt).toContain(".shoe-makers/insights/");
    expect(prompt).toContain("Off-limits");
    expect(prompt).toContain("invariants.md");
  });
});
