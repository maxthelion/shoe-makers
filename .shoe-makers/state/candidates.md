# Candidates

## 1. Include available skill types in explore prompt
**Type**: improve
**Impact**: medium
**Reasoning**: Explore and prioritise agents don't know what skill types are available when writing candidates. The `src/skills/registry.ts` loads 9 skills with `mapsTo` values (fix, implement, test, doc-sync, health, octoclean-fix, bug-fix, dead-code, dependency-update). Adding a compact skill list to the explore prompt would help agents propose work that maps cleanly to existing skills. This means the executor gets more targeted instructions. Small change, high leverage. Files: `src/prompts.ts` (explore case), `src/skills/registry.ts`.

## 2. Add claim-evidence for shift summary feature
**Type**: implement
**Impact**: medium
**Reasoning**: The new `formatShiftSummary` function and its integration into `src/shift.ts` may need evidence if the wiki references shift summaries. The wiki (`wiki/pages/observability.md`) says "the shift runner produces a ShiftSummary that categorises actions into improvement types." Check that the invariants checker has evidence for shift summary related claims. Files: `.shoe-makers/claim-evidence.yaml`.

## 3. Add claim-evidence for enriched prompt context
**Type**: implement
**Impact**: low
**Reasoning**: The new `formatTopGaps` and `formatCodebaseSnapshot` functions add assessment details to prompts. These implement spec claims about richer context but may need claim-evidence entries. Since invariants currently show 0 gaps, this may already be covered. Files: `.shoe-makers/claim-evidence.yaml`, `src/prompts.ts`.
