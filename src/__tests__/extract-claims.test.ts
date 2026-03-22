import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { readWikiPages, extractClaims, extractInvariantClaims } from "../verify/extract-claims";
import type { WikiPage } from "../verify/extract-claims";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-claims-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

describe("readWikiPages", () => {
  test("returns empty array when wiki/pages dir does not exist", async () => {
    const pages = await readWikiPages(tempDir);
    expect(pages).toEqual([]);
  });

  test("returns empty array when dir is empty", async () => {
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
    const pages = await readWikiPages(tempDir);
    expect(pages).toEqual([]);
  });

  test("reads .md files and parses frontmatter", async () => {
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
    await writeFile(
      join(tempDir, "wiki/pages/architecture.md"),
      "---\ntitle: Architecture\ncategory: spec\n---\n# Architecture\nDetails here."
    );
    const pages = await readWikiPages(tempDir);
    expect(pages).toHaveLength(1);
    expect(pages[0].filename).toBe("architecture");
    expect(pages[0].title).toBe("Architecture");
    expect(pages[0].category).toBe("spec");
    expect(pages[0].content).toContain("Details here.");
  });

  test("ignores non-.md files", async () => {
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
    await writeFile(join(tempDir, "wiki/pages/notes.txt"), "not a wiki page");
    await writeFile(
      join(tempDir, "wiki/pages/real.md"),
      "---\ntitle: Real\ncategory: spec\n---\ncontent"
    );
    const pages = await readWikiPages(tempDir);
    expect(pages).toHaveLength(1);
    expect(pages[0].filename).toBe("real");
  });

  test("handles pages with no frontmatter", async () => {
    await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
    await writeFile(join(tempDir, "wiki/pages/plain.md"), "# Just a heading\nNo frontmatter.");
    const pages = await readWikiPages(tempDir);
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe("");
    expect(pages[0].category).toBe("");
  });

  test("uses custom wikiDir", async () => {
    await mkdir(join(tempDir, "docs", "pages"), { recursive: true });
    await writeFile(
      join(tempDir, "docs/pages/test.md"),
      "---\ntitle: Test\ncategory: plan\n---\ncontent"
    );
    const pages = await readWikiPages(tempDir, "docs");
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe("Test");
  });
});

describe("extractClaims", () => {
  const page: WikiPage = {
    filename: "architecture",
    title: "Architecture",
    category: "spec",
    content: "wiki content",
  };

  test("returns empty array when no claimEvidence keys match page", () => {
    const claims = extractClaims(page, {
      "other-page.some-claim": { sourceEvidence: [], testEvidence: [] },
    });
    expect(claims).toEqual([]);
  });

  test("returns empty array when claimEvidence is empty", () => {
    const claims = extractClaims(page, {});
    expect(claims).toEqual([]);
  });

  test("returns empty array when claimEvidence is not provided", () => {
    const claims = extractClaims(page);
    expect(claims).toEqual([]);
  });

  test("returns claims matching the page filename slug", () => {
    const claims = extractClaims(page, {
      "architecture.pure-functions": { sourceEvidence: [], testEvidence: [] },
      "architecture.tree-evaluator": { sourceEvidence: [], testEvidence: [] },
      "other.unrelated": { sourceEvidence: [], testEvidence: [] },
    });
    expect(claims).toHaveLength(2);
    expect(claims[0].id).toBe("architecture.pure-functions");
    expect(claims[1].id).toBe("architecture.tree-evaluator");
  });

  test("generates claim text from slug with hyphens as spaces", () => {
    const claims = extractClaims(page, {
      "architecture.each-invocation-does-one-thing": { sourceEvidence: [], testEvidence: [] },
    });
    expect(claims[0].text).toBe("each invocation does one thing");
  });

  test("uses page.category as claim group", () => {
    const claims = extractClaims(page, {
      "architecture.some-claim": { sourceEvidence: [], testEvidence: [] },
    });
    expect(claims[0].group).toBe("spec");
  });

  test("does not match partial slug prefixes", () => {
    const claims = extractClaims(page, {
      "arch.some-claim": { sourceEvidence: [], testEvidence: [] },
    });
    expect(claims).toEqual([]);
  });
});

describe("extractInvariantClaims", () => {
  test("returns empty array when invariants.md does not exist", async () => {
    const claims = await extractInvariantClaims(tempDir);
    expect(claims).toEqual([]);
  });

  test("parses sections, subsections, and bullets", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/invariants.md"),
      [
        "# Project Invariants",
        "",
        "## 1. What it does",
        "",
        "### 1.1 Core functionality",
        "- The system runs overnight",
        "- Tests must pass",
        "",
        "## 2. How it works",
        "",
        "### 2.1 Architecture",
        "- Pure function agents",
      ].join("\n")
    );
    const claims = await extractInvariantClaims(tempDir);
    expect(claims).toHaveLength(3);
    expect(claims[0].group).toBe("what-it-does");
    expect(claims[0].text).toBe("The system runs overnight");
    expect(claims[0].id).toContain("spec.core-functionality.");
    expect(claims[2].group).toBe("how-it-works");
  });

  test("ignores bullets outside sections/subsections", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/invariants.md"),
      [
        "# Invariants",
        "- This bullet is before any section",
        "",
        "## 1. Section",
        "- This bullet is before any subsection",
        "",
        "### 1.1 Sub",
        "- This bullet is valid",
      ].join("\n")
    );
    const claims = await extractInvariantClaims(tempDir);
    expect(claims).toHaveLength(1);
    expect(claims[0].text).toBe("This bullet is valid");
  });

  test("generates stable IDs with spec prefix", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/invariants.md"),
      [
        "## 1. Testing",
        "### 1.1 Unit tests",
        "- All modules have tests",
      ].join("\n")
    );
    const claims = await extractInvariantClaims(tempDir);
    expect(claims[0].id).toBe("spec.unit-tests.all-modules-have-tests");
  });

  test("truncates text slug to 60 chars", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    const longText = "a ".repeat(40).trim(); // 79 chars
    await writeFile(
      join(tempDir, ".shoe-makers/invariants.md"),
      [`## 1. Section`, `### 1.1 Sub`, `- ${longText}`].join("\n")
    );
    const claims = await extractInvariantClaims(tempDir);
    const textSlug = claims[0].id.split(".").slice(2).join(".");
    expect(textSlug.length).toBeLessThanOrEqual(60);
  });

  test("strips special characters from slugs", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/invariants.md"),
      [
        "## 1. What it does!",
        "### 1.1 Core (functionality)",
        "- The system's API handles /api/pages correctly",
      ].join("\n")
    );
    const claims = await extractInvariantClaims(tempDir);
    expect(claims[0].id).not.toMatch(/[^a-z0-9.\-]/);
  });

  test("sets page to invariants for all claims", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/invariants.md"),
      ["## 1. Section", "### 1.1 Sub", "- Claim one", "- Claim two"].join("\n")
    );
    const claims = await extractInvariantClaims(tempDir);
    for (const claim of claims) {
      expect(claim.page).toBe("invariants");
    }
  });
});
