import { describe, test, expect } from "bun:test";
import { buildCritiquePrompt, type CritiqueContext } from "../prompts/critique";

function makeContext(overrides: Partial<CritiqueContext> = {}): CritiqueContext {
  return {
    commitRange: "abc1234..HEAD",
    commitLog: "def5678 Fix something\nabc1234 Add feature",
    diff: "diff --git a/src/foo.ts b/src/foo.ts\n+const x = 1;",
    lastAction: "# Execute Work Item\n\nDo the thing.",
    critiqueFilename: "critique-2026-03-26-003.md",
    ...overrides,
  };
}

describe("buildCritiquePrompt with structured context", () => {
  test("includes commit range in prompt", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("abc1234..HEAD");
  });

  test("includes commit log inline", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("def5678 Fix something");
    expect(prompt).toContain("abc1234 Add feature");
  });

  test("includes diff inline", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("+const x = 1;");
  });

  test("includes last action inline", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("Do the thing.");
  });

  test("includes auto-numbered critique filename", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("critique-2026-03-26-003.md");
  });

  test("includes structured output template with required sections", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("## Summary");
    expect(prompt).toContain("## Criteria");
    expect(prompt).toContain("### 1. Did the elf stay within its permitted files?");
    expect(prompt).toContain("### 2. Does the code correctly implement what was asked?");
    expect(prompt).toContain("### 3. Do the tests actually verify the behaviour");
    expect(prompt).toContain("### 4. Were any invariants or evidence patterns modified");
    expect(prompt).toContain("### 5. Does the change match the wiki spec?");
    expect(prompt).toContain("## Verdict");
    expect(prompt).toContain("## Status");
    expect(prompt).toContain("Resolved.");
  });

  test("includes YOUR JUDGEMENT HERE placeholders", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("[YOUR JUDGEMENT HERE");
  });

  test("includes permission violations when provided", () => {
    const prompt = buildCritiquePrompt(makeContext({
      permissionViolations: ["wiki/pages/foo.md", "src/bar.ts"],
    }));
    expect(prompt).toContain("PERMISSION VIOLATIONS DETECTED");
    expect(prompt).toContain("wiki/pages/foo.md");
    expect(prompt).toContain("src/bar.ts");
  });

  test("omits violation warning when no violations", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).not.toContain("PERMISSION VIOLATIONS");
  });

  test("includes status format guidance", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain('exactly "Resolved." on its own line');
  });

  test("tells elf to update last-reviewed-commit", () => {
    const prompt = buildCritiquePrompt(makeContext());
    expect(prompt).toContain("last-reviewed-commit");
  });
});

describe("buildCritiquePrompt legacy (backward compat)", () => {
  test("works with no arguments", () => {
    const prompt = buildCritiquePrompt();
    expect(prompt).toContain("Adversarial Review");
    expect(prompt).toContain("last-reviewed-commit");
  });

  test("works with permission violations array", () => {
    const prompt = buildCritiquePrompt(["src/foo.ts"]);
    expect(prompt).toContain("PERMISSION VIOLATIONS DETECTED");
    expect(prompt).toContain("src/foo.ts");
  });

  test("works with empty violations array", () => {
    const prompt = buildCritiquePrompt([]);
    expect(prompt).not.toContain("PERMISSION VIOLATIONS");
    expect(prompt).toContain("Adversarial Review");
  });

  test("legacy prompt instructs elf to run git commands", () => {
    const prompt = buildCritiquePrompt();
    expect(prompt).toContain("git log");
    expect(prompt).toContain("git diff");
  });
});
