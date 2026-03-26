import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { readLocalCorpus, pickFromCorpus, markArticleUsed } from "../creative/wikipedia";

describe("readLocalCorpus", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "corpus-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("reads articles from corpus directory", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "test-article.md"), `---
title: "Test Article"
source: https://example.com
fetched: 2026-03-25
---

This is the article summary.`);

    const articles = await readLocalCorpus(tempDir);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Test Article");
    expect(articles[0].summary).toContain("article summary");
  });

  test("filters out articles with used: true", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "used.md"), `---
title: "Used Article"
used: true
---

Content here.`);
    await writeFile(join(dir, "unused.md"), `---
title: "Unused Article"
---

Fresh content.`);

    const articles = await readLocalCorpus(tempDir);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Unused Article");
  });

  test("returns empty array when directory does not exist", async () => {
    const articles = await readLocalCorpus(tempDir);
    expect(articles).toEqual([]);
  });

  test("uses filename as title when frontmatter has no title", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "my-topic.md"), `---
source: https://example.com
---

Some content.`);

    const articles = await readLocalCorpus(tempDir);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("my-topic");
  });

  test("skips files with empty body", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "empty.md"), `---
title: "Empty"
---
`);

    const articles = await readLocalCorpus(tempDir);
    expect(articles).toHaveLength(0);
  });

  test("truncates summary to 1000 chars", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    const longContent = "A".repeat(2000);
    await writeFile(join(dir, "long.md"), `---
title: "Long"
---

${longContent}`);

    const articles = await readLocalCorpus(tempDir);
    expect(articles[0].summary.length).toBe(1000);
  });
});

describe("pickFromCorpus", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "corpus-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns null when all articles are used", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "used.md"), `---
title: "Used"
used: true
---

Content.`);

    const result = await pickFromCorpus(tempDir);
    expect(result).toBeNull();
  });

  test("returns null when corpus directory is empty", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    const result = await pickFromCorpus(tempDir);
    expect(result).toBeNull();
  });

  test("returns an article when unused articles exist", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "available.md"), `---
title: "Available Article"
---

Some content here.`);

    const result = await pickFromCorpus(tempDir);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Available Article");
    expect(result!.filepath).toContain("available.md");
  });
});

describe("markArticleUsed", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "corpus-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("adds used: true to existing frontmatter", async () => {
    const filepath = join(tempDir, "article.md");
    await writeFile(filepath, `---
title: "Test"
source: https://example.com
---

Content here.`);

    await markArticleUsed(filepath);

    const updated = await readFile(filepath, "utf-8");
    expect(updated).toContain("used: true");
    expect(updated).toContain("title: \"Test\"");
    expect(updated).toContain("source: https://example.com");
    expect(updated).toContain("Content here.");
  });

  test("preserves all existing frontmatter fields", async () => {
    const filepath = join(tempDir, "article.md");
    await writeFile(filepath, `---
title: "Preserved"
source: https://example.com
fetched: 2026-03-25
---

Body.`);

    await markArticleUsed(filepath);

    const updated = await readFile(filepath, "utf-8");
    expect(updated).toContain('title: "Preserved"');
    expect(updated).toContain("source: https://example.com");
    expect(updated).toContain("fetched: 2026-03-25");
    expect(updated).toContain("used: true");
  });

  test("adds frontmatter when none exists", async () => {
    const filepath = join(tempDir, "no-fm.md");
    await writeFile(filepath, "Just plain content.");

    await markArticleUsed(filepath);

    const updated = await readFile(filepath, "utf-8");
    expect(updated).toContain("---\nused: true\n---");
    expect(updated).toContain("Just plain content.");
  });

  test("article is filtered by readLocalCorpus after marking", async () => {
    const dir = join(tempDir, ".shoe-makers", "creative-corpus");
    await mkdir(dir, { recursive: true });
    const filepath = join(dir, "to-mark.md");
    await writeFile(filepath, `---
title: "Will Be Used"
---

Content.`);

    // Before marking
    let articles = await readLocalCorpus(tempDir);
    expect(articles).toHaveLength(1);

    // Mark as used
    await markArticleUsed(filepath);

    // After marking
    articles = await readLocalCorpus(tempDir);
    expect(articles).toHaveLength(0);
  });
});
