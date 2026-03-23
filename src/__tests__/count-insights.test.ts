import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { countInsights } from "../state/world";

describe("countInsights", () => {
  let tmpRoot: string;
  let insightsDir: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), "insights-test-"));
    insightsDir = join(tmpRoot, ".shoe-makers", "insights");
    await mkdir(insightsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
  });

  it("returns 0 for empty directory", async () => {
    expect(await countInsights(tmpRoot)).toBe(0);
  });

  it("returns 0 for missing directory", async () => {
    await rm(insightsDir, { recursive: true, force: true });
    expect(await countInsights(tmpRoot)).toBe(0);
  });

  it("counts .md files", async () => {
    await writeFile(join(insightsDir, "2026-03-23-001.md"), "# Insight 1");
    await writeFile(join(insightsDir, "2026-03-23-002.md"), "# Insight 2");
    expect(await countInsights(tmpRoot)).toBe(2);
  });

  it("ignores non-.md files", async () => {
    await writeFile(join(insightsDir, "2026-03-23-001.md"), "# Insight");
    await writeFile(join(insightsDir, ".gitkeep"), "");
    await writeFile(join(insightsDir, "notes.txt"), "some notes");
    expect(await countInsights(tmpRoot)).toBe(1);
  });
});
