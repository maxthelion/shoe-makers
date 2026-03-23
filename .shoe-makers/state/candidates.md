# Candidates

## 1. Fix permission violation false positives from auto-commit housekeeping
**Type**: bug-fix
**Impact**: high
**Reasoning**: The permission violation detection in `src/verify/detect-violations.ts` uses `git diff --name-only ${lastReviewed}..HEAD` which includes files changed by auto-commit housekeeping (shift log, archives). This causes recurring false-positive permission violations (documented in critiques 128, 129, 130). Every review cycle wastes a tick resolving these. Fix: filter out commits with message matching "Auto-commit setup housekeeping" from the diff, or compare only elf-authored commits. This is the highest-impact candidate because it eliminates a systematic waste of elf ticks.

## 2. Add shift summary generation at end of shift
**Type**: implement
**Impact**: high
**Reasoning**: Invariant 1.2 says "The branch tells a coherent story: a human reads the shift log and understands what happened." The daily log is 4300+ lines of raw tick entries — not a coherent story. A shift summary skill that runs at max-ticks or end-of-shift could read the log, extract key outcomes (what was built, what was reviewed, what failed), and write a concise summary to the top of the log or a separate `shift-summary.md`. This directly improves the morning review experience per invariant 1.3. See `wiki/pages/observability.md`.

## 3. Improve prompts.test.ts health score
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` has the lowest health score (91/100) in the codebase. As the worst-scoring file, it's the natural target for the health improvement skill. Likely has duplication across test cases that could be reduced with shared helpers or parameterized tests. Improving this file raises the floor and demonstrates the system's ability to self-improve its own test quality.

## 4. Add CHANGELOG entry for current shift's work
**Type**: doc-sync
**Impact**: low
**Reasoning**: Invariant 3.5 specifies "The CHANGELOG tracks user-facing changes in Keep a Changelog format." The last entry is from 2026-03-22. Multiple improvements have been made since (permission violation detection, archive timing fix, config validation). The doc-sync skill should append today's changes to the `[Unreleased]` section. This is low-impact but keeps documentation current.

## 5. Deduplicate auto-commit housekeeping pattern
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` calls `autoCommitHousekeeping()` in two places — once after archiving resolved findings and once at the end of main(). This dual-call pattern was the root cause of the timing fix in commit `b386143` and continues to cause confusion in permission detection. Refactoring to a single, well-placed call (or making the function idempotent with a clear contract) would prevent future timing-related bugs and simplify the setup flow. See `src/setup.ts` lines ~100-200.
