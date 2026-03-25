import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { loadConfig } from "../config/load-config";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-config-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("loadConfig", () => {
  test("returns defaults when config file does not exist", async () => {
    const config = await loadConfig(tempDir);
    expect(config).toEqual({
      branchPrefix: "shoemakers",
      tickInterval: 5,
      wikiDir: "wiki",
      assessmentStaleAfter: 30,
      maxTicksPerShift: 10,
      enabledSkills: null,
      insightFrequency: 0.3,
      maxInnovationCycles: 3,
    });
  });

  test("reads all values from config file", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      [
        "# Shoe-makers config",
        "branch-prefix: nightly",
        "tick-interval: 10",
        "wiki-dir: docs/wiki",
        "assessment-stale-after: 60",
      ].join("\n")
    );

    const config = await loadConfig(tempDir);
    expect(config).toEqual({
      branchPrefix: "nightly",
      tickInterval: 10,
      wikiDir: "docs/wiki",
      assessmentStaleAfter: 60,
      maxTicksPerShift: 10,
      enabledSkills: null,
      insightFrequency: 0.3,
      maxInnovationCycles: 3,
    });
  });

  test("merges partial config with defaults", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "assessment-stale-after: 15\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.assessmentStaleAfter).toBe(15);
    expect(config.branchPrefix).toBe("shoemakers");
    expect(config.tickInterval).toBe(5);
    expect(config.wikiDir).toBe("wiki");
  });

  test("reads enabled-skills as array", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      [
        "enabled-skills: fix-tests, implement, write-tests",
      ].join("\n")
    );

    const config = await loadConfig(tempDir);
    expect(config.enabledSkills).toEqual(["fix-tests", "implement", "write-tests"]);
  });

  test("defaults enabled-skills to null (all skills enabled)", async () => {
    const config = await loadConfig(tempDir);
    expect(config.enabledSkills).toBeNull();
  });

  test("handles non-numeric tick-interval gracefully (falls back to default)", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "tick-interval: abc\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.tickInterval).toBe(5);
  });

  test("handles empty enabled-skills value", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "enabled-skills: \n"
    );

    const config = await loadConfig(tempDir);
    expect(config.enabledSkills).toBeNull();
  });

  test("handles lines without colons", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "this line has no colon\nbranch-prefix: valid\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.branchPrefix).toBe("valid");
  });

  test("ignores comments and blank lines", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      [
        "# This is a comment",
        "",
        "branch-prefix: custom",
        "# Another comment",
        "",
      ].join("\n")
    );

    const config = await loadConfig(tempDir);
    expect(config.branchPrefix).toBe("custom");
  });

  test("no warning when all keys are known", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      [
        "branch-prefix: test",
        "tick-interval: 5",
        "wiki-dir: wiki",
        "assessment-stale-after: 30",
        "max-ticks-per-shift: 10",
        "enabled-skills: fix-tests",
        "insight-frequency: 0.3",
      ].join("\n")
    );

    const warnSpy = spyOn(console, "warn");
    await loadConfig(tempDir);
    const unknownKeyWarnings = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Unknown config key")
    );
    expect(unknownKeyWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });

  test("reads insight-frequency from config", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "insight-frequency: 0.5\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.insightFrequency).toBe(0.5);
  });

  test("defaults insightFrequency to 0.3", async () => {
    const config = await loadConfig(tempDir);
    expect(config.insightFrequency).toBe(0.3);
  });

  test("rejects invalid insight-frequency values", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "insight-frequency: 1.5\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.insightFrequency).toBe(0.3);
  });

  test("rejects negative insight-frequency", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "insight-frequency: -0.1\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.insightFrequency).toBe(0.3);
  });

  test("enabled-skills with trailing comma ignores empty entries", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "enabled-skills: fix-tests,implement,\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.enabledSkills).toEqual(["fix-tests", "implement"]);
  });

  test("enabled-skills with extra whitespace trims correctly", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "enabled-skills:   fix-tests ,  implement  \n"
    );

    const config = await loadConfig(tempDir);
    expect(config.enabledSkills).toEqual(["fix-tests", "implement"]);
  });

  test("enabled-skills with single skill returns one-element array", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "enabled-skills: fix-tests\n"
    );

    const config = await loadConfig(tempDir);
    expect(config.enabledSkills).toEqual(["fix-tests"]);
  });

  test("warns on unknown config key", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/config.yaml"),
      "unknown-key: value\nbranch-prefix: test\n"
    );

    const warnSpy = spyOn(console, "warn");
    await loadConfig(tempDir);
    const unknownKeyWarnings = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Unknown config key")
    );
    expect(unknownKeyWarnings).toHaveLength(1);
    expect(unknownKeyWarnings[0][0]).toContain("unknown-key");
    warnSpy.mockRestore();
  });
});
