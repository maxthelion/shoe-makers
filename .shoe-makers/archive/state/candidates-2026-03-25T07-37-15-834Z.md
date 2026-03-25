# Candidates

## 1. Add partial-work.md to archive consumed files list
**Type**: bug-fix
**Impact**: high
**Reasoning**: `src/archive/state-archive.ts:8-12` defines `CONSUMABLE_FILES` but doesn't include `continue-work` action. When a `continue-work` action is selected, `archiveConsumedStateFiles` is called by `setup.ts:116-121` but returns empty because `"continue-work"` isn't in the map. The `partial-work.md` file is consumed by the elf but never archived for traceability. Fix: add `"continue-work": ["partial-work.md"]` to the `CONSUMABLE_FILES` record. Also needs a test in `src/__tests__/state-archive.test.ts`.

## 2. Update pure-function-agents.md scheduler section to remove stale revert references
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/pure-function-agents.md` lines 43-49 describe the scheduler's job including "If tests fail, revert the commit" (line 48). This describes the old verification model. The system now commits directly and relies on adversarial review. Updating this aligns the wiki with the finding in `invariant-update-2026-03-25.md` and may help resolve the stale `verification.commit-or-revert` invariant claim.

## 3. Add permission enforcement tests for continue-work action
**Type**: test
**Impact**: low
**Reasoning**: `src/verify/permissions.ts` now has a `continue-work` entry with executor-level permissions. `src/__tests__/permissions.test.ts` should be checked for coverage. Adding explicit tests for `isFileAllowed("continue-work", ...)` ensures the broad executor permissions are correctly configured and won't regress.
