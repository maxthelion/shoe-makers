# Candidates

## 1. Improve shift summary for morning review
**Type**: health
**Impact**: high
**Reasoning**: The spec (wiki/pages/observability.md) asks "what would make the morning review delightful?" Currently the shift log is a long append-only list of tick entries. The `ShiftSummary` type exists in `src/log/shift-summary.ts` but isn't surfaced prominently. A top-of-log executive summary showing key accomplishments, findings resolved, tier determination, and blocked work would transform the human review experience. Files: `src/log/shift-log.ts`, `src/log/shift-summary.ts`, `src/scheduler/shift.ts`.

## 2. Fix worst-file health: prompts.test.ts (93/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is the lowest health file at 93/100. It has 366 lines with repetitive test structure that could be further consolidated. The tier-switching tests were partially data-driven in a recent refactor but there are still standalone tests with similar patterns. Extracting more shared helpers and consolidating similar assertions would improve health. Files: `src/__tests__/prompts.test.ts`.

## 3. Fix worst-file health: invariants.test.ts (94/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/invariants.test.ts` is the second-lowest health file at 94/100. Improving structure, reducing duplication, and extracting helpers would bring it closer to 100. Files: `src/__tests__/invariants.test.ts`.
