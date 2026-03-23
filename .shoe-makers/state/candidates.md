# Candidates

## 1. Add bug-fix role to permission model
**Type**: bug-fix
**Impact**: high
**Reasoning**: The executor role (`src/verify/permissions.ts:52-56`) forbids `src/__tests__/` writes, but bug-fix work items need tests alongside the fix (per critique-134). This causes a false permission violation every time a bug-fix executor writes tests. Add a `bug-fix` entry to `ROLE_MAP` that allows both `src/` and `src/__tests__/` writes. Also requires adding `"bug-fix"` to the `ActionType` union in `src/types.ts` and wiring it through `parseActionTypeFromPrompt` in `src/prompts/helpers.ts`. This directly eliminates the recurring false positive documented in critique-134.

## 2. Add shift summary generation at end of shift
**Type**: implement
**Impact**: high
**Reasoning**: Invariant 1.2 says "The branch tells a coherent story." The daily log is 4300+ lines of raw tick entries. A shift summary skill that reads the log and writes a concise `shift-summary.md` (what was built, what was reviewed, what failed) would make the morning review delightful per invariant 1.3. Could be triggered when tick count approaches max-ticks-per-shift. See `wiki/pages/observability.md` and `src/setup.ts` tick counting.

## 3. Improve prompts.test.ts health score
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` has the lowest health score (91/100). As the worst-scoring file in the codebase, improving it raises the floor. The file likely has duplication across test cases that could be reduced with shared helpers or data-driven patterns.

## 4. Update CHANGELOG for recent work
**Type**: doc-sync
**Impact**: low
**Reasoning**: Invariant 3.5 specifies the CHANGELOG tracks user-facing changes. Last entry is 2026-03-22. Recent additions include: permission violation detection, archive timing fix, config validation, `getElfChangedFiles` housekeeping filter. These should be added to the `[Unreleased]` section of `CHANGELOG.md`.

## 5. Deduplicate auto-commit housekeeping calls in setup.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` calls `autoCommitHousekeeping()` in two places. This dual-call pattern caused the timing bug fixed in `b386143`. Refactoring to a single call or making the function clearly idempotent with documented contract would prevent future timing bugs and simplify the setup flow. File health score is 93/100 — this would improve it.
