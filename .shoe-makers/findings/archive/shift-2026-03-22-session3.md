# Finding: Session 2026-03-22 (session 3) — Review cycle and test coverage

## What happened

This session performed adversarial review, resolved critique formatting issues, and improved test coverage across multiple files.

## Actions taken

1. **Adversarial review** — Reviewed commits b4cef31..c004b8e (review cycle bug fixes, dedup, and test coverage). Approved with no blocking issues, two advisory notes (dynamic import inconsistency, shell injection surface).

2. **Fixed critique resolution format** — Critique-005 used "Approved" instead of "Resolved" in its `## Status` section, causing `countUnresolvedCritiques` to count it as unresolved. Fixed to match the expected format.

3. **Test coverage improvements**:
   - `schedule.ts`: 76.47% → 100% — Added tests for `isWithinWorkingHours` with overnight/daytime schedules, and `getShiftDate` with midnight wrapping
   - `evaluate.ts`: 83.33% → 97.22% — Added edge case tests (empty selector, condition-only sequence, missing condition, action without skill)
   - `work.ts`: 83.87% → 100% — Added test for work skill with matching skill definition
   - `prompts.ts`: Lines 33-34 covered — Added test for skill lookup miss

4. **TypeScript type fixes**:
   - Added missing `name` property to TreeNode test objects in evaluate.test.ts
   - Added missing `worstFiles` property to Assessment objects in work.test.ts and prioritise.test.ts
   - `tsc --noEmit` now passes cleanly

## Metrics

- Tests: 262 → 273 (+11)
- Overall line coverage: 96.27% → 98.87%
- TypeScript errors: 6 → 0
- Unresolved critiques: 1 → 0

5. **Enforce enabledSkills config** — `loadSkills()` now accepts an `enabledSkills` filter parameter. When `config.yaml` specifies `enabled-skills`, only those skills are loaded. `setup.ts` and `index.ts` pass the config value through.

6. **Deduplicate hasUncommittedChanges** — Exported from `world.ts` and removed duplicate from `setup.ts`, matching the earlier dedup pattern for `checkUnreviewedCommits` and `countUnresolvedCritiques`.

7. **Remove _cachedEvidence mutable** — `extractClaims()` in `invariants.ts` used a module-level mutable `_cachedEvidence` as a hidden side-channel. Removed it and made `claimEvidence` a proper parameter (defaulting to empty object). Tests updated to load evidence explicitly.

8. **Add typecheck script** — `bun run typecheck` runs `tsc --noEmit` for type safety verification.

## Metrics (updated)

- Tests: 262 → 275 (+13)
- Overall line coverage: 96.27% → 98.87%
- TypeScript errors: 6 → 0
- Unresolved critiques: 1 → 0
- Config fields enforced: enabledSkills now works

## Status

Complete.
