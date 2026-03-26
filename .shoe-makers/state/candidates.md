# Candidates

## 1. [Add structured-skills claim-evidence patterns — close all 11 remaining specified-only gaps]
**Type**: implement
**Impact**: high
**Reasoning**: All 11 remaining specified-only invariant gaps are structured-skills claims from `wiki/pages/structured-skills.md`. The code implementing these patterns already exists: `src/prompts/explore.ts`, `src/prompts/prioritise.ts`, `src/prompts/innovate.ts`, `src/prompts/evaluate-insight.ts`, and `src/prompts/critique.ts` all use pre-filled templates with `[YOUR CONTENT HERE]` placeholders. `src/setup.ts` gathers context and interpolates. `src/setup/housekeeping.ts` handles deterministic housekeeping. But no claim-evidence YAML exists for these claims. Creating one file with patterns matching the existing code would close all 11 gaps.

## 2. [Update wiki verification permission table — doc-sync for claim-evidence directory]
**Type**: doc-sync
**Impact**: low
**Reasoning**: Per the advisory in critique-2026-03-26-012, `wiki/pages/verification.md` line 26-27 lists `.shoe-makers/claim-evidence.yaml` (singular file) but the actual structure uses `.shoe-makers/claim-evidence/` (directory). The permission table should reference the directory.

## 3. [Improve prompts.test.ts health score — extract or simplify test file]
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` remains the worst file (87/100, 560 lines). Could be split or have redundant tests removed now that dedicated test files exist for explore, prioritise, innovate, and evaluate-insight.
