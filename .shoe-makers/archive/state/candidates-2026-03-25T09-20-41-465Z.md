# Candidates

## 1. Fix missing `continue-work` case in run-skill.ts
**Type**: bug-fix
**Impact**: high
**Reasoning**: `src/scheduler/run-skill.ts` has a switch statement handling all action types (lines 15-53) but is missing a `case "continue-work"`. When the shift runner calls `runSkill(repoRoot, "continue-work")`, it falls through to `default` and returns `"Unknown action: continue-work"`. This is the same class of bug as the `SKILL_TO_ACTION` issue fixed in the previous cycle. The fix is to add a case returning a descriptive message, and a test in `run-skill.test.ts`. A drift-prevention test should also be added to ensure all action types from the tree have corresponding cases.

## 2. Add drift-prevention test for run-skill.ts switch completeness
**Type**: test-coverage
**Impact**: high
**Reasoning**: `src/__tests__/run-skill.test.ts` tests 10 of 12 action types (missing `continue-work`). A drift test that verifies every tree skill gets a non-"Unknown" response from `runSkill` would prevent this class of omission. This should be combined with candidate #1.

## 3. Deduplicate `extractSkills` test utility
**Type**: health
**Impact**: low
**Reasoning**: The `extractSkills(node: TreeNode): Set<string>` helper function is now duplicated in three test files: `action-classification.test.ts`, `permissions.test.ts`, and `tick.test.ts`. It could be extracted to `src/__tests__/test-utils.ts` where the existing `makeState` and `emptyBlackboard` helpers live. Low priority but reduces maintenance burden when the tree structure changes.
