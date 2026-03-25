# Candidates

## 1. Add boundary tests for getShiftDate at midnight boundaries
**Type**: test
**Impact**: low
**Reasoning**: `getShiftDate` in `src/schedule.ts` is already tested for 23:30 and 03:00, but edge cases at exactly 00:00 (midnight) and 05:59 (just before end) are not covered. At 00:00 with start:22/end:6, it should return yesterday. At 05:59 it should still return yesterday. At 06:00 it should return today. These are low-risk since the logic is simple, but they document the expected behaviour precisely.

## 2. Add test for logAssessment typecheck=false and typecheck=null cases
**Type**: test
**Impact**: low
**Reasoning**: The `logAssessment` function in `src/setup.ts` now has three-way typecheck display (pass/FAIL/skipped) but only `true` and `undefined` are tested in `setup.test.ts`. Adding tests for `false` → "FAIL" and `null` → "skipped" would complete the coverage for the fix we just made.

## 3. Create a PR for the shoemakers/2026-03-25 branch
**Type**: doc-sync
**Impact**: high
**Reasoning**: The branch has significant improvements: doc-sync for 3 tree diagrams, dead code removal (verify.ts, blackboard exports), 25 new tests for tier determination, typecheck logging fix, finding about stale invariants. Creating a PR makes the work visible for human review and merge.
