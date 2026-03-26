import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile, readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import { assess, buildSuggestions } from "../skills/assess";

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

  test("invariants are populated", async () => {
    const result = await assess(tempDir);
    expect(result.invariants).not.toBeNull();
    expect(typeof result.invariants!.specifiedOnly).toBe("number");
    expect(typeof result.invariants!.implementedTested).toBe("number");
  });

  test("healthScore is null when octoclean is not available in temp dir", async () => {
    const result = await assess(tempDir);
    // octoclean scan fails in bare temp dirs (no package.json, no node_modules)
    expect(result.healthScore).toBeNull();
    expect(result.worstFiles).toEqual([]);
  });

  test("records uncertainties when typecheck and health scan are unavailable", async () => {
    const result = await assess(tempDir);
    // In a temp dir: no bun-types (typecheck undefined) and no octoclean (health null)
    expect(result.uncertainties).toBeDefined();
    expect(result.uncertainties!.length).toBeGreaterThan(0);
    const fields = result.uncertainties!.map(u => u.field);
    // healthScore should be uncertain (no octoclean in temp dir)
    expect(fields).toContain("healthScore");
    // Each uncertainty has a reason
    for (const u of result.uncertainties!) {
      expect(u.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("buildSuggestions", () => {
  test("returns empty array for null assessment", () => {
    expect(buildSuggestions(null)).toEqual([]);
  });

  test("returns specifiedOnly suggestion when > 0", () => {
    const assessment = makeAssessment({ specifiedOnly: 3 });
    const suggestions = buildSuggestions(assessment);
    expect(suggestions).toContain("3 specified-only invariants need implementation");
  });

  test("returns implementedUntested suggestion when > 0", () => {
    const assessment = makeAssessment({ implementedUntested: 2 });
    const suggestions = buildSuggestions(assessment);
    expect(suggestions).toContain("2 implemented features need tests");
  });

  test("returns openPlans suggestion when > 0", () => {
    const assessment = makeAssessment({ openPlans: ["plan-a", "plan-b"] });
    const suggestions = buildSuggestions(assessment);
    expect(suggestions).toContain("2 open plan(s) to work on");
  });

  test("returns findings suggestion when > 0", () => {
    const assessment = makeAssessment({ findings: [{ id: "f1", content: "x" }] });
    const suggestions = buildSuggestions(assessment);
    expect(suggestions).toContain("1 finding(s) to review");
  });

  test("returns empty when all counts are 0", () => {
    const assessment = makeAssessment({});
    expect(buildSuggestions(assessment)).toEqual([]);
  });

  test("excludes findings when includeFindings is false", () => {
    const assessment = makeAssessment({ findings: [{ id: "f1", content: "x" }] });
    const suggestions = buildSuggestions(assessment, { includeFindings: false });
    expect(suggestions).not.toContain("1 finding(s) to review");
  });

  test("includes findings by default when no options given", () => {
    const assessment = makeAssessment({ findings: [{ id: "f1", content: "x" }] });
    const suggestions = buildSuggestions(assessment);
    expect(suggestions).toContain("1 finding(s) to review");
  });
});

function makeAssessment(overrides: {
  specifiedOnly?: number;
  implementedUntested?: number;
  openPlans?: string[];
  findings?: { id: string; content: string }[];
} = {}) {
  return {
    timestamp: new Date().toISOString(),
    invariants: {
      specifiedOnly: overrides.specifiedOnly ?? 0,
      implementedUntested: overrides.implementedUntested ?? 0,
      implementedTested: 0,
      unspecified: 0,
      topSpecGaps: [],
      topUntested: [],
      topUnspecified: [],
    },
    healthScore: null,
    worstFiles: [],
    openPlans: overrides.openPlans ?? [],
    findings: overrides.findings ?? [],
    testsPass: true,
    recentGitActivity: [],
  };
}

describe("archiveResolvedFindings", () => {
  let archiveTempDir: string;

  beforeEach(async () => {
    archiveTempDir = await mkdtemp(join(tmpdir(), "shoe-makers-archive-"));
  });

  afterEach(async () => {
    await rm(archiveTempDir, { recursive: true, force: true });
  });

  test("returns empty array when findings dir does not exist", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    expect(await archiveResolvedFindings(archiveTempDir)).toEqual([]);
  });

  test("ignores non-.md files", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "note.txt"), "## Status\n\nResolved.");
    expect(await archiveResolvedFindings(archiveTempDir)).toEqual([]);
  });

  test("archives files with resolved status", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "critique-2026-01-01-001.md"),
      "# Critique\n\nIssue.\n\n## Status\n\nResolved.\n",
    );
    const archived = await archiveResolvedFindings(archiveTempDir);
    expect(archived).toEqual(["critique-2026-01-01-001.md"]);

    // Verify file moved to archive
    const archiveDir = join(dir, "archive");
    const archiveFiles = await readdir(archiveDir);
    expect(archiveFiles).toContain("critique-2026-01-01-001.md");

    // Verify file removed from findings root
    const remainingFiles = (await readdir(dir)).filter((f) => f !== "archive");
    expect(remainingFiles).toEqual([]);
  });

  test("leaves unresolved files in place", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "critique-001.md"), "# Critique\n\nOpen issue.");
    const archived = await archiveResolvedFindings(archiveTempDir);
    expect(archived).toEqual([]);

    const files = (await readdir(dir)).filter((f) => f !== "archive");
    expect(files).toContain("critique-001.md");
  });

  test("creates archive subdirectory if needed", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "finding.md"), "# Finding\n\n## Status\n\nResolved.\n");
    await archiveResolvedFindings(archiveTempDir);

    const archiveDir = join(dir, "archive");
    const archiveStat = await stat(archiveDir);
    expect(archiveStat.isDirectory()).toBe(true);
  });

  test("handles mix of resolved and unresolved files", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "critique-001.md"), "# R\n\n## Status\n\nResolved.\n");
    await writeFile(join(dir, "critique-002.md"), "# Open\n\nStill open.");
    await writeFile(join(dir, "finding-xyz.md"), "# F\n\n## Status\n\nResolved — fixed.\n");

    const archived = await archiveResolvedFindings(archiveTempDir);
    expect(archived.sort()).toEqual(["critique-001.md", "finding-xyz.md"]);

    const remaining = (await readdir(dir)).filter((f) => f !== "archive");
    expect(remaining).toEqual(["critique-002.md"]);
  });

  test("archives expired note files older than 24h", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    const notePath = join(dir, "note-old.md");
    await writeFile(notePath, "# Note\n\nSome context for next elf.");

    // Backdate the file to 25 hours ago
    const { utimes } = await import("fs/promises");
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await utimes(notePath, oldTime, oldTime);

    const archived = await archiveResolvedFindings(archiveTempDir);
    expect(archived).toEqual(["note-old.md"]);
  });

  test("keeps non-expired note files", async () => {
    const { archiveResolvedFindings } = await import("../skills/assess");
    const dir = join(archiveTempDir, ".shoe-makers", "findings");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "note-fresh.md"), "# Note\n\nRecent context.");

    const archived = await archiveResolvedFindings(archiveTempDir);
    expect(archived).toEqual([]);

    const remaining = (await readdir(dir)).filter((f) => f !== "archive");
    expect(remaining).toContain("note-fresh.md");
  });
});

describe("buildSuggestions — null invariants", () => {
  test("handles null invariants gracefully", () => {
    const assessment = makeAssessment({});
    (assessment as any).invariants = null;
    expect(buildSuggestions(assessment)).toEqual([]);
  });
});
