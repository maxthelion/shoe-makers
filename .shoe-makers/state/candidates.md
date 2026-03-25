# Candidates

## 1. Update README.md to reflect current capabilities
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README is likely stale — the system now includes 221+ tested invariants, 9 skill types, creative exploration with local fallback corpus, process pattern detection (reactive ratio, review loops, innovation cycles), review-loop circuit breaker, orchestration skip for review churn reduction, shift summaries with dashboard, and working hours enforcement. Documentation helps the morning reviewer and future contributors.

## 2. Add wiki page for the orchestration skip feature
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The new orchestration skip behaviour (commits touching only `.shoe-makers/findings/`, `.shoe-makers/insights/`, `.shoe-makers/log/`, `.shoe-makers/archive/` don't trigger review) is a significant architectural change not yet documented in the wiki. The verification wiki page (`wiki/pages/verification.md`) describes the review cycle but doesn't mention the skip. The architecture page may also need updating.

## 3. Improve shift log dashboard with summary of this shift's contributions
**Type**: health
**Impact**: low
**Reasoning**: The shift log for today has many entries but no summary of what was accomplished. A shift summary at the top would help the morning reviewer quickly understand: 3 features implemented (orchestration skip, creative fallback, circuit breaker), 1 test fix, all 653 tests passing.
