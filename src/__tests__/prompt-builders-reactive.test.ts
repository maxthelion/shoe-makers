import { describe, test, expect } from "bun:test";
import {
  buildFixTestsPrompt,
  buildFixCritiquePrompt,
  buildCritiquePrompt,
  buildContinueWorkPrompt,
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
  test("includes review process steps, scope restrictions, and verdict format", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("Adversarial Review");
    expect(result).toContain("last-action.md");
    expect(result).toContain("last-reviewed-commit");
    expect(result).toContain("git log");
    expect(result).toContain("git diff");
    expect(result).toContain("reviewers can only write findings");
    expect(result).toContain("Not every review must find problems");
    expect(result).toContain("Compliant");
    expect(result).toContain("Non-compliant");
  });

  test("includes all 5 wiki verification criteria", () => {
    const result = buildCritiquePrompt();
    expect(result).toContain("Did the elf stay within its permitted files");
    expect(result).toContain("Does the code correctly implement what was asked");
    expect(result).toContain("Do the tests actually verify the behaviour");
    expect(result).toContain("Were any invariants or evidence patterns modified to game the system");
    expect(result).toContain("Does the change match the wiki spec");
  });

  test("without violations has no warning", () => {
    expect(buildCritiquePrompt()).not.toContain("PERMISSION VIOLATIONS");
    expect(buildCritiquePrompt([])).not.toContain("PERMISSION VIOLATIONS");
  });

  test("with violations includes warning and file list", () => {
    const result = buildCritiquePrompt(["src/foo.ts", "wiki/bar.md"]);
    expect(result).toContain("PERMISSION VIOLATIONS");
    expect(result).toContain("src/foo.ts");
    expect(result).toContain("wiki/bar.md");
  });

  test("includes validation patterns when provided", () => {
    const result = buildCritiquePrompt([], ["bun test passes", "tests cover the new functionality"]);
    expect(result).toContain("Validation patterns to check");
    expect(result).toContain("`bun test passes`");
    expect(result).toContain("`tests cover the new functionality`");
  });

  test("omits validation section when patterns empty or undefined", () => {
    expect(buildCritiquePrompt([], [])).not.toContain("Validation patterns");
    expect(buildCritiquePrompt()).not.toContain("Validation patterns");
  });

  test("includes both violation warning and validation patterns", () => {
    const result = buildCritiquePrompt(["src/foo.ts"], ["bun test passes"]);
    expect(result).toContain("PERMISSION VIOLATIONS");
    expect(result).toContain("Validation patterns to check");
    expect(result).toContain("`bun test passes`");
  });
});

describe("buildContinueWorkPrompt", () => {
  test("includes partial-work.md instructions", () => {
    const result = buildContinueWorkPrompt();
    expect(result).toContain("Continue Partial Work");
    expect(result).toContain("partial-work.md");
    expect(result).toContain("bun test");
  });

  test("tells elf to delete partial-work.md when done", () => {
    const result = buildContinueWorkPrompt();
    expect(result).toContain("delete");
    expect(result).toContain("partial-work.md");
  });

  test("includes off-limits", () => {
    const result = buildContinueWorkPrompt();
    expect(result).toContain("Off-limits");
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
