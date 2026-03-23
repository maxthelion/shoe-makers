import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { archiveResolvedFindings } from "../skills/assess";

describe("archiveResolvedFindings", () => {
  let tmpRoot: string;
  let findingsDir: string;
  let archiveDir: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), "archive-test-"));
    findingsDir = join(tmpRoot, ".shoe-makers", "findings");
    archiveDir = join(findingsDir, "archive");
    await mkdir(findingsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
  });

  it("moves resolved findings to archive/", async () => {
    await writeFile(
      join(findingsDir, "critique-2026-03-23-001.md"),
      "# Critique\n\nSome content.\n\n## Status\n\nResolved.\n"
    );

    const archived = await archiveResolvedFindings(tmpRoot);

    expect(archived).toEqual(["critique-2026-03-23-001.md"]);
    const rootFiles = await readdir(findingsDir);
    expect(rootFiles.filter(f => f.endsWith(".md"))).toEqual([]);
    const archiveFiles = await readdir(archiveDir);
    expect(archiveFiles).toContain("critique-2026-03-23-001.md");
  });

  it("leaves unresolved findings in place", async () => {
    await writeFile(
      join(findingsDir, "critique-2026-03-23-002.md"),
      "# Critique\n\nSome issues found.\n"
    );

    const archived = await archiveResolvedFindings(tmpRoot);

    expect(archived).toEqual([]);
    const rootFiles = await readdir(findingsDir);
    expect(rootFiles).toContain("critique-2026-03-23-002.md");
  });

  it("handles empty findings directory", async () => {
    const archived = await archiveResolvedFindings(tmpRoot);
    expect(archived).toEqual([]);
  });

  it("creates archive/ directory if it doesn't exist", async () => {
    await writeFile(
      join(findingsDir, "finding-001.md"),
      "# Finding\n\n## Status\n\nResolved\n"
    );

    await archiveResolvedFindings(tmpRoot);

    const archiveFiles = await readdir(archiveDir);
    expect(archiveFiles).toContain("finding-001.md");
  });

  it("handles missing findings directory gracefully", async () => {
    await rm(findingsDir, { recursive: true, force: true });
    const archived = await archiveResolvedFindings(tmpRoot);
    expect(archived).toEqual([]);
  });

  it("archives multiple resolved findings at once", async () => {
    await writeFile(
      join(findingsDir, "critique-001.md"),
      "# A\n\n## Status\n\nResolved.\n"
    );
    await writeFile(
      join(findingsDir, "critique-002.md"),
      "# B\n\n## Status\n\nResolved.\n"
    );
    await writeFile(
      join(findingsDir, "critique-003.md"),
      "# C\n\nUnresolved issue.\n"
    );

    const archived = await archiveResolvedFindings(tmpRoot);

    expect(archived).toHaveLength(2);
    expect(archived).toContain("critique-001.md");
    expect(archived).toContain("critique-002.md");
    const rootFiles = (await readdir(findingsDir)).filter(f => f.endsWith(".md"));
    expect(rootFiles).toEqual(["critique-003.md"]);
  });
});
