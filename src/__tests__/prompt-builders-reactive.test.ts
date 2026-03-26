import { describe, test, expect } from "bun:test";
import {
  buildFixTestsPrompt,
  buildFixCritiquePrompt,
  buildCritiquePrompt,
  buildReviewPrompt,
  buildInboxPrompt,
} from "../prompts/reactive";
import { makeState } from "./test-utils";

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
