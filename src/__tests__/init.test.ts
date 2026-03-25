import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile, readdir, stat, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { init, bootstrapWiki } from "../init";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-init-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("init", () => {
  test("creates .shoe-makers directory structure", async () => {
    await init(tempDir);

    const dirs = ["inbox", "findings", "log", "state", "skills"];
    for (const dir of dirs) {
      const dirStat = await stat(join(tempDir, ".shoe-makers", dir));
      expect(dirStat.isDirectory()).toBe(true);
    }
  });

  test("creates protocol.md", async () => {
    await init(tempDir);

    const protocol = await readFile(
      join(tempDir, ".shoe-makers", "protocol.md"),
      "utf-8"
    );
    expect(protocol).toContain("next-action.md");
    expect(protocol).toContain("bun run setup");
  });

  test("creates config.yaml with sensible defaults", async () => {
    await init(tempDir);

    const config = await readFile(
      join(tempDir, ".shoe-makers", "config.yaml"),
      "utf-8"
    );
    expect(config).toContain("branch-prefix: shoemakers");
    expect(config).toContain("tick-interval: 5");
  });

  test("creates default skill files", async () => {
    await init(tempDir);

    const skillFiles = await readdir(join(tempDir, ".shoe-makers", "skills"));
    const mdFiles = skillFiles.filter((f) => f.endsWith(".md"));
    expect(mdFiles.length).toBeGreaterThanOrEqual(1);

    // At least an implement skill should exist
    const hasImplement = mdFiles.some((f) => f.includes("implement"));
    expect(hasImplement).toBe(true);
  });

  test("scaffolds all core skills", async () => {
    await init(tempDir);

    const coreSkills = [
      "fix-tests.md", "implement.md", "test-coverage.md", "doc-sync.md", "health.md",
      "octoclean-fix.md", "bug-fix.md", "dead-code.md", "dependency-update.md",
    ];
    const skillFiles = await readdir(join(tempDir, ".shoe-makers", "skills"));

    for (const skill of coreSkills) {
      expect(skillFiles).toContain(skill);
    }
  });

  test("scaffolded skills have valid frontmatter", async () => {
    await init(tempDir);

    const coreSkills = [
      "fix-tests.md", "implement.md", "test-coverage.md", "doc-sync.md", "health.md",
      "octoclean-fix.md", "bug-fix.md", "dead-code.md", "dependency-update.md",
    ];
    for (const skill of coreSkills) {
      const content = await readFile(join(tempDir, ".shoe-makers", "skills", skill), "utf-8");
      // Each skill should have frontmatter with name, description, maps-to, risk
      expect(content).toMatch(/^---/);
      expect(content).toContain("name:");
      expect(content).toContain("description:");
      expect(content).toContain("maps-to:");
      expect(content).toContain("risk:");
      // Each skill should have an Off-limits section
      expect(content).toContain("Off-limits");
    }
  });

  test("creates schedule.md with default hours", async () => {
    await init(tempDir);

    const schedule = await readFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "utf-8"
    );
    expect(schedule).toContain("start:");
    expect(schedule).toContain("end:");
  });

  test("creates invariants.md template", async () => {
    await init(tempDir);

    const invariants = await readFile(
      join(tempDir, ".shoe-makers", "invariants.md"),
      "utf-8"
    );
    expect(invariants).toContain("Invariants");
  });

  test("does not overwrite existing files", async () => {
    // First init
    await init(tempDir);

    // Modify protocol
    const protocolPath = join(tempDir, ".shoe-makers", "protocol.md");
    const { writeFile } = await import("fs/promises");
    await writeFile(protocolPath, "# Custom protocol\n");

    // Second init should not overwrite
    await init(tempDir);

    const protocol = await readFile(protocolPath, "utf-8");
    expect(protocol).toBe("# Custom protocol\n");
  });

  test("returns a summary of what was created", async () => {
    const result = await init(tempDir);

    expect(result.created).toBeInstanceOf(Array);
    expect(result.created.length).toBeGreaterThan(0);
    expect(result.skipped).toBeInstanceOf(Array);
  });

  test("second init reports skipped files", async () => {
    await init(tempDir);
    const result = await init(tempDir);

    expect(result.skipped.length).toBeGreaterThan(0);
    expect(result.created.length).toBe(0);
  });
});

describe("bootstrapWiki", () => {
  test("creates wiki page from existing README.md", async () => {
    await writeFile(join(tempDir, "README.md"), "# My Project\n\nThis is a cool project.\n");
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });

    const result = await bootstrapWiki(tempDir);

    expect(result.imported).toContain("readme.md");
    const page = await readFile(join(tempDir, "wiki", "pages", "readme.md"), "utf-8");
    expect(page).toContain("title:");
    expect(page).toContain("My Project");
    expect(page).toContain("cool project");
  });

  test("creates wiki page from existing docs/ markdown files", async () => {
    await mkdir(join(tempDir, "docs"), { recursive: true });
    await writeFile(join(tempDir, "docs", "setup.md"), "# Setup Guide\n\nHow to set up.\n");
    await writeFile(join(tempDir, "docs", "api.md"), "# API Reference\n\nEndpoints.\n");
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });

    const result = await bootstrapWiki(tempDir);

    expect(result.imported.length).toBe(2);
    const setupPage = await readFile(join(tempDir, "wiki", "pages", "setup.md"), "utf-8");
    expect(setupPage).toContain("title:");
    expect(setupPage).toContain("Setup Guide");
  });

  test("does not overwrite existing wiki pages", async () => {
    await writeFile(join(tempDir, "README.md"), "# New Content\n");
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
    await writeFile(join(tempDir, "wiki", "pages", "readme.md"), "---\ntitle: Existing\n---\nKeep this.\n");

    const result = await bootstrapWiki(tempDir);

    expect(result.skipped).toContain("readme.md");
    const page = await readFile(join(tempDir, "wiki", "pages", "readme.md"), "utf-8");
    expect(page).toContain("Keep this.");
  });

  test("returns empty when no docs found", async () => {
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });

    const result = await bootstrapWiki(tempDir);

    expect(result.imported).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  test("ignores non-markdown files in docs/", async () => {
    await mkdir(join(tempDir, "docs"), { recursive: true });
    await writeFile(join(tempDir, "docs", "config.json"), '{"key": "value"}');
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });

    const result = await bootstrapWiki(tempDir);

    expect(result.imported).toHaveLength(0);
  });

  test("creates wiki directory if it doesn't exist", async () => {
    await writeFile(join(tempDir, "README.md"), "# Project\n\nContent.\n");

    const result = await bootstrapWiki(tempDir);

    expect(result.imported).toContain("readme.md");
    const dirStat = await stat(join(tempDir, "wiki", "pages"));
    expect(dirStat.isDirectory()).toBe(true);
  });
});
