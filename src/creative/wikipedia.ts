/**
 * Fetch a random Wikipedia article summary for analogical prompting.
 * Returns null if the fetch fails — creative exploration is optional.
 */
export async function fetchRandomArticle(): Promise<{
  title: string;
  summary: string;
} | null> {
  try {
    // Get a random article title
    const randomRes = await fetch(
      "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json"
    );
    if (!randomRes.ok) return null;
    const randomData = await randomRes.json();
    const title = randomData?.query?.random?.[0]?.title;
    if (!title) return null;

    // Get the article extract
    const extractRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json`
    );
    if (!extractRes.ok) return null;
    const extractData = await extractRes.json();
    const pages = extractData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as { extract?: string };
    const summary = page?.extract?.trim();
    if (!summary || summary.length < 50) return null; // skip stubs

    return { title, summary: summary.substring(0, 1000) };
  } catch {
    return null; // network error, timeout, etc. — creative exploration is optional
  }
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
 * For innovate: always fetch and log to shift log.
 * For explore: probabilistic based on insightFrequency.
 * Returns undefined for all other skills.
 */
export async function fetchArticleForAction(
  skill: string | null,
  insightFrequency: number,
  logToShiftLog: (entry: string) => Promise<void>,
): Promise<{ title: string; summary: string } | undefined> {
  if (skill === "innovate") {
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
    return (await fetchRandomArticle()) ?? undefined;
  }

  return undefined;
}
