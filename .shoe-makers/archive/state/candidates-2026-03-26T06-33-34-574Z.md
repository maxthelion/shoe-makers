# Candidates

## 1. Add tests for git push failure path in shift.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/shift.ts` lines 42-49 have a try-catch around git push that silently warns on failure. No tests cover this path — `src/__tests__/shift.test.ts` doesn't verify that a shift completes successfully when push fails, or that the warning is logged. This is a real-world scenario (network issues, no remote configured) that should be tested to validate shift robustness.

## 2. Split shift-summary.ts into focused modules
**Type**: health
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` is the largest file at 286 lines. It mixes orchestration (`summarizeShift`), narrative building (`buildDescription`), and analysis functions (`analyzeTraces`, `analyzeProcessPatterns`). Extracting analysis functions into `src/log/shift-analysis.ts` would improve cohesion and follow the precedent of previous test file splits that improved health scores. No behavioural changes needed.

## 3. Document continue-work action in behaviour-tree wiki page
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/behaviour-tree.md` lists `partial work` in the reactive zone (line 25) but doesn't explain the action's behaviour in detail — unlike `critique` and other actions which have explanatory text. The `continue-work` action reads `partial-work.md`, resumes previous work, and has executor-level permissions. A short section explaining when it fires, what it reads, and what the elf does would match the documentation pattern for other actions. Related to open finding `unspecified-partial-work.md`.

## 4. Add edge case tests for init bootstrapWiki
**Type**: test
**Impact**: low
**Reasoning**: `src/__tests__/init.test.ts` covers the happy path but misses edge cases: `bootstrapWiki` when wiki/pages already exists with pre-existing pages, README.md with malformed H1 heading, and `readdir` failure on docs/. `src/run-init.ts` (the CLI entry point) has no dedicated tests — its error path at lines 46-48 is never exercised. Adding these would harden the init system.

## 5. Standardise null-safety patterns in tree condition functions
**Type**: health
**Impact**: low
**Reasoning**: `src/tree/default-tree.ts` uses inconsistent null-safety: `testsFailing` (line 26) checks `if (!assessment) return false` then accesses properties directly, while `inReviewLoop` (line 32) uses optional chaining `?.` throughout. Both work correctly but the inconsistency could confuse future contributors. Standardising to one pattern (prefer optional chaining) improves readability.
