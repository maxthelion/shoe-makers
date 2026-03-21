import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import { assess } from "../skills/assess";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-assess-"));
  // Init a git repo — no commit needed, assess handles empty repos gracefully
  execSync("git init", { cwd: tempDir, stdio: "pipe" });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

describe("assess skill", () => {
  test("produces an assessment with timestamp", async () => {
    const result = await assess(tempDir);
    expect(result.timestamp).toBeTruthy();
    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
  });

  test("handles repo with no commits", async () => {
    const result = await assess(tempDir);
    // Should return empty array, not throw
    expect(result.recentGitActivity).toEqual([]);
  });

  test("writes assessment.json to state directory", async () => {
    await assess(tempDir);
    const raw = await readFile(
      join(tempDir, ".shoe-makers/state/assessment.json"),
      "utf-8"
    );
    const parsed = JSON.parse(raw);
    expect(parsed.timestamp).toBeTruthy();
  });

  test("finds plan pages in wiki", async () => {
    await mkdir(join(tempDir, "wiki/pages"), { recursive: true });
    await writeFile(
      join(tempDir, "wiki/pages/plans-vs-spec.md"),
      "---\ntitle: Plans vs Spec\ncategory: plan\n---\n# Plans\n"
    );
    await writeFile(
      join(tempDir, "wiki/pages/architecture.md"),
      "---\ntitle: Architecture\ncategory: architecture\n---\n# Arch\n"
    );

    const result = await assess(tempDir);
    expect(result.openPlans).toContain("plans-vs-spec");
    expect(result.openPlans).not.toContain("architecture");
  });

  test("returns empty findings when no findings directory exists", async () => {
    const result = await assess(tempDir);
    expect(result.findings).toEqual([]);
  });

  test("reads findings from .shoe-makers/findings/", async () => {
    await mkdir(join(tempDir, ".shoe-makers/findings"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/findings/test-finding.md"),
      "# Test Finding\n\nSomething important."
    );
    await writeFile(
      join(tempDir, ".shoe-makers/findings/another-finding.md"),
      "# Another\n\nAnother observation."
    );

    const result = await assess(tempDir);
    expect(result.findings).toHaveLength(2);
    const ids = result.findings.map((f) => f.id);
    expect(ids).toContain("test-finding");
    expect(ids).toContain("another-finding");
    expect(result.findings.find((f) => f.id === "test-finding")!.content).toContain(
      "Something important"
    );
  });

  test("ignores non-markdown files in findings directory", async () => {
    await mkdir(join(tempDir, ".shoe-makers/findings"), { recursive: true });
    await writeFile(join(tempDir, ".shoe-makers/findings/valid.md"), "# Valid\n");
    await writeFile(join(tempDir, ".shoe-makers/findings/not-a-finding.txt"), "ignored");

    const result = await assess(tempDir);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].id).toBe("valid");
  });

  test("excludes blocked plans from open plans", async () => {
    await mkdir(join(tempDir, "wiki/pages"), { recursive: true });
    await writeFile(
      join(tempDir, "wiki/pages/open-plan.md"),
      "---\ntitle: Open Plan\ncategory: plan\n---\n# Open\n"
    );
    await writeFile(
      join(tempDir, "wiki/pages/blocked-plan.md"),
      "---\ntitle: Blocked Plan\ncategory: plan\nstatus: blocked\n---\n# Blocked\n"
    );
    await writeFile(
      join(tempDir, "wiki/pages/done-plan.md"),
      "---\ntitle: Done Plan\ncategory: plan\nstatus: done\n---\n# Done\n"
    );

    const result = await assess(tempDir);
    expect(result.openPlans).toContain("open-plan");
    expect(result.openPlans).not.toContain("blocked-plan");
    expect(result.openPlans).not.toContain("done-plan");
  });

  test("invariants are populated, healthScore is null (not yet implemented)", async () => {
    const result = await assess(tempDir);
    expect(result.invariants).not.toBeNull();
    expect(typeof result.invariants!.specifiedOnly).toBe("number");
    expect(typeof result.invariants!.implementedTested).toBe("number");
    expect(result.healthScore).toBeNull();
  });
});

// Note: can't test assess on the real repo here because assess runs `bun test`,
// which would cause infinite recursion. Integration testing of assess on the
// real repo should be done via `bun run dev` instead.
