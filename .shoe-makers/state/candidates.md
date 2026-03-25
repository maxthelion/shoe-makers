# Candidates

## 1. Update behaviour-tree.md to document partial-work node
**Type**: doc-sync
**Impact**: high
**Reasoning**: `wiki/pages/behaviour-tree.md` lines 19-33 show the tree diagram without the `partial-work` node that was just implemented in `src/tree/default-tree.ts`. The wiki says 12 nodes but the code now has 13. The reactive zone description (lines 35-44) should also mention partial work resumption. This is a spec-code inconsistency — the code is ahead of the wiki, and the wiki is supposed to be the source of truth. Per the critique in `critique-2026-03-25-222.md` (advisory): "No update to wiki/pages/behaviour-tree.md to document the new tree node. This could be a follow-up doc-sync candidate."

## 2. Update pure-function-agents.md scheduler section
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/pure-function-agents.md` lines 41-51 describe the scheduler's job including "If tests fail, revert the commit" and "If tests pass and the verification gate passes, create a PR or merge." This describes the old verification model. The scheduler now commits directly and relies on the adversarial critique cycle. Lines 47-48 should be updated. This aligns with the stale invariant finding `invariant-update-2026-03-25.md`.

## 3. Add partial-work.md to archive/state-archive.ts consumed files list
**Type**: bug-fix
**Impact**: medium
**Reasoning**: `src/archive/state-archive.ts` archives consumed state files for traceability. When an elf finishes partial work and deletes `partial-work.md`, it should be archived first. Currently `archiveConsumedStateFiles` only archives `work-item.md` and `candidates.md`. The new `partial-work.md` should be added to the consumed files list for the `continue-work` action. Without this, the partial work description is lost after completion, breaking traceability.

## 4. Add tests for permission enforcement of continue-work action
**Type**: test
**Impact**: low
**Reasoning**: `src/verify/permissions.ts` now has a `continue-work` entry with executor-level permissions, but `src/__tests__/permissions.test.ts` likely doesn't have test cases for the new action type. Adding tests ensures the permission model for continue-work is verified and won't regress.
