# Extract FALLBACK_CONCEPTS from wikipedia.ts into a separate module

skill-type: health

## Wiki context

From `wiki/pages/creative-exploration.md`, the creative corpus system uses a hardcoded fallback concept list when the local creative corpus is empty and Wikipedia is unreachable. The spec says concepts should be "diverse" and available as a fallback.

From `wiki/pages/architecture.md`, the system should maintain clean separation of concerns.

## Current state

`src/creative/wikipedia.ts` (287 lines) contains both:
1. **Logic** (corpus loading, article fetching, marking used, random selection) — ~110 lines
2. **Data** (the `FALLBACK_CONCEPTS` array with 50+ entries) — ~75 lines of dense data

The data block sits in the middle of the file (lines 107–179), splitting the logic into two halves and inflating the module's complexity score.

## What to do

1. Create `src/creative/fallback-concepts.ts` containing:
   - The `FALLBACK_CONCEPTS` array (exported)
   - The `getRandomFallbackConcept()` function (exported)

2. Update `src/creative/wikipedia.ts`:
   - Remove the `FALLBACK_CONCEPTS` array and `getRandomFallbackConcept()` function
   - Add `import { FALLBACK_CONCEPTS, getRandomFallbackConcept } from "./fallback-concepts"`
   - Re-export `FALLBACK_CONCEPTS` and `getRandomFallbackConcept` so existing imports from `"../creative/wikipedia"` continue to work

3. Verify all tests pass unchanged — `src/__tests__/wikipedia.test.ts` imports `FALLBACK_CONCEPTS` and `getRandomFallbackConcept` from `"../creative/wikipedia"`, and the re-export ensures these still resolve.

## Patterns to follow

- The existing codebase uses simple, focused modules (see `src/utils/frontmatter.ts` at 21 lines)
- Export from the new file, re-export from the old file for backward compatibility
- No changes to test files should be needed

## Tests to write

No new tests needed. The existing tests in `src/__tests__/wikipedia.test.ts` cover:
- `FALLBACK_CONCEPTS` has at least 50 entries (line 26)
- Each entry has non-empty title and summary ≥50 chars (line 28)
- `getRandomFallbackConcept()` returns valid objects (line 37)
- `getRandomFallbackConcept()` returns varied results (line 45)

Run `bun test` to confirm all 888 tests still pass.

## What NOT to change

- Do not modify test files — the re-export ensures backward compatibility
- Do not modify the content of FALLBACK_CONCEPTS entries
- Do not change any function signatures
- Do not modify `.shoe-makers/invariants.md`
- Do not modify any other source files beyond `src/creative/wikipedia.ts` and the new `src/creative/fallback-concepts.ts`

## Decision Rationale

Chosen over candidate #1 (test file health) because the instructions explicitly say "prefer implementation, improvement, and creative work over writing more tests or polishing what's already clean." The test files at 94/100 are already clean.

Chosen over candidate #3 (split setup.ts) because setup.ts is higher risk — it's the orchestration entry point with many interdependencies. The FALLBACK_CONCEPTS extraction is a clean, zero-risk separation of data from logic that can't break anything if done correctly.

Candidate #4 (split shift-summary.ts) is lower impact. Candidate #5 requires human action on invariants.md.
