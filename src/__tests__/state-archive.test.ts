import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { archiveConsumedStateFiles } from "../archive/state-archive";
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("archiveConsumedStateFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `state-archive-test-${Date.now()}`);
    mkdirSync(join(tmpDir, ".shoe-makers", "state"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("archives work-item.md when action is execute-work-item", async () => {
    const content = "# Build the thing\n\nDo X, Y, Z.";
    writeFileSync(join(tmpDir, ".shoe-makers", "state", "work-item.md"), content);

    const archived = await archiveConsumedStateFiles(tmpDir, "execute-work-item");

    expect(archived.length).toBe(1);
    expect(archived[0]).toMatch(/^work-item-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);

    const archiveDir = join(tmpDir, ".shoe-makers", "archive", "state");
    expect(existsSync(archiveDir)).toBe(true);

    const files = readdirSync(archiveDir);
    expect(files.length).toBe(1);

    const archivedContent = readFileSync(join(archiveDir, files[0]), "utf-8");
    expect(archivedContent).toBe(content);
  });

  test("archives candidates.md when action is prioritise", async () => {
    const content = "# Candidates\n\n## 1. Fix tests\n\n## 2. Add feature";
    writeFileSync(join(tmpDir, ".shoe-makers", "state", "candidates.md"), content);

    const archived = await archiveConsumedStateFiles(tmpDir, "prioritise");

    expect(archived.length).toBe(1);
    expect(archived[0]).toMatch(/^candidates-/);

    const archiveDir = join(tmpDir, ".shoe-makers", "archive", "state");
    const archivedContent = readFileSync(join(archiveDir, readdirSync(archiveDir)[0]), "utf-8");
    expect(archivedContent).toBe(content);
  });

  test("archives work-item.md when action is dead-code", async () => {
    writeFileSync(join(tmpDir, ".shoe-makers", "state", "work-item.md"), "# Remove dead code");

    const archived = await archiveConsumedStateFiles(tmpDir, "dead-code");

    expect(archived.length).toBe(1);
    expect(archived[0]).toMatch(/^work-item-/);
  });

  test("archives partial-work.md when action is continue-work", async () => {
    writeFileSync(join(tmpDir, ".shoe-makers", "state", "partial-work.md"), "# Partial work");

    const archived = await archiveConsumedStateFiles(tmpDir, "continue-work");

    expect(archived.length).toBe(1);
    expect(archived[0]).toMatch(/^partial-work-/);
  });

  test("does nothing when action does not consume files", async () => {
    writeFileSync(join(tmpDir, ".shoe-makers", "state", "work-item.md"), "content");

    const archived = await archiveConsumedStateFiles(tmpDir, "explore");
    expect(archived.length).toBe(0);

    expect(existsSync(join(tmpDir, ".shoe-makers", "archive", "state"))).toBe(false);
  });

  test("does nothing when state file does not exist", async () => {
    const archived = await archiveConsumedStateFiles(tmpDir, "execute-work-item");
    expect(archived.length).toBe(0);
  });

  test("does nothing for critique action", async () => {
    const archived = await archiveConsumedStateFiles(tmpDir, "critique");
    expect(archived.length).toBe(0);
  });

  test("archive filename includes ISO timestamp", async () => {
    writeFileSync(join(tmpDir, ".shoe-makers", "state", "work-item.md"), "content");

    const archived = await archiveConsumedStateFiles(tmpDir, "execute-work-item");

    // Format: work-item-2026-03-23T14-30-00-000Z.md
    expect(archived[0]).toMatch(/^work-item-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.md$/);
  });
});
