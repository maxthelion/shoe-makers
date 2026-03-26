# Candidates

## 1. Add integration tests for buildWorldState()
**Type**: test
**Impact**: high
**Reasoning**: `src/setup/world-state.ts` has zero test coverage. The `buildWorldState()` function orchestrates 8 parallel I/O operations that assemble the `WorldState` used by the behaviour tree. Individual utilities are tested but the integration — field mapping, Promise.all composition, default values — is not. A bug here silently breaks all tree routing. This is the most impactful untested code path remaining.

## 2. Fix stale invariants skills list (finding)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/findings/stale-invariants-skills-list.md` reports that section 3.2 of invariants lists skills as "current" vs "planned" but all 9 are now implemented. However, invariants.md is off-limits to elves — this should be flagged as a finding for human review. The finding already exists, so no new work needed unless we want to write a more specific recommendation.

## 3. Improve code health of worst-scoring test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/assess.test.ts` (94), `src/__tests__/prompt-helpers.test.ts` (94), and `src/__tests__/invariants.test.ts` (95) are the three worst-scoring files. Reducing complexity or splitting large test blocks could push the health score to 100/100. These are test files so changes are low risk.
