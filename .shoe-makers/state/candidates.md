# Candidates

## 1. Update pure-function-agents.md scheduler section
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/pure-function-agents.md` lines 43-49 describe the scheduler's job with stale references: "If tests fail, revert the commit" (line 48) and "If tests pass and the verification gate passes, create a PR or merge" (line 47). The system no longer reverts commits — it uses adversarial review. Updating this section aligns the wiki with the current architecture and addresses the stale `verification.commit-or-revert` invariant. This is the last wiki page with references to the old verification model.

## 2. Add permission enforcement tests for continue-work action
**Type**: test
**Impact**: low
**Reasoning**: The permissions.test.ts should verify that `continue-work` has executor-level permissions (can write src/, wiki/, state/) and cannot write invariants. This ensures the permission configuration doesn't regress. Following the pattern of existing permission tests in `src/__tests__/permissions.test.ts`.

## 3. Push shoemakers branch to remote
**Type**: improve
**Impact**: medium
**Reasoning**: The branch has accumulated significant work this shift: ContinueAgent implementation, 3 wiki updates, archive fix, 12 new tests. Pushing ensures the work is preserved on the remote and available for human review. Per `wiki/pages/branching-strategy.md`, the branch should be pushed so the human can review and merge in the morning.
