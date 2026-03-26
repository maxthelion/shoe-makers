# Candidates

## 1. Reduce prompts.test.ts duplication (octoclean score 87)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` (755 lines) is the worst-scoring file in the codebase at 87. It has 4 near-identical factory functions (`makeStateWithProcessPatterns` line 252, `makeStateWithGaps` line 297, `makeAssessmentWithInvariants` line 547, `makeAssessmentWithUntested` line 729) that each spread `freshAssessment` with minor overrides. A parameterized `makeStateVariant(assessmentOverrides)` helper would eliminate ~60 lines of duplication. Also, `implementSkill`/`fixTestsSkill` are defined twice (lines 163-175 and 621-624). This is the single biggest drag on the 99/100 health score.

## 2. Reduce setup.ts complexity (octoclean score 91)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/setup.ts` is 408 lines. The `main()` function handles branch setup, assessment, config, tree eval, Wikipedia fetch, permission detection, state archiving, prompt generation, and logging. Four responsibilities could be extracted: article fetching (lines 89-106), permission violation handling (lines 108-118), wiki summary loading (lines 101-105), and state file archiving (lines 120-126). Would improve readability without changing behaviour.

## 3. Surface stale invariants for human update
**Type**: doc-sync
**Impact**: high
**Reasoning**: The 2 specified-only invariants ("commit or revert" in architecture, "Verification has already caught and reverted bad work" in what-a-user-can-do section 1.3) reference the old verify/commit/revert model that was removed. The system now uses cross-elf adversarial review. The `claim-evidence.yaml` entry `verification.commit-or-revert` looks for `"commit"` and `"revert"` strings that no longer exist in source. A previous finding was archived — need to re-surface for human action since `.shoe-makers/invariants.md` is human-only.

## 4. Sync wiki TDD claims with actual enforcement
**Type**: doc-sync
**Impact**: low
**Reasoning**: Invariants section 1.6 states "The elf writing tests cannot write implementation in the same tick" and "This is enforced by the permission model." But `wiki/pages/verification.md` line 48 says this is "supported but not strictly enforced." The tension between spec claim and wiki description should be documented. Either the invariant overstates enforcement, or the wiki page understates it. A finding should surface this for human review.
