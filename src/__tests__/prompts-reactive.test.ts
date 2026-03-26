import { describe, test, expect } from "bun:test";
import { generatePrompt } from "../prompts";
import { makeState, expectPromptContains } from "./prompts-test-helpers";

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
});
