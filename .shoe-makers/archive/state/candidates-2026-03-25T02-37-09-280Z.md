# Candidates

## 1. Add test coverage for schedule.ts midnight-wrap edge cases
**Type**: test
**Impact**: medium
**Reasoning**: `getShiftDate()` in `src/schedule.ts` handles midnight-wrap (start: 22, end: 6) — at 2am it should use yesterday's date for branch naming. Edge cases around midnight boundaries (23:59→00:01) affect branch naming correctness. A bug here would create wrong branch names, breaking the entire shift. The schedule.test.ts file exists but should be verified for midnight-wrap coverage.

## 2. Investigate and fix typecheck environment issue
**Type**: health
**Impact**: medium
**Reasoning**: `npx tsc --noEmit` fails with "Cannot find type definition file for 'bun-types'" because the npm registry is blocked and `@types/bun` can't be installed. While `runTypecheck()` in `src/skills/assess.ts` correctly returns `null` for this case (not false), the setup log shows "Typecheck: FAIL" which is misleading. The `logAssessment` function could distinguish between "null" (can't run) and "false" (real type errors) in its output.

## 3. Improve logAssessment to show "skipped" for null typecheck
**Type**: health
**Impact**: low
**Reasoning**: `src/setup.ts:logAssessment()` (line 252-275) logs `typecheckPass` as "FAIL" when the value is `false`, but doesn't show anything special for `null` (can't run). It could show "Typecheck: skipped (missing type definitions)" when null, making the log output more informative and less alarming.
