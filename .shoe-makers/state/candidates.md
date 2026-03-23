# Candidates

The codebase is at peak health: 100/100, 0 specified-only, 0 untested, 0 unspecified invariants, 496 tests passing. All findings resolved. Work available is low-priority quality improvement.

## 1. Stale skill list in invariants.md section 3.2
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: Section 3.2 of `.shoe-makers/invariants.md` says "Current skills: fix-tests, implement, test-coverage, doc-sync, health" and "Planned: octoclean-fix, bug-fix, dependency-update, dead-code removal". All 9 skills are now implemented — the "Planned" line is stale. However, invariants.md is human-only. This is a finding for the human, not a work item for an elf.

## 2. Archive resolved findings to reduce clutter
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: There are 179 findings, the vast majority resolved. An archive pass could move resolved critiques older than 48h into a `.shoe-makers/findings/archive/` subdirectory, keeping the active directory scannable. However, the protocol says findings should preserve the review trail, and the file count doesn't affect runtime performance.

## 3. No-op — codebase is fully green
**Type**: health
**Impact**: none
**Confidence**: high
**Risk**: none
**Reasoning**: All metrics are at their best: health 100, invariants clean, tests green, typecheck clean. The most productive use of remaining time is to push the branch and let humans review.
