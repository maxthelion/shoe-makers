# Candidates

## 1. Reduce prompts.ts complexity with template consolidation
**Type**: health
**Impact**: high
**Reasoning**: `src/prompts.ts` (score 94) has a 92-line switch statement where 8 of 9 cases follow the same pattern: title + body + optional skillSection + OFF_LIMITS. Extracting remaining inline cases (fix-tests, fix-critique, review, inbox, execute-work-item, dead-code) into named functions — following the pattern already established for `buildExplorePrompt` and `buildPrioritisePrompt` — would reduce cyclomatic complexity and bring the score up. The `explore` and `prioritise` cases were already extracted in commit 9050b0f; this continues that pattern to completion.

## 2. Add creative lens feature to README
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `README.md` accurately describes most capabilities but doesn't mention the creative lens feature (Wikipedia article fetching for analogical thinking during explore phases). This is live in `src/creative/wikipedia.ts`, integrated in `src/setup.ts`, and documented in `wiki/pages/creative-exploration.md` — but invisible to users reading the README. A brief paragraph in the "How it works" section would improve discoverability. Invariant 3.5 says "The README reflects current capabilities as described by the invariants — not aspirational, not stale."

## 3. Make ACTION_TO_SKILL_TYPE type-safe with exhaustive mapping
**Type**: improve
**Impact**: medium
**Reasoning**: `src/prompts.ts` lines 12-16 defines `ACTION_TO_SKILL_TYPE` as `Partial<Record<ActionType, string>>` with only 3 entries. If a new ActionType is added to the union in `src/types.ts`, this silently skips it. Changing to `Record<ActionType, string | undefined>` with explicit entries for all 9 actions would let TypeScript catch incomplete mappings. Similarly, `allActions` in `src/__tests__/prompts.test.ts` line 45 is a hard-coded list that could go stale. Both should be derived from or validated against the ActionType union.
