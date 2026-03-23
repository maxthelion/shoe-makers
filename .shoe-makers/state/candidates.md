# Candidates

## 1. Add root-level documentation files to executor canWrite
**Type**: bug-fix
**Impact**: high
**Reasoning**: The executor role's `canWrite` patterns in `src/verify/permissions.ts` don't include root-level files like `CHANGELOG.md` and `README.md`. Doc-sync work items that update these files trigger false permission violations (documented in critique-145). Add `"CHANGELOG.md"` and `"README.md"` to the executor's `canWrite` array. Minimal change, high impact.

## 2. Add shift summary generation
**Type**: implement
**Impact**: high
**Reasoning**: Invariant 1.2 says "The branch tells a coherent story." The daily log exceeds 4300 lines. A shift summary at end-of-shift would make the morning review experience match invariant 1.3. See `wiki/pages/observability.md`.

## 3. Add test for untested invariant
**Type**: test-coverage
**Impact**: medium
**Reasoning**: Setup reports "1 implemented features need tests" and "1 untested" invariant. Need to identify which invariant is untested and add coverage.

## 4. Deduplicate auto-commit housekeeping calls in setup.ts
**Type**: health
**Impact**: medium
**Reasoning**: Dual `autoCommitHousekeeping()` calls in `src/setup.ts` caused a timing bug and continue to create confusion. Health score 93/100.

## 5. Improve prompts.test.ts health score
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: Lowest health score in codebase at 91/100.
