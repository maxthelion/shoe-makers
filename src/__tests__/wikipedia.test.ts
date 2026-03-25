import { describe, test, expect, afterEach } from "bun:test";
import { shouldIncludeLens, fetchRandomArticle, FALLBACK_CONCEPTS, getRandomFallbackConcept } from "../creative/wikipedia";

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
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(fn: (...args: Parameters<typeof fetch>) => Promise<Response> | never): void {
    globalThis.fetch = Object.assign(fn, { preconnect: (originalFetch as any).preconnect }) as typeof fetch;
  }

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
