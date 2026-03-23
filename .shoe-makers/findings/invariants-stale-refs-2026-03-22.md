---
type: finding
date: 2026-03-22
---

# Finding: invariants.md references stale three-phase model

## Summary

`.shoe-makers/invariants.md` section 2.3 (lines 86-88) references `candidates.md` and `work-item.md` — state files from the three-phase orchestration model. These files don't exist in the codebase and have never been implemented. The code uses a flat condition-action selector instead.

## Details

Lines 86-88 of invariants.md:
- "Explore: ... write `candidates.md` with a ranked list"
- "Prioritise: ... write a detailed `work-item.md`"
- "Execute: read `work-item.md`, do the work"

The wiki pages have been updated to reflect the actual flat model, but invariants.md is off-limits to elves.

## Recommendation

Human should update section 2.3 of `.shoe-makers/invariants.md` to match the actual flat selector model, or mark this section as aspirational if the three-phase model is still desired for the future.

## Status

Resolved. The three-phase orchestration model (candidates.md → work-item.md → execute) has been implemented since this finding was written. The invariants.md references are now accurate.
