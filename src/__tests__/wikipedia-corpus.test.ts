import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import { loadCorpus, pickUnusedArticle, markArticleUsed, fetchArticleFromCorpus } from "../creative/wikipedia";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("creative corpus", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-corpus-"));
    await mkdir(join(tempDir, ".shoe-makers", "creative-corpus"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const articleContent = `---
title: "Seaside, Florida"
source: https://en.wikipedia.org/wiki/Seaside
fetched: 2026-03-25T10:00:00Z
---

Seaside is an unincorporated master-planned community on the Florida Panhandle.`;

  const usedArticleContent = `---
title: "Used Article"
source: https://en.wikipedia.org/wiki/Used
fetched: 2026-03-25T10:00:00Z
used: true
---

This article has already been used.`;

  test("loadCorpus reads markdown files from creative-corpus dir", async () => {
    await writeFile(join(tempDir, ".shoe-makers", "creative-corpus", "seaside.md"), articleContent);
    const articles = await loadCorpus(tempDir);
    expect(articles.length).toBe(1);
    expect(articles[0].title).toBe("Seaside, Florida");
    expect(articles[0].source).toBe("https://en.wikipedia.org/wiki/Seaside");
    expect(articles[0].summary).toContain("master-planned community");
    expect(articles[0].used).toBe(false);
  });

  test("loadCorpus detects used articles", async () => {
    await writeFile(join(tempDir, ".shoe-makers", "creative-corpus", "used.md"), usedArticleContent);
    const articles = await loadCorpus(tempDir);
    expect(articles.length).toBe(1);
    expect(articles[0].used).toBe(true);
  });

  test("loadCorpus returns empty array when directory missing", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "shoe-makers-empty-"));
    const articles = await loadCorpus(emptyDir);
    expect(articles.length).toBe(0);
    await rm(emptyDir, { recursive: true, force: true });
  });

  test("pickUnusedArticle returns an unused article", async () => {
    await writeFile(join(tempDir, ".shoe-makers", "creative-corpus", "seaside.md"), articleContent);
    await writeFile(join(tempDir, ".shoe-makers", "creative-corpus", "used.md"), usedArticleContent);
    const articles = await loadCorpus(tempDir);
    const picked = pickUnusedArticle(articles);
    expect(picked).not.toBeNull();
    expect(picked!.title).toBe("Seaside, Florida");
    expect(picked!.used).toBe(false);
  });

  test("pickUnusedArticle returns null when all used", async () => {
    await writeFile(join(tempDir, ".shoe-makers", "creative-corpus", "used.md"), usedArticleContent);
    const articles = await loadCorpus(tempDir);
    const picked = pickUnusedArticle(articles);
    expect(picked).toBeNull();
  });

  test("pickUnusedArticle returns null for empty corpus", () => {
    expect(pickUnusedArticle([])).toBeNull();
  });

  test("markArticleUsed adds used: true to frontmatter", async () => {
    const filePath = join(tempDir, ".shoe-makers", "creative-corpus", "seaside.md");
    await writeFile(filePath, articleContent);
    const articles = await loadCorpus(tempDir);
    expect(articles[0].used).toBe(false);
    await markArticleUsed(articles[0]);
    const updated = await readFile(filePath, "utf-8");
    expect(updated).toContain("used: true");
    // Re-load and verify
    const reloaded = await loadCorpus(tempDir);
    expect(reloaded[0].used).toBe(true);
  });

  test("fetchArticleFromCorpus picks from local corpus", async () => {
    await writeFile(join(tempDir, ".shoe-makers", "creative-corpus", "seaside.md"), articleContent);
    const result = await fetchArticleFromCorpus(tempDir);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Seaside, Florida");
    expect(result!.corpusArticle).toBeDefined();
  });

  test("fetchArticleFromCorpus falls back when corpus empty", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "shoe-makers-noc-"));
    await mkdir(join(emptyDir, ".shoe-makers", "creative-corpus"), { recursive: true });
    const result = await fetchArticleFromCorpus(emptyDir);
    // Falls back to hardcoded concepts
    expect(result).not.toBeNull();
    expect(result!.title.length).toBeGreaterThan(0);
    await rm(emptyDir, { recursive: true, force: true });
  });
});
