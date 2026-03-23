# Candidates

## 1. Fix stale EXCLUDED_TOP_LEVEL after template file split
**Type**: fix
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Finding `exclusion-list-stale-2026-03-23.md` documents that `src/verify/invariants.ts` EXCLUDED_TOP_LEVEL set still references deleted `init-skill-templates.ts` and is missing the 3 new split files. This causes 3 false-positive "unspecified" entries in every assessment. One-line fix in `src/verify/invariants.ts` line 109. Directly improves invariant accuracy from 4 unspecified to 1.

## 2. Add src/utils/ to wiki architecture page
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The remaining 1 genuine unspecified entry is `src/utils/` (shared utility functions). Adding a brief mention to `wiki/pages/architecture.md` or creating a claim-evidence mapping would resolve it. Very low effort.

## 3. Improve test file quality scores
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: Three test files tied at 94/100 as worst files. Marginal improvement possible through test parameterization and fixture extraction. Low priority given the already-high scores.
