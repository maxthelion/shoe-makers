import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writePermissionViolationFinding } from "../verify/violation-findings";
import { RESOLVED_PATTERN } from "../state/world";
import { mkdtemp, rm, readFile, readdir, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "violation-findings-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("writePermissionViolationFinding", () => {
  test("creates a finding file with violation paths", async () => {
    const violations = ["src/types.ts", ".shoe-makers/invariants.md"];
    const filename = await writePermissionViolationFinding(tempDir, violations);

    expect(filename).not.toBeNull();
    expect(filename).toContain("critique-");
    expect(filename).toContain("permission-violation");

    const content = await readFile(join(tempDir, ".shoe-makers", "findings", filename!), "utf-8");
    expect(content).toContain("Permission Violation Detected");
    expect(content).toContain("`src/types.ts`");
    expect(content).toContain("`.shoe-makers/invariants.md`");
  });

  test("finding file is NOT marked as resolved", async () => {
    const filename = await writePermissionViolationFinding(tempDir, ["src/foo.ts"]);
    const content = await readFile(join(tempDir, ".shoe-makers", "findings", filename!), "utf-8");
    expect(RESOLVED_PATTERN.test(content)).toBe(false);
  });

  test("deduplicates — does not create a second finding if unresolved one exists", async () => {
    const first = await writePermissionViolationFinding(tempDir, ["src/foo.ts"]);
    expect(first).not.toBeNull();

    const second = await writePermissionViolationFinding(tempDir, ["src/bar.ts"]);
    expect(second).toBeNull();

    // Verify only one finding file exists
    const files = await readdir(join(tempDir, ".shoe-makers", "findings"));
    const violationFiles = files.filter(f => f.includes("permission-violation"));
    expect(violationFiles.length).toBe(1);
  });

  test("creates a new finding if the existing one is resolved", async () => {
    const first = await writePermissionViolationFinding(tempDir, ["src/foo.ts"]);
    expect(first).not.toBeNull();

    // Mark the first finding as resolved
    const filepath = join(tempDir, ".shoe-makers", "findings", first!);
    const content = await readFile(filepath, "utf-8");
    await writeFile(filepath, content + "\n## Status\n\nResolved.\n");

    const second = await writePermissionViolationFinding(tempDir, ["src/bar.ts"]);
    expect(second).not.toBeNull();
  });

  test("creates findings directory if it does not exist", async () => {
    const filename = await writePermissionViolationFinding(tempDir, ["src/foo.ts"]);
    expect(filename).not.toBeNull();

    const files = await readdir(join(tempDir, ".shoe-makers", "findings"));
    expect(files.length).toBe(1);
  });

  test("filename starts with critique- prefix for tree condition compatibility", async () => {
    const filename = await writePermissionViolationFinding(tempDir, ["src/foo.ts"]);
    expect(filename!.startsWith("critique-")).toBe(true);
  });
});
