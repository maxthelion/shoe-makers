import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { formatAction, readWikiOverview } from "../scheduler/format-action";
import type { WorldState } from "../types";

function mockState(): WorldState {
  return {
    branch: "shoemakers/2026-03-25",
    hasUncommittedChanges: false,
    inboxCount: 0,
    hasUnreviewedCommits: false,
    unresolvedCritiqueCount: 0,
    hasWorkItem: false,
    hasCandidates: false,
    workItemSkillType: null,
    hasPartialWork: false,
    insightCount: 0,
    blackboard: { assessment: null, currentTask: null },
    config: {
      branchPrefix: "shoemakers",
      tickInterval: 5,
      wikiDir: "wiki",
      assessmentStaleAfter: 30,
      maxTicksPerShift: 10,
      enabledSkills: null,
      insightFrequency: 0.3,
      maxInnovationCycles: 3,
      healthRegressionThreshold: 2,
      reviewLoopThreshold: 3,
      wikipediaTimeout: 10_000,
      octocleanTimeout: 120_000,
    },
  };
}

describe("formatAction", () => {
  describe("inbox messages", () => {
    test("formats single inbox message", () => {
      const result = formatAction("inbox", mockState(), [
        { file: "request.md", content: "Please fix the bug" },
      ]);
      expect(result).toContain("1 message(s)");
      expect(result).toContain("request.md");
      expect(result).toContain("Please fix the bug");
      expect(result).toContain("Inbox Messages");
    });

    test("formats multiple inbox messages separated by dividers", () => {
      const result = formatAction("inbox", mockState(), [
        { file: "a.md", content: "First" },
        { file: "b.md", content: "Second" },
      ]);
      expect(result).toContain("2 message(s)");
      expect(result).toContain("a.md");
      expect(result).toContain("b.md");
      expect(result).toContain("First");
      expect(result).toContain("Second");
      expect(result).toContain("---");
    });

    test("includes setup instruction footer", () => {
      const result = formatAction("inbox", mockState(), [
        { file: "msg.md", content: "Hello" },
      ]);
      expect(result).toContain("bun run setup");
    });
  });

  describe("skill prompt", () => {
    test("explore action has 'After exploring' footer", () => {
      const result = formatAction("explore", mockState(), []);
      expect(result).toContain("After exploring");
      expect(result).toContain("bun run setup");
    });

    test("non-explore action has 'After completing' footer", () => {
      const result = formatAction("fix-tests", mockState(), []);
      expect(result).toContain("After completing");
      expect(result).toContain("bun run setup");
    });

    test("passes article to explore action", () => {
      const article = { title: "Quorum Sensing", summary: "Bacteria communicate" };
      const result = formatAction("explore", mockState(), [], undefined, article);
      expect(result).toContain("Quorum Sensing");
    });

    test("passes article to innovate action", () => {
      const article = { title: "Mycelium", summary: "Fungal networks" };
      const result = formatAction("innovate", mockState(), [], undefined, article);
      expect(result).toContain("Mycelium");
    });

    test("does not pass article to non-explore/innovate actions", () => {
      const article = { title: "Irrelevant", summary: "Should not appear" };
      const result = formatAction("fix-tests", mockState(), [], undefined, article);
      expect(result).not.toContain("Irrelevant");
    });
  });

  describe("no skill", () => {
    test("returns nothing-to-do message when skill is null", () => {
      const result = formatAction(null, mockState(), []);
      expect(result).toContain("Nothing to Do");
    });
  });
});

describe("readWikiOverview", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-wiki-overview-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("reads and concatenates wiki files with frontmatter stripped", async () => {
    const pagesDir = join(tempDir, "wiki", "pages");
    await mkdir(pagesDir, { recursive: true });
    await writeFile(
      join(pagesDir, "architecture.md"),
      "---\ntitle: Architecture\n---\n# Architecture\nSystem design here."
    );
    await writeFile(
      join(pagesDir, "behaviour-tree.md"),
      "---\ntitle: Tree\n---\n# Behaviour Tree\nTree details here."
    );
    await writeFile(
      join(pagesDir, "pure-function-agents.md"),
      "---\ntitle: Agents\n---\n# Pure Function Agents\nAgents info."
    );

    const result = await readWikiOverview(tempDir);
    expect(result).toContain("# Architecture");
    expect(result).toContain("System design here.");
    expect(result).toContain("# Behaviour Tree");
    expect(result).toContain("Tree details here.");
    expect(result).toContain("# Pure Function Agents");
    expect(result).toContain("Agents info.");
    // Frontmatter should be stripped
    expect(result).not.toContain("title: Architecture");
    // Sections separated by ---
    expect(result).toContain("---");
  });

  test("returns fallback when no wiki files exist", async () => {
    const result = await readWikiOverview(tempDir, "nonexistent-wiki");
    expect(result).toContain("behaviour tree system");
    expect(result).toContain("autonomous AI agents");
  });

  test("skips missing files gracefully", async () => {
    const pagesDir = join(tempDir, "wiki", "pages");
    await mkdir(pagesDir, { recursive: true });
    // Only create architecture.md, skip the other two
    await writeFile(
      join(pagesDir, "architecture.md"),
      "---\ntitle: Arch\n---\n# Architecture\nOnly this file exists."
    );

    const result = await readWikiOverview(tempDir);
    expect(result).toContain("# Architecture");
    expect(result).toContain("Only this file exists.");
    // Should not error or contain undefined
    expect(result).not.toContain("undefined");
  });

  test("preserves content from files without frontmatter", async () => {
    const pagesDir = join(tempDir, "wiki", "pages");
    await mkdir(pagesDir, { recursive: true });
    await writeFile(
      join(pagesDir, "architecture.md"),
      "# No Frontmatter\nJust content."
    );

    const result = await readWikiOverview(tempDir);
    expect(result).toContain("# No Frontmatter");
    expect(result).toContain("Just content.");
  });

  test("respects custom wikiDir parameter", async () => {
    const pagesDir = join(tempDir, "custom-wiki", "pages");
    await mkdir(pagesDir, { recursive: true });
    await writeFile(
      join(pagesDir, "architecture.md"),
      "# Custom Wiki\nCustom content."
    );

    const result = await readWikiOverview(tempDir, "custom-wiki");
    expect(result).toContain("Custom content.");
  });
});
