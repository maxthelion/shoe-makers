import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { nextCritiqueFilename } from "../setup/critique-context";

describe("nextCritiqueFilename", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "critique-ctx-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns 001 when no existing critiques", async () => {
    const result = await nextCritiqueFilename(tempDir);
    const today = new Date().toISOString().slice(0, 10);
    expect(result).toBe(`critique-${today}-001.md`);
  });

  test("increments past existing findings", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `critique-${today}-001.md`), "x");
    await writeFile(join(dir, `critique-${today}-002.md`), "x");

    const result = await nextCritiqueFilename(tempDir);
    expect(result).toBe(`critique-${today}-003.md`);
  });

  test("checks archive directory too", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const archiveDir = join(tempDir, ".shoe-makers", "findings", "archive");
    await mkdir(archiveDir, { recursive: true });
    await writeFile(join(archiveDir, `critique-${today}-005.md`), "x");

    const result = await nextCritiqueFilename(tempDir);
    expect(result).toBe(`critique-${today}-006.md`);
  });

  test("takes max across findings and archive", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const findingsDir = join(tempDir, ".shoe-makers", "findings");
    const archiveDir = join(findingsDir, "archive");
    await mkdir(archiveDir, { recursive: true });
    await writeFile(join(findingsDir, `critique-${today}-002.md`), "x");
    await writeFile(join(archiveDir, `critique-${today}-007.md`), "x");

    const result = await nextCritiqueFilename(tempDir);
    expect(result).toBe(`critique-${today}-008.md`);
  });

  test("ignores non-matching files", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "some-other-finding.md"), "x");
    await writeFile(join(dir, `critique-2025-01-01-010.md`), "x"); // different date

    const result = await nextCritiqueFilename(tempDir);
    expect(result).toBe(`critique-${today}-001.md`);
  });
});
