# Candidates

## 1. Extract duplicated fileExists utility
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `fileExists()` is defined identically in `src/state/world.ts:114-121` and `src/init.ts`. Extract to shared utility. Simple deduplication.

## 2. Add test for explore prompt with insight count in WorldState
**Type**: test
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The `insightCount` field was added to WorldState in commit 7da4f60 but the explore prompt doesn't currently use it. A test could verify that the explore prompt mentions the insights directory regardless of count. Ensures future changes don't break the insights guidance.

## 3. Add test for findSkillForAction returning undefined for unknown actions
**Type**: test
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `src/prompts.ts:21-32` has `findSkillForAction` which returns undefined when no skill matches. The existing tests cover the positive case (skill found) and no-skill actions, but don't explicitly test the case where skills exist but none matches the given action type (e.g. passing `"inbox"` to findSkillForAction with a skill map that has implement/fix).
