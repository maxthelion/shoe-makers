import { describe, test, expect } from "bun:test";
import { buildInnovatePrompt } from "../prompts/innovate";

const wikiSummary = "Shoe-makers is a behaviour tree system.";

describe("innovate prompt structured output", () => {
  test("includes pre-filled section headings", () => {
    const article = { title: "Ant Colony Optimization", summary: "Ants find shortest paths." };
    const prompt = buildInnovatePrompt(wikiSummary, article);
    expect(prompt).toContain("## Lens");
    expect(prompt).toContain("## Connection");
    expect(prompt).toContain("## Proposal");
    expect(prompt).toContain("## Why");
  });

  test("includes YOUR CONTENT HERE placeholders", () => {
    const prompt = buildInnovatePrompt(wikiSummary);
    expect(prompt).toContain("[YOUR CONTENT HERE");
  });

  test("with-article variant includes article title in template", () => {
    const article = { title: "Ant Colony Optimization", summary: "Ants find shortest paths." };
    const prompt = buildInnovatePrompt(wikiSummary, article);
    expect(prompt).toContain("**Ant Colony Optimization** —");
    expect(prompt).toContain("[YOUR CONTENT HERE — describe what this article is about");
  });

  test("without-article variant includes self-chosen lens placeholder", () => {
    const prompt = buildInnovatePrompt(wikiSummary);
    expect(prompt).toContain("[YOUR CONTENT HERE — pick a concept from an unexpected domain");
  });

  test("includes insight file path pattern", () => {
    const prompt = buildInnovatePrompt(wikiSummary);
    expect(prompt).toContain(".shoe-makers/insights/YYYY-MM-DD-NNN.md");
  });
});
