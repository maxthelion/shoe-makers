# Innovate observability — log the Wikipedia article

The innovate action must use the Wikipedia article provided in the creative brief. The first round of insights all said "(No Wikipedia article was fetched this tick — using general knowledge)" which defeats the purpose of random conceptual collision.

## What needs to happen

1. **Setup must log the article**: when `fetchRandomArticle()` succeeds, log the article title to the shift log. If it fails, log that too. This goes in setup.ts where the article is fetched for the innovate action.

2. **The innovate prompt must be explicit**: the elf must reference the provided Wikipedia article in the Lens section of the insight file. Add to the prompt: "Your insight MUST use the Wikipedia article provided above as the lens. Do not use general knowledge — the whole point is forced serendipity from an outside concept."

3. **The insight file format must include the article title**: the Lens section should start with the article title so it's grep-able.

Check the invariants at section 2.6.1 for the full spec.
