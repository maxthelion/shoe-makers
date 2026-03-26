import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { readWorkItemSkillType, checkHasWorkItem, checkHasCandidates, checkHasPartialWork, countInsights } from "../state/world";

describe("readWorkItemSkillType", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-skill-type-"));
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns skill type when skill-type: line is present", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "# Remove unused exports\nskill-type: dead-code\n\n## Context\n...",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBe("dead-code");
  });

  test("returns null when no skill-type line exists", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "# Add tests for prompts\n\n## Context\n...",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("does not false-positive on keyword dead-code in title", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "# Add tests for the dead-code prompt\n\n## Context\nThis is about testing, not dead-code removal.\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("returns null when work-item.md does not exist", async () => {
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("returns null when skill-type appears after line 10", async () => {
    const lines = Array(11).fill("# Padding line").join("\n");
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      lines + "\nskill-type: implement\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBeNull();
  });

  test("trims whitespace from skill type value", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "skill-type:   implement  \n# Title\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBe("implement");
  });

  test("matches case-insensitively", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "Skill-Type: test-coverage\n# Title\n",
    );
    const result = await readWorkItemSkillType(tempDir);
    expect(result).toBe("test-coverage");
  });
});

describe("checkHasWorkItem", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-has-work-item-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns true when work-item.md exists", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "work-item.md"), "# Work item");
    expect(await checkHasWorkItem(tempDir)).toBe(true);
  });

  test("returns false when work-item.md does not exist", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    expect(await checkHasWorkItem(tempDir)).toBe(false);
  });

  test("returns false when state directory does not exist", async () => {
    expect(await checkHasWorkItem(tempDir)).toBe(false);
  });
});

describe("checkHasCandidates", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-has-candidates-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns true when candidates.md exists", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "candidates.md"), "# Candidates");
    expect(await checkHasCandidates(tempDir)).toBe(true);
  });

  test("returns false when candidates.md does not exist", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    expect(await checkHasCandidates(tempDir)).toBe(false);
  });
});

describe("checkHasPartialWork", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-has-partial-work-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns true when partial-work.md exists", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers", "state", "partial-work.md"), "# Partial work");
    expect(await checkHasPartialWork(tempDir)).toBe(true);
  });

  test("returns false when partial-work.md does not exist", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    expect(await checkHasPartialWork(tempDir)).toBe(false);
  });

  test("returns false when state directory does not exist", async () => {
    expect(await checkHasPartialWork(tempDir)).toBe(false);
  });
});

describe("countInsights", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-insights-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns 0 when insights directory does not exist", async () => {
    expect(await countInsights(tempDir)).toBe(0);
  });

  test("returns 0 when insights directory is empty", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "insights"), { recursive: true });
    expect(await countInsights(tempDir)).toBe(0);
  });

  test("counts only .md files", async () => {
    const dir = join(tempDir, ".shoe-makers", "insights");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "2026-03-25-001.md"), "# Insight");
    await writeFile(join(dir, "2026-03-25-002.md"), "# Insight 2");
    await writeFile(join(dir, "notes.txt"), "not an insight");
    expect(await countInsights(tempDir)).toBe(2);
  });
});
