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

  test("returns descriptive message for implement-plan", async () => {
    const result = await runSkill(tempDir, "implement-plan");
    expect(result).toContain("implement-plan");
  });

  test("returns descriptive message for implement-spec", async () => {
    const result = await runSkill(tempDir, "implement-spec");
    expect(result).toContain("implement-spec");
  });

  test("returns descriptive message for write-tests", async () => {
    const result = await runSkill(tempDir, "write-tests");
    expect(result).toContain("write-tests");
  });

  test("returns descriptive message for document", async () => {
    const result = await runSkill(tempDir, "document");
    expect(result).toContain("document");
  });

  test("returns descriptive message for improve-health", async () => {
    const result = await runSkill(tempDir, "improve-health");
    expect(result).toContain("improve-health");
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
