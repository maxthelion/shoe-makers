# Candidates

## 1. Add shift summary generation
**Type**: implement
**Impact**: high
**Reasoning**: Invariant 1.2 says "The branch tells a coherent story." The daily log is 4300+ lines of raw tick entries. A shift summary at end-of-shift would read the log and write a concise summary (what was built, reviewed, fixed). This directly improves the morning review experience per invariants 1.2 and 1.3. See `wiki/pages/observability.md`. Could add a `shift-summary` tree condition that fires when tick count is at max-ticks-per-shift.

## 2. Add test coverage for untested invariant
**Type**: test-coverage
**Impact**: medium
**Reasoning**: Setup reports "1 implemented features need tests" and "1 untested" invariant. The invariant system is flagging an implemented feature without test coverage. Identifying and testing this gap would improve confidence and clear the invariant warning. This is a hygiene-tier item that should be addressed before innovation work.

## 3. Update CHANGELOG for today's work
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Invariant 3.5 specifies the CHANGELOG tracks user-facing changes. Today's shift has produced two significant fixes: (1) permission violation false-positive filter for auto-commit housekeeping in `detect-violations.ts`, (2) executor test file permission relaxation. Both are user-facing changes that belong in the `[Unreleased]` section of `CHANGELOG.md`.

## 4. Deduplicate auto-commit housekeeping calls in setup.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` calls `autoCommitHousekeeping()` in two places. This dual-call pattern caused the timing bug fixed in `b386143`. Refactoring to a single, well-placed call would simplify the flow and prevent future timing bugs. Health score is 93/100.

## 5. Improve prompts.test.ts health score
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: Lowest health score in the codebase at 91/100. Likely has test duplication that could be reduced. Lower priority since this is a test file, not production code.
