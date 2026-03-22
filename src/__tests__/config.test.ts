import { describe, test, expect, beforeEach, afterEach } from "bun:test";
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
});
