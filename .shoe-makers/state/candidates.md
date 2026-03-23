# Candidates

## 1. Update claim-evidence.yaml to match refactored prompts.ts variable names
**Type**: fix
**Impact**: high
**Reasoning**: The prompts.ts refactor (commit 9050b0f) renamed variables: `pTierGuidance` → `tierGuidance`, `eHasGaps`/`pHasGaps` → `tier.hasGaps`. But `.shoe-makers/claim-evidence.yaml` still references the old names at lines 1723, 1764-1765, 1790. This causes 3 invariants to show as "specified-only" when they're actually implemented. Fixing the evidence patterns restores accurate invariant tracking. Affects: `.shoe-makers/claim-evidence.yaml` lines 1721-1793.

## 2. Reduce prompts.ts complexity (health score 94)
**Type**: health
**Impact**: medium
**Reasoning**: `src/prompts.ts` is the worst-scoring file at 94/100 per octoclean. The recent refactor extracted `buildExplorePrompt` and `buildPrioritisePrompt` but the main `generatePrompt` function still has a large switch statement with remaining inline cases (execute, dead-code, fix-critique, review, inbox). Further extraction could improve the score. Affects: `src/prompts.ts`.

## 3. Reduce prompts.test.ts complexity (health score 95)
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/prompts.test.ts` scores 95/100. At 312 lines it could benefit from shared fixtures or data-driven patterns similar to the shift-log.test.ts refactor (commit fca6d97). Affects: `src/__tests__/prompts.test.ts`.
