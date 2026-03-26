import { describe, test, expect } from "bun:test";
import { buildEvaluateInsightPrompt } from "../prompts/evaluate-insight";

describe("evaluate-insight prompt structured output", () => {
  test("includes pre-filled section headings", () => {
    const prompt = buildEvaluateInsightPrompt();
    expect(prompt).toContain("## Evaluation");
    expect(prompt).toContain("## Build On It");
    expect(prompt).toContain("## Decision");
  });

  test("includes YOUR CONTENT HERE placeholders", () => {
    const prompt = buildEvaluateInsightPrompt();
    expect(prompt).toContain("[YOUR CONTENT HERE");
  });

  test("includes decision options in template", () => {
    const prompt = buildEvaluateInsightPrompt();
    expect(prompt).toContain("promote");
    expect(prompt).toContain("rework");
    expect(prompt).toContain("dismiss");
  });

  test("preserves generous disposition", () => {
    const prompt = buildEvaluateInsightPrompt();
    expect(prompt).toContain("generous disposition");
    expect(prompt).toContain("NOT the prioritise elf");
  });
});
