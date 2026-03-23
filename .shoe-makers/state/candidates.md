# Candidates

## 1. Add claim-evidence for 14 hierarchy-of-needs invariants
**Type**: implement
**Impact**: high
**Reasoning**: The wiki specifies the 3-tier hierarchy (hygiene → implementation → innovation) and the prompts in `src/prompts.ts` implement it (lines 151-271). But `.shoe-makers/claim-evidence.yaml` has no entries for these claims, so the invariant checker reports them as "specified-only." Adding evidence patterns would close all 14 gaps and make the assessment accurate. These are real features that exist but aren't verified. See `src/prompts.ts` lines 157-159 (tier guidance in prioritise), lines 213-232 (tier sections in explore), and the insight evaluation instructions at lines 173-178.

## 2. Add tests for hierarchy-of-needs prompt logic
**Type**: test
**Impact**: medium
**Reasoning**: The tier-switching logic in `generatePrompt()` for `explore` and `prioritise` actions (lines 151-271 of `src/prompts.ts`) changes behavior based on invariant counts. The existing test file `src/__tests__/prompts.test.ts` should verify: (1) explore shows "Innovation" tier when specifiedOnly=0, (2) explore shows "Hygiene/Implementation" tier when specifiedOnly>0, (3) prioritise changes guidance based on gaps, (4) "No impactful work remaining" text appears in innovation tier. These are critical behavioral boundaries.

## 3. CHANGELOG drift — skills count and missing entries
**Type**: doc-sync
**Impact**: low
**Reasoning**: CHANGELOG.md was updated to reflect 9 skills (from 5) but doesn't mention other recent additions like the hierarchy-of-needs prompt tiers, insight evaluation in prioritise, or the creative exploration prompt improvements. File: `CHANGELOG.md`.
