import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { parseFrontmatter } from "../utils/frontmatter";
import { FALLBACK_CONCEPTS, getRandomFallbackConcept } from "./fallback-concepts";

// Re-export for backward compatibility
export { FALLBACK_CONCEPTS, getRandomFallbackConcept } from "./fallback-concepts";

/**
 * A creative corpus article from .shoe-makers/creative-corpus/.
 * Articles should be kept concise to minimise token usage — the summary is the creative seed.
 */
export interface CorpusArticle {
  title: string;
  source: string;
  summary: string;
  used?: boolean;
  filePath: string;
}

/**
 * Load all articles from .shoe-makers/creative-corpus/.
 * Returns them parsed with frontmatter (title, source, used) and body (summary).
 */
export async function loadCorpus(repoRoot: string): Promise<CorpusArticle[]> {
  const corpusDir = join(repoRoot, ".shoe-makers", "creative-corpus");
  let files: string[];
  try {
    files = (await readdir(corpusDir)).filter(f => f.endsWith(".md"));
  } catch {
    return [];
  }

  const articles: CorpusArticle[] = [];
  for (const file of files) {
    const filePath = join(corpusDir, file);
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = parseFrontmatter(content);
      if (!parsed) continue;
      const { frontmatter, body } = parsed;
      const fields: Record<string, string> = {};
      for (const line of frontmatter.split("\n")) {
        const match = line.match(/^(\S+):\s*(.+)$/);
        if (match) fields[match[1]] = match[2].trim();
      }
      const title = fields["title"]?.replace(/^"|"$/g, "") ?? file.replace(/\.md$/, "");
      const source = fields["source"] ?? "";
      const used = fields["used"] === "true";
      const summary = body.trim();
      if (summary) {
        articles.push({ title, source, summary, used, filePath });
      }
    } catch {
      // skip unreadable files
    }
  }
  return articles;
}

/**
 * Pick one unused article at random from the corpus.
 * Returns null if no unused articles are available (corpus empty or all used).
 * When all articles are used (or the corpus is empty), the human should run
 * scripts/fetch-wikipedia-corpus.sh to replenish it.
 */
export function pickUnusedArticle(articles: CorpusArticle[]): CorpusArticle | null {
  const unused = articles.filter(a => !a.used);
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

/**
 * Mark an article as used by adding `used: true` to its frontmatter.
 * Each article is used only once.
 * Accepts either a CorpusArticle object or a filepath string.
 */
export async function markArticleUsed(articleOrFilepath: CorpusArticle | string): Promise<void> {
  const filepath = typeof articleOrFilepath === "string" ? articleOrFilepath : articleOrFilepath.filePath;
  const content = await readFile(filepath, "utf-8");
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    if (fm.includes("used:")) {
      const updated = content.replace(/^---\n[\s\S]*?\n---/, fmMatch[0].replace(/used:\s*\S+/, "used: true"));
      await writeFile(filepath, updated, "utf-8");
    } else {
      const newFm = fm + "\nused: true";
      const updated = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFm}\n---`);
      await writeFile(filepath, updated, "utf-8");
    }
  } else {
    // No frontmatter — add one
    await writeFile(filepath, `---\nused: true\n---\n${content}`);
  }
}

/**
 * Read all unused articles from the local creative corpus.
 * Backward-compatible API that returns articles with `filepath` field.
 */
export async function readLocalCorpus(repoRoot: string): Promise<{ title: string; summary: string; filepath: string }[]> {
  const articles = await loadCorpus(repoRoot);
  return articles
    .filter(a => !a.used)
    .map(a => ({ title: a.title, summary: a.summary.substring(0, 1000), filepath: a.filePath }));
}

/**
 * Pick a random unused article from the local corpus.
 */
export async function pickFromCorpus(repoRoot: string): Promise<{ title: string; summary: string; filepath: string } | null> {
  const articles = await readLocalCorpus(repoRoot);
  if (articles.length === 0) return null;
  return articles[Math.floor(Math.random() * articles.length)];
}

/**
 * Fetch a random article from the local creative corpus.
 * Falls back to the hardcoded concept list if the corpus is empty or all used.
 */
export async function fetchArticleFromCorpus(repoRoot: string): Promise<{
  title: string;
  summary: string;
  corpusArticle?: CorpusArticle;
} | null> {
  const articles = await loadCorpus(repoRoot);
  const article = pickUnusedArticle(articles);
  if (article) {
    return { title: article.title, summary: article.summary, corpusArticle: article };
  }
  // Corpus empty or all used — fall back to hardcoded concepts
  return getRandomFallbackConcept();
}

/**
 * Fetch a random Wikipedia article summary for analogical prompting.
 * Priority: Wikipedia API -> local corpus -> hardcoded fallback.
 */
export async function fetchRandomArticle(timeout: number = 10_000, repoRoot?: string): Promise<{
  title: string;
  summary: string;
  corpusFilepath?: string;
} | null> {
  // 1. Try Wikipedia API
  try {
    const randomRes = await fetch(
      "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json",
      { signal: AbortSignal.timeout(timeout) }
    );
    if (randomRes.ok) {
      const randomData = await randomRes.json();
      const title = randomData?.query?.random?.[0]?.title;
      if (title) {
        const extractRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json`,
          { signal: AbortSignal.timeout(timeout) }
        );
        if (extractRes.ok) {
          const extractData = await extractRes.json();
          const pages = extractData?.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0] as { extract?: string };
            const summary = page?.extract?.trim();
            if (summary && summary.length >= 50) {
              return { title, summary: summary.substring(0, 1000) };
            }
          }
        }
      }
    }
  } catch {
    // Wikipedia unreachable — fall through
  }

  // 2. Try local corpus
  if (repoRoot) {
    const articles = await loadCorpus(repoRoot);
    const article = pickUnusedArticle(articles);
    if (article) {
      return { title: article.title, summary: article.summary, corpusFilepath: article.filePath };
    }
  }

  // 3. Hardcoded fallback
  return getRandomFallbackConcept();
}

