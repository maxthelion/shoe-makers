# Consolidate prompts-features.test.ts static-content tests

skill-type: octoclean-fix

## Goal

Reduce LOC in `src/__tests__/prompts-features.test.ts` (currently ~360 lines, score 93) by merging tests that call the same function with the same args and check for static content.

## Changes

### "innovate prompt" block (lines ~337-393)

Tests sharing the same prompt (line 340): `generatePrompt("innovate", makeState(), undefined, article, undefined, wikiSummary)`:
- "includes wiki summary and article" (3 expects)
- "mandates writing an insight file" (3 expects)
- "says no connection found is not acceptable" (2 expects)
- "mentions divergent/creative mode" (1 expect)
- "mentions off-limits" (2 expects)
- "requires Wikipedia article as the lens" (2 expects)
- "Lens section format" (2 expects)
- "Lens section references article.title" (2 expects)

Merge into 2 tests:
1. **"with article includes all required content"** — covers wiki summary, article details, insight file, no-connection, divergent mode, off-limits, lens format
2. **"handles missing article gracefully"** — keep as-is (different input)

### "evaluate-insight prompt" block (lines ~395-424)

6 tests all calling `generatePrompt("evaluate-insight", makeState())`. Merge into 1 test.

## Patterns

- Same approach as the prompt-builders consolidation
- Preserve all expect() assertions — just merge into fewer test() calls
- Keep tests with different inputs separate

## What NOT to change

- Do not change any other files
- Do not change tests with distinct inputs (the "handles missing article" test stays separate)
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chose candidate #1 over #2 and #3. prompts-features.test.ts has the clearest consolidation opportunity — 14 tests sharing 2 prompts. world.test.ts and setup.ts need different approaches (withTempDir migration and function extraction respectively), which are more involved.
