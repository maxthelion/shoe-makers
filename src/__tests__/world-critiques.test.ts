import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { countUnresolvedCritiques } from "../state/world";

describe("countUnresolvedCritiques", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-critiques-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns 0 when findings directory does not exist", async () => {
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("returns 0 when findings directory is empty", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("returns 0 when no critique files exist", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "invariant-update-2026-03-25.md"), "# Finding\n\nSome finding.");
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("counts unresolved critiques", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "critique-2026-03-25-001.md"), "# Critique\n\nSome issue found.");
    await writeFile(join(dir, "critique-2026-03-25-002.md"), "# Critique\n\nAnother issue.");
    expect(await countUnresolvedCritiques(tempDir)).toBe(2);
  });

  test("ignores resolved critiques", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\nSome issue.\n\n## Status\n\nResolved.\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("counts mix of resolved and unresolved", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique: issue A\n\nProblem.\n\n## Status\n\nResolved.\n",
    );
    await writeFile(
      join(dir, "critique-2026-03-25-002.md"),
      "# Critique: issue B\n\nProblem.\n\n## Status\n\nResolved.\n",
    );
    await writeFile(
      join(dir, "critique-2026-03-25-003.md"),
      "# Critique: issue C\n\nStill open.",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(1);
  });

  test("ignores files not starting with critique-", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "invariant-update-2026-03-25.md"), "# Finding\n\nNo resolved status.");
    await writeFile(join(dir, "permission-violation.md"), "# Violation\n\nNo resolved status.");
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("ignores non-.md files", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "critique-2026-03-25-001.txt"), "Not a markdown critique");
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("recognizes Resolved with trailing period", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\n## Status\n\nResolved.\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("recognizes Resolved with trailing description", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\n## Status\n\nResolved — all clear.\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });

  test("recognizes Resolved with leading whitespace", async () => {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-03-25-001.md"),
      "# Critique\n\n## Status\n  Resolved\n",
    );
    expect(await countUnresolvedCritiques(tempDir)).toBe(0);
  });
});
