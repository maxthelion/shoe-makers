import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import { shouldIncludeLens, fetchRandomArticle, fetchArticleForAction, FALLBACK_CONCEPTS, getRandomFallbackConcept, loadCorpus, pickUnusedArticle, markArticleUsed, fetchArticleFromCorpus } from "../creative/wikipedia";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const originalFetch = globalThis.fetch;

function mockFetch(fn: (...args: Parameters<typeof fetch>) => Promise<Response> | never): void {
  globalThis.fetch = Object.assign(fn, { preconnect: originalFetch.preconnect }) as typeof fetch;
}

function mockSuccessfulFetch(): void {
  const longSummary = "A".repeat(200);
  let callCount = 0;
  mockFetch(async () => {
    callCount++;
    if (callCount === 1) {
      return new Response(JSON.stringify({
        query: { random: [{ title: "Mock Article" }] },
      }));
    }
    return new Response(JSON.stringify({
      query: { pages: { "1": { extract: longSummary } } },
    }));
  });
}

describe("shouldIncludeLens", () => {
  test("returns false when frequency is 0", () => {
    expect(shouldIncludeLens(0)).toBe(false);
  });

  test("returns true when frequency is 1", () => {
    expect(shouldIncludeLens(1)).toBe(true);
  });

  test("defaults to 0.3 when no argument given", () => {
    const results = Array.from({ length: 100 }, () => shouldIncludeLens());
    expect(results.some((r) => r === true)).toBe(true);
    expect(results.some((r) => r === false)).toBe(true);
  });
});

describe("FALLBACK_CONCEPTS", () => {
  test("has at least 50 entries", () => {
    expect(FALLBACK_CONCEPTS.length).toBeGreaterThanOrEqual(50);
  });

  test("each entry has a non-empty title and summary of at least 50 characters", () => {
    for (const concept of FALLBACK_CONCEPTS) {
      expect(concept.title.length).toBeGreaterThan(0);
      expect(concept.summary.length).toBeGreaterThanOrEqual(50);
    }
  });
});

describe("getRandomFallbackConcept", () => {
  test("returns an object with title and summary strings", () => {
    const concept = getRandomFallbackConcept();
    expect(typeof concept.title).toBe("string");
    expect(typeof concept.summary).toBe("string");
    expect(concept.title.length).toBeGreaterThan(0);
    expect(concept.summary.length).toBeGreaterThan(0);
  });

  test("returns different values across multiple calls", () => {
    const titles = new Set<string>();
    for (let i = 0; i < 20; i++) {
      titles.add(getRandomFallbackConcept().title);
    }
    // With 50+ concepts, 20 calls should produce at least 2 unique titles
    expect(titles.size).toBeGreaterThanOrEqual(2);
  });
});

describe("fetchRandomArticle", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns fallback concept on network error", async () => {
    mockFetch(() => { throw new Error("Network error"); });
    const result = await fetchRandomArticle();
    expect(result).not.toBeNull();
    expect(FALLBACK_CONCEPTS).toContainEqual(result!);
  });

  test("returns fallback concept when API returns non-OK status", async () => {
    mockFetch(async () => new Response("", { status: 500 }));
    const result = await fetchRandomArticle();
    expect(result).not.toBeNull();
    expect(FALLBACK_CONCEPTS).toContainEqual(result!);
  });

  test("returns fallback concept for stub articles with short extracts", async () => {
    let callCount = 0;
    mockFetch(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({
          query: { random: [{ title: "Stub Article" }] },
        }));
      }
      return new Response(JSON.stringify({
        query: { pages: { "1": { extract: "Short." } } },
      }));
    });
    const result = await fetchRandomArticle();
    expect(result).not.toBeNull();
    expect(FALLBACK_CONCEPTS).toContainEqual(result!);
  });

  test("returns title and summary on success", async () => {
    const longSummary = "A".repeat(200);
    let callCount = 0;
    mockFetch(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({
          query: { random: [{ title: "Test Article" }] },
        }));
      }
      return new Response(JSON.stringify({
        query: { pages: { "42": { extract: longSummary } } },
      }));
    });
    const result = await fetchRandomArticle();
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Article");
    expect(result!.summary).toBe(longSummary);
  });

  test("truncates summary to 1000 characters", async () => {
    const longSummary = "B".repeat(2000);
    let callCount = 0;
    mockFetch(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({
          query: { random: [{ title: "Long Article" }] },
        }));
      }
      return new Response(JSON.stringify({
        query: { pages: { "99": { extract: longSummary } } },
      }));
    });
    const result = await fetchRandomArticle();
    expect(result).not.toBeNull();
    expect(result!.summary.length).toBe(1000);
  });
});

describe("fetchArticleForAction", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns article for innovate skill", async () => {
    mockSuccessfulFetch();
    const logs: string[] = [];
    const result = await fetchArticleForAction("innovate", 0.3, async (e) => { logs.push(e); });
    expect(result).not.toBeUndefined();
    expect(result!.title).toBe("Mock Article");
  });

  test("logs article to shift log on innovate success", async () => {
    mockSuccessfulFetch();
    const logs: string[] = [];
    await fetchArticleForAction("innovate", 0.3, async (e) => { logs.push(e); });
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain("Mock Article");
  });

  test("falls back to local concept when innovate fetch fails", async () => {
    mockFetch(() => { throw new Error("Network error"); });
    const logs: string[] = [];
    const result = await fetchArticleForAction("innovate", 0.3, async (e) => { logs.push(e); });
    // fetchRandomArticle catches network errors and returns a fallback concept
    expect(result).not.toBeUndefined();
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain("Wikipedia article");
  });

  test("returns undefined for non-creative skills", async () => {
    mockSuccessfulFetch();
    const result = await fetchArticleForAction("fix-tests", 0.3, async () => {});
    expect(result).toBeUndefined();
  });

  test("returns undefined when skill is null", async () => {
    const result = await fetchArticleForAction(null, 0.3, async () => {});
    expect(result).toBeUndefined();
  });

  test("explore with frequency 1 fetches article", async () => {
    mockSuccessfulFetch();
    const result = await fetchArticleForAction("explore", 1, async () => {});
    expect(result).not.toBeUndefined();
    expect(result!.title).toBe("Mock Article");
  });

  test("explore with frequency 0 returns undefined", async () => {
    mockSuccessfulFetch();
    const result = await fetchArticleForAction("explore", 0, async () => {});
    expect(result).toBeUndefined();
  });

  test("explore does not log to shift log", async () => {
    mockSuccessfulFetch();
    const logs: string[] = [];
    await fetchArticleForAction("explore", 1, async (e) => { logs.push(e); });
    expect(logs.length).toBe(0);
  });
});

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
