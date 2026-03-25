import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { runSkill } from "../scheduler/run-skill";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-run-skill-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("runSkill", () => {
  test("returns descriptive message for fix-tests", async () => {
    const result = await runSkill(tempDir, "fix-tests");
    expect(result).toContain("fix-tests");
  });

  test("returns descriptive message for fix-critique", async () => {
    const result = await runSkill(tempDir, "fix-critique");
    expect(result).toContain("fix-critique");
    expect(result).toContain("critique");
  });

  test("returns descriptive message for critique", async () => {
    const result = await runSkill(tempDir, "critique");
    expect(result).toContain("critique");
    expect(result).toContain("adversarially");
  });

  test("returns descriptive message for review", async () => {
    const result = await runSkill(tempDir, "review");
    expect(result).toContain("review");
  });

  test("returns descriptive message for inbox", async () => {
    const result = await runSkill(tempDir, "inbox");
    expect(result).toContain("inbox");
  });

  test("returns descriptive message for execute-work-item", async () => {
    const result = await runSkill(tempDir, "execute-work-item");
    expect(result).toContain("execute-work-item");
    expect(result).toContain("work-item.md");
  });

  test("returns descriptive message for prioritise", async () => {
    const result = await runSkill(tempDir, "prioritise");
    expect(result).toContain("prioritise");
    expect(result).toContain("candidates.md");
  });

  test("returns descriptive message for innovate", async () => {
    const result = await runSkill(tempDir, "innovate");
    expect(result).toContain("innovate");
    expect(result).toContain("insight");
  });

  test("returns descriptive message for evaluate-insight", async () => {
    const result = await runSkill(tempDir, "evaluate-insight");
    expect(result).toContain("evaluate-insight");
    expect(result).toContain("insight");
  });

  test("returns descriptive message for dead-code", async () => {
    const result = await runSkill(tempDir, "dead-code");
    expect(result).toContain("dead-code");
  });

  test("handles unknown action type", async () => {
    const result = await runSkill(tempDir, "unknown-action");
    expect(result).toContain("Unknown action");
    expect(result).toContain("unknown-action");
  });

  test("explore runs assessment and returns summary", async () => {
    // Set up minimal structure for assess to run
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });

    const result = await runSkill(tempDir, "explore");
    expect(result).toContain("Explore complete");
    expect(result).toContain("Tests:");
    expect(result).toContain("Plans:");
    expect(result).toContain("specified-only");
  });
});
