# Work Item: Extract Wikipedia article fetching from setup.ts

skill-type: health

## Context

`src/setup.ts` is 409 lines handling many concerns. The Wikipedia article fetching + shift log integration (lines 86-100) is a self-contained block that was added for invariant 2.6.1.

## What to build

Extract the article-fetching logic from `setup.ts` into a dedicated helper function in `src/creative/wikipedia.ts`:

```typescript
export async function fetchArticleForAction(
  repoRoot: string,
  skill: string,
  config: Config,
): Promise<{ title: string; summary: string } | undefined> {
  if (skill === "innovate") {
    const article = (await fetchRandomArticle()) ?? undefined;
    if (article) {
      console.log(`[setup] Wikipedia article fetched: "${article.title}"`);
      await appendToShiftLog(repoRoot, `- **Wikipedia article**: "${article.title}"\n`);
    } else {
      console.log("[setup] Wikipedia article fetch failed");
      await appendToShiftLog(repoRoot, "- **Wikipedia article**: fetch failed — no article available\n");
    }
    return article;
  } else if (skill === "explore" && shouldIncludeLens(config.insightFrequency)) {
    return (await fetchRandomArticle()) ?? undefined;
  }
  return undefined;
}
```

Then in `setup.ts`, replace lines 86-94 with:
```typescript
const article = await fetchArticleForAction(repoRoot, skill!, config);
```

## Tests to write

Add a test in `src/__tests__/wikipedia.test.ts`:
- `fetchArticleForAction` returns article for "innovate" skill
- `fetchArticleForAction` returns undefined for non-creative skills
- `fetchArticleForAction` calls appendToShiftLog on success for innovate
- `fetchArticleForAction` calls appendToShiftLog on failure for innovate

## What NOT to change

- Don't modify the prompt generation
- Don't change the behaviour tree
- Don't modify other parts of setup.ts

## Decision Rationale

Chosen over plan-based routing (#4) because:
- Lower risk — pure refactoring with clear boundaries
- Directly improves testability of the 2.6.1 code we just added
- Reduces setup.ts complexity without changing behaviour
- Plan-based routing requires tree changes which are higher risk
