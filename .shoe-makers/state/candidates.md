# Candidates

## 1. Fix worst-file health: invariants.test.ts (94/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/invariants.test.ts` is the lowest health file at 94/100 (339 lines). Many tests follow similar patterns with `writeWikiPage`/`writeSourceFile`/`writeTestFile` setup. Extracting fixture factories and consolidating repetitive test structures would improve health. Files: `src/__tests__/invariants.test.ts`.

## 2. Fix worst-file health: shift-log.test.ts (94/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/shift-log.test.ts` is tied for lowest at 94/100 (333 lines). The `formatTickLog` and `formatShiftSummary` tests have repetitive structure suitable for data-driven consolidation. Files: `src/__tests__/shift-log.test.ts`.

## 3. Archive remaining resolved finding
**Type**: health
**Impact**: low
**Reasoning**: critique-2026-03-23-087.md is resolved but still in active findings. Quick `git mv` to archive. This keeps the findings count clean.
