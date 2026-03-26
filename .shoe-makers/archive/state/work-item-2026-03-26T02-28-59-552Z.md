skill-type: implement

# Add creative corpus claim-evidence patterns and fix innovate observability evidence

## Wiki Spec

From `.shoe-makers/invariants.md` section 2.6.1 (Creative corpus):
- Random concepts come from `.shoe-makers/creative-corpus/` — markdown files with title, source URL, and summary
- Corpus is populated by `scripts/fetch-wikipedia-corpus.sh`
- Setup picks one unused article at random and embeds it in the innovate prompt
- After innovate tick, article is marked as used (`used: true` in frontmatter)
- When all articles used, human runs fetch script to replenish
- Articles kept concise to minimise token usage
- Setup logs which article was selected to the shift log

From `.shoe-makers/invariants.md` section 2.6.2 (Innovate observability):
- Insight file must include article title in Lens section

## Current Code

`src/creative/wikipedia.ts`: implements `readLocalCorpus`, `pickFromCorpus`, `markArticleUsed`, `fetchArticleForAction` (which logs to shift log).

`src/__tests__/creative-corpus.test.ts`: 10 tests covering corpus reading, filtering used articles, picking from corpus, marking articles used.

`.shoe-makers/claim-evidence/23-innovate-observability.yaml` line 27: has stale pattern `"Start with the article title"` which no longer matches the new structured innovate template.

**No claim-evidence file exists for creative corpus claims** — this is why all 7 are specified-only.

## What to Build

1. Create `.shoe-makers/claim-evidence/24-creative-corpus.yaml` with evidence patterns for all 7 creative corpus claims. Match patterns against the actual code in `src/creative/wikipedia.ts` and `src/__tests__/creative-corpus.test.ts`:
   - `creative-corpus` directory path pattern
   - `fetch-wikipedia-corpus` script reference
   - `pickFromCorpus` / `readLocalCorpus` function names
   - `markArticleUsed` / `used: true` patterns
   - `articles.length === 0` or `null` for empty corpus
   - `substring(0, 1000)` for concise summaries
   - `Wikipedia article fetched` / `appendToShiftLog` for logging

2. Fix `.shoe-makers/claim-evidence/23-innovate-observability.yaml` line 27: change `"Start with the article title"` to a pattern matching the new template format (e.g., `article.title` which already appears in the source code at `src/prompts/innovate.ts`).

## Patterns to Follow

Follow existing claim-evidence YAML files (e.g., `22-section-2-6-creative-exploration-dedicat.yaml`):
- Include the IMPORTANT comment header about stripped comments
- Use claim IDs matching the invariant gap IDs from assessment.json
- `source:` patterns match against source code (comments stripped)
- `test:` patterns match against test files

## Tests to Write

No code tests needed — this is evidence pattern work (YAML config files). The invariants pipeline will validate that the patterns match existing code.

## What NOT to Change

- Do not modify any source code in `src/`
- Do not modify any test files
- Do not modify `.shoe-makers/invariants.md`
- Only modify `.shoe-makers/claim-evidence/` YAML files

## Decision Rationale

Candidate 1 closes 7 invariant gaps with a single YAML file. Combined with candidate 2's fix (1 gap), this resolves 8 of 19 remaining gaps — the highest single-tick impact. Candidate 3 (structured skills evidence) is also valuable but requires more investigation into which patterns match.
