# Candidates

## 1. [Implement structured evaluate-insight skill — pre-filled evaluation output template]
**Type**: implement
**Impact**: high
**Reasoning**: Per `wiki/pages/structured-skills.md` lines 89-92, the `evaluate-insight` skill should enforce required sections (evaluation, build-on-it, decision) with specific decision options (promote/rework/dismiss) and output format for each option. Currently `src/prompts/evaluate-insight.ts` describes the options in prose but doesn't use pre-filled template placeholders. This is the last of the three-phase skills to structure. Directly closes structured-skills invariant gaps. Following the pattern from structured explore, prioritise, and innovate.

## 2. [Add commit-or-revert verification evidence — close top specified-only gap]
**Type**: implement
**Impact**: medium
**Reasoning**: The top invariant gap is `verification.commit-or-revert` from the architecture group. `.shoe-makers/claim-evidence/06-verification.yaml` defines evidence patterns but they can't be matched. The setup/scheduler code likely has commit/revert logic that needs test coverage or explicit evidence patterns. Closing this persistent gap reduces specified-only count.

## 3. [Improve prompts.test.ts health score — extract or simplify test file]
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` has a health score of 87/100, the worst file in the codebase. It's a large integration test file covering all prompt types. Some of its tests overlap with the newer dedicated test files (`explore-prompt.test.ts`, `prioritise-prompt.test.ts`, `innovate-prompt.test.ts`). Extracting or removing overlapping tests would improve the health score.
