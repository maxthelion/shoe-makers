# Work Item: Handle missing Wikipedia article in innovate prompt

skill-type: bug-fix

## Original Insight

From `.shoe-makers/insights/2026-03-24-001.md`: when fetchRandomArticle() fails, the innovate prompt says "Use the Wikipedia article above" but the article section shows "Unknown / No article fetched." This creates contradictory instructions.

## What to fix

In `src/prompts/three-phase.ts`, the `buildInnovatePrompt` function always requires a `{ title, summary }` article parameter. But `src/setup.ts` (via `fetchArticleForAction`) can return `undefined` when the fetch fails.

Looking at `src/prompts/index.ts`, the `generatePrompt` function passes `article` to `buildInnovatePrompt`. When article is undefined, the prompt template interpolates `undefined` for title and summary.

### Changes needed:

1. In `src/prompts/index.ts` or `src/prompts/three-phase.ts`: handle the case where article is undefined for innovate. Options:
   - Add a `buildInnovatePromptNoArticle` that uses general creative exploration without referencing a specific article
   - Or make `buildInnovatePrompt` accept an optional article and adjust the instructions accordingly

2. The key fix: when no article exists, the prompt should say "No Wikipedia article was available this tick. Use your own creative lens — pick an unexpected domain and find a connection to the shoe-makers system." NOT "Use the Wikipedia article above."

## Tests to write

Add a test in `src/__tests__/prompts.test.ts`:
- When no article is provided, innovate prompt does not mention "Wikipedia article above"
- When no article is provided, innovate prompt still requires writing an insight file

## What NOT to change

- Don't change the Wikipedia fetching logic
- Don't add curated seed concepts (that's a separate feature)
- Don't modify invariants.md
