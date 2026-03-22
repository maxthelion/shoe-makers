import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { RESOLVED_PATTERN } from "../state/world";

/**
 * Tests for the critique resolution detection pattern.
 *
 * The regex /^## Status\s*\n\s*Resolved\.?\s*$/mi must:
 * - Match "## Status\nResolved." at end of file
 * - Match "## Status\nResolved" without period
 * - NOT match when "Resolved" appears in body text without Status heading
 * - NOT match "## Status\nNot Resolved"
 */

describe("critique resolution regex", () => {
  test("matches standard resolved format", () => {
    const content = "# Critique\n\nIssues found.\n\n## Status\nResolved.\n";
    expect(RESOLVED_PATTERN.test(content)).toBe(true);
  });

  test("matches without trailing period", () => {
    const content = "# Critique\n\nIssues.\n\n## Status\nResolved\n";
    expect(RESOLVED_PATTERN.test(content)).toBe(true);
  });

  test("matches with extra whitespace", () => {
    const content = "# Critique\n\n## Status  \n  Resolved.  \n";
    expect(RESOLVED_PATTERN.test(content)).toBe(true);
  });

  test("does NOT match resolved in body text", () => {
    const content =
      "# Critique\n\nThe word Resolved appears here but no Status heading precedes it.\n";
    expect(RESOLVED_PATTERN.test(content)).toBe(false);
  });

  test("does NOT match Status heading without Resolved on next line", () => {
    const content = "# Critique\n\n## Status\nOpen\n";
    expect(RESOLVED_PATTERN.test(content)).toBe(false);
  });

  test("does NOT match 'Not Resolved'", () => {
    const content = "# Critique\n\n## Status\nNot Resolved.\n";
    expect(RESOLVED_PATTERN.test(content)).toBe(false);
  });

  test("does NOT match discussion about the resolution pattern", () => {
    // This was the actual bug — the critique text contained
    // "## Status" and "Resolved" in its discussion about the regex
    const content =
      '# Critique\n\n### Advisory: resolution pattern\n\nThe check looks for `## Status` followed by "Resolved" but this is fragile.\n';
    expect(RESOLVED_PATTERN.test(content)).toBe(false);
  });
});

describe("critique file detection", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-critique-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function createFindings(
    files: { name: string; content: string }[]
  ): Promise<void> {
    const dir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    for (const f of files) {
      await writeFile(join(dir, f.name), f.content);
    }
  }

  /** Replicate the counting logic from world.ts */
  async function countUnresolvedCritiques(): Promise<number> {
    const { readdir } = await import("fs/promises");
    const findingsDir = join(tempDir, ".shoe-makers", "findings");
    let count = 0;
    try {
      const files = await readdir(findingsDir);
      for (const file of files) {
        if (!file.startsWith("critique-") || !file.endsWith(".md")) continue;
        const content = await readFile(join(findingsDir, file), "utf-8");
        if (!RESOLVED_PATTERN.test(content)) {
          count++;
        }
      }
    } catch {}
    return count;
  }

  test("counts unresolved critiques", async () => {
    await createFindings([
      {
        name: "critique-2026-03-21-001.md",
        content: "# Critique\n\nSome issues found.\n",
      },
    ]);
    expect(await countUnresolvedCritiques()).toBe(1);
  });

  test("skips resolved critiques", async () => {
    await createFindings([
      {
        name: "critique-2026-03-21-001.md",
        content: "# Critique\n\nFixed.\n\n## Status\nResolved.\n",
      },
    ]);
    expect(await countUnresolvedCritiques()).toBe(0);
  });

  test("ignores non-critique findings", async () => {
    await createFindings([
      {
        name: "plan-detection-bug.md",
        content: "# Bug\n\nSome issue.\n",
      },
    ]);
    expect(await countUnresolvedCritiques()).toBe(0);
  });

  test("mixed resolved and unresolved", async () => {
    await createFindings([
      {
        name: "critique-2026-03-21-001.md",
        content: "# Critique 1\n\n## Status\nResolved.\n",
      },
      {
        name: "critique-2026-03-21-002.md",
        content: "# Critique 2\n\nStill open.\n",
      },
      {
        name: "critique-2026-03-21-003.md",
        content: "# Critique 3\n\nAlso open.\n",
      },
    ]);
    expect(await countUnresolvedCritiques()).toBe(2);
  });

  test("empty findings directory returns 0", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    expect(await countUnresolvedCritiques()).toBe(0);
  });

  test("missing findings directory returns 0", async () => {
    expect(await countUnresolvedCritiques()).toBe(0);
  });
});
