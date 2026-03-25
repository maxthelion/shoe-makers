# Candidates

## 1. Surface stale invariant finding to human via inbox-style nudge
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The two specified-only invariants (`verification.commit-or-revert` and `spec.review-and-merge-with-confidence.verification-has-already-caught-and-reverted-bad-work-whats-`) describe the old verify/revert model that was removed. Finding `invariant-update-2026-03-25.md` already documents this but hasn't been actioned. The wiki page `wiki/pages/architecture.md` and `wiki/pages/verification.md` should be updated to accurately describe the current critique-cycle model instead of the removed commit-or-revert model. This would bring the two specified-only invariant count to zero.

## 2. Add test coverage for schedule.ts working-hours logic
**Type**: test
**Impact**: medium
**Reasoning**: `src/schedule.ts` handles working-hours parsing (reading `.shoe-makers/schedule.md`, checking `isWithinWorkingHours`, computing `getShiftDate`). This is a critical path — it gates whether the entire system runs. The schedule module should have dedicated unit tests covering: missing schedule file (default: always work), various time formats, timezone handling, edge cases around midnight shift boundaries. Currently schedule logic is only indirectly tested through setup.test.ts.

## 3. Add test coverage for archive/state-archive.ts
**Type**: test
**Impact**: low
**Reasoning**: `src/archive/state-archive.ts` handles archiving consumed state files (work-item.md, candidates.md) for traceability. It's called on every setup tick but may lack dedicated unit tests covering: archiving when files exist, archiving when files don't exist, directory creation, filename collision handling. Verifying this module works correctly prevents loss of traceability data.

## 4. Improve setup.ts typecheck error reporting
**Type**: bug-fix
**Impact**: low
**Reasoning**: In `src/setup.ts:254-256`, the `logAssessment` function logs "Typecheck: FAIL" when `typecheckPass` is `null` (environment issue like missing bun-types), which is misleading. The ternary `assessment.typecheckPass ? "pass" : "FAIL"` treats `null` the same as `false`. This was already partially fixed (it now shows "skipped" in some cases), but the logic should be explicit: `null` = "skipped", `false` = "FAIL", `true` = "pass".

## 5. Graph colouring insight: skill conflict detection
**Type**: improve
**Impact**: low
**Reasoning**: Through the graph colouring creative lens: skills that modify overlapping file paths could conflict if run in adjacent ticks. The permission model (`src/verify/permissions.ts`) defines which roles can write which paths, but there's no detection of "adjacent" actions that might create merge conflicts or stepping-on-toes situations. A lightweight conflict graph (skills as vertices, shared write paths as edges) could inform the prioritiser about which candidates to avoid scheduling back-to-back. This is speculative but architecturally interesting.
