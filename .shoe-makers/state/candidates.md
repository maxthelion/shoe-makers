# Candidates

## 1. Add shift summary generation at end of shift
**Type**: implement
**Impact**: high
**Reasoning**: Invariant 1.2 says "The branch tells a coherent story." The daily log exceeds 4300 lines. A shift summary would read the log and git log, then write a concise summary (what was built, what was reviewed, what's left). Could be a new tree condition `end-of-shift` that fires when tick count >= max-ticks, or a new skill invoked by the shift runner. This directly improves the human morning review experience per invariants 1.2 and 1.3.

## 2. Investigate and fix untested invariant
**Type**: test-coverage
**Impact**: medium
**Reasoning**: Setup reports "1 untested" invariant and "1 implemented features need tests." Need to identify which invariant claim is implemented but untested. Check the invariants checker output to find which specific claim is flagged, then add test coverage for it.

## 3. Deduplicate auto-commit housekeeping calls in setup.ts
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` (health 93/100) calls `autoCommitHousekeeping()` in two places. This dual-call pattern caused the timing bug in commit `b386143`. Consolidating to one call or making the contract clearer would improve maintainability.

## 4. Skip housekeeping-only review cycles in the tree
**Type**: implement
**Impact**: high
**Reasoning**: The `unreviewed-commits` tree condition fires whenever HEAD is ahead of `last-reviewed-commit`, even when all commits are housekeeping. This wastes review ticks on empty reviews. The condition could filter housekeeping commits using `getElfChangedFiles()` (already exported) — if no elf-authored files changed, skip the review. This would significantly reduce wasted ticks.

## 5. Improve prompts.test.ts health score
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: Lowest health score in codebase at 91/100.