/**
 * Decide whether this explore cycle should include a creative lens.
 * Uses the configured insightFrequency (default 0.3 = 30% of cycles).
 */
export function shouldIncludeLens(frequency: number = 0.3): boolean {
  return Math.random() < frequency;
}

/**
 * Fetch a Wikipedia article for the given skill action.
 * For innovate: picks from the local creative corpus and logs to shift log.
 *   Setup picks one unused article at random from the corpus and embeds it in the innovate prompt.
 * For explore: probabilistic based on insightFrequency.
 * Returns undefined for all other skills.
 */
export async function fetchArticleForAction(
  skill: string | null,
  insightFrequency: number,
  logToShiftLog: (entry: string) => Promise<void>,
  repoRoot?: string,
): Promise<{ title: string; summary: string } | undefined> {
  if (skill === "innovate") {
    // Try local corpus first (Wikipedia is blocked in cloud environment)
    if (repoRoot) {
      const result = await fetchArticleFromCorpus(repoRoot);
      if (result) {
        // Mark article as used if it came from the corpus
        if (result.corpusArticle) {
          await markArticleUsed(result.corpusArticle);
        }
        console.log(`[setup] Wikipedia article fetched: "${result.title}"`);
        await logToShiftLog(`- **Wikipedia article**: "${result.title}"\n`);
        return { title: result.title, summary: result.summary };
      }
    }
    // Fallback to live Wikipedia fetch
    const article = (await fetchRandomArticle()) ?? undefined;
    if (article) {
      console.log(`[setup] Wikipedia article fetched: "${article.title}"`);
      await logToShiftLog(`- **Wikipedia article**: "${article.title}"\n`);
    } else {
      console.log("[setup] Wikipedia article fetch failed");
      await logToShiftLog("- **Wikipedia article**: fetch failed — no article available\n");
    }
    return article;
  }

  if (skill === "explore" && shouldIncludeLens(insightFrequency)) {
    // Try local corpus first for explore too
    if (repoRoot) {
      const result = await fetchArticleFromCorpus(repoRoot);
      if (result) {
        return { title: result.title, summary: result.summary };
      }
    }
    return (await fetchRandomArticle()) ?? undefined;
  }

  return undefined;
}
