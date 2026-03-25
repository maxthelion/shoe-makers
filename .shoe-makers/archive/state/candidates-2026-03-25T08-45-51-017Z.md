# Candidates

## 1. Add test for config loader edge cases with enabledSkills
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/config/load-config.ts` parses `enabled-skills` as a comma-separated list with `.split(",").map(s => s.trim()).filter(Boolean)`. The existing config tests (`src/__tests__/config.test.ts`) test basic parsing but don't verify edge cases for enabled-skills: empty strings between commas, trailing commas, whitespace-only entries. These would silently produce incorrect skill filtering. Adding 2-3 targeted tests would harden this parsing.

## 2. Add test coverage for schedule.ts edge cases
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/schedule.ts` handles working hours and shift dates including midnight-wrap logic (shifts that cross midnight). While `src/__tests__/schedule.test.ts` exists, the `getShiftDate` function's midnight-wrap logic is critical — if it miscalculates, the elf works on the wrong branch. A test verifying `getShiftDate` returns yesterday's date when called at 1am with a shift ending at 6am would catch regressions in this edge case.

## 3. Verify CHANGELOG.md reflects recent session's work
**Type**: doc-sync
**Impact**: low
**Reasoning**: The CHANGELOG.md tracks user-facing changes per invariant 3.5. The current session added drift-prevention tests, fixed missing `continue-work` in allActions, and synced verification.md. These are internal improvements, not user-facing features, so they may not warrant CHANGELOG entries. But the invariant says "user-facing changes" — the test improvements do affect the quality of the test suite. Low-priority check.
