skill-type: implement

# Add local fallback corpus for creative lens when Wikipedia is unreachable

## Context

The innovate action uses `src/creative/wikipedia.ts:fetchRandomArticle()` to provide a random Wikipedia article as a creative lens. When the network is blocked (air-gapped environments, restricted CI, etc.), the function returns `null` and the innovate prompt receives "Unknown — No article fetched." This defeats the purpose of forced serendipity.

The spec in `wiki/pages/creative-exploration.md` says: "The innovate action receives a deterministic creative brief from the setup script: a summary of the system (from the wiki) and a random Wikipedia article." The intent is that the elf always gets a real creative lens.

## What to build

### File: `src/creative/wikipedia.ts`

1. Add a `FALLBACK_CONCEPTS` array of 50-100 diverse topic objects with `{ title: string, summary: string }`. These should be real, interesting concepts from diverse domains:
   - Biology (e.g., "Mycelial Networks", "Quorum Sensing", "Stigmergy")
   - Architecture (e.g., "Desire Paths", "Christopher Alexander's Pattern Language")
   - Game design (e.g., "Fog of War", "Rubber-banding", "Procedural Generation")
   - Music theory (e.g., "Counterpoint", "Call and Response", "Ostinato")
   - Economics (e.g., "Tragedy of the Commons", "Pareto Efficiency", "Dutch Auction")
   - Systems theory (e.g., "Feedback Loop", "Emergent Behaviour", "Homeostasis")
   - Mathematics (e.g., "Cellular Automaton", "Monte Carlo Method", "Graph Coloring")
   - And others — aim for breadth across disciplines

   Each summary should be 2-3 sentences explaining the concept — enough to be a useful creative lens.

2. Add a `getRandomFallbackConcept()` function that returns a random entry from `FALLBACK_CONCEPTS`.

3. Modify `fetchRandomArticle()` to call `getRandomFallbackConcept()` as a fallback when the Wikipedia API returns null:
   ```typescript
   export async function fetchRandomArticle(): Promise<{ title: string; summary: string } | null> {
     try {
       // ... existing Wikipedia fetch logic ...
       return { title, summary: summary.substring(0, 1000) };
     } catch {
       // Network error — fall back to local corpus
     }
     return getRandomFallbackConcept();
   }
   ```

   Note: the fallback should also trigger when `randomRes.ok` is false or when the extract is too short — not just in the catch block. Restructure so ANY failure path falls through to the local corpus.

## What to test

Add tests in the appropriate test file:

1. `getRandomFallbackConcept()` returns an object with `title` and `summary` strings
2. `getRandomFallbackConcept()` returns different values across multiple calls (randomness works)
3. `FALLBACK_CONCEPTS` has at least 50 entries
4. Each entry in `FALLBACK_CONCEPTS` has a non-empty title and summary of at least 50 characters

## Patterns to follow

- The function signature of `fetchRandomArticle()` stays the same: `Promise<{ title: string; summary: string } | null>`
- Keep `shouldIncludeLens()` unchanged
- Export `FALLBACK_CONCEPTS` and `getRandomFallbackConcept()` for testing

## What NOT to change

- Do not modify `src/setup.ts` or `src/prompts/three-phase.ts` — they already handle the article correctly
- Do not modify the tree or the behaviour tree conditions
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 (creative fallback) was chosen because:
- **Highest impact**: Every innovate action this shift failed to get a creative lens, producing low-quality insights. This directly fixes that.
- **Directly specified**: The wiki spec says the innovate action receives "a random Wikipedia article" — the intent is a creative lens, not specifically Wikipedia. A local corpus fulfills the spec's intent.
- Candidate #2 (loop breaker) is good follow-up but lower priority now that review churn is reduced by the orchestration skip
- Candidate #3 (typecheck) is environment-specific and the tree already handles null correctly
