# Candidates

## 1. Fix branchPrefix config having no effect on actual branch names
**Type**: bug-fix
**Impact**: medium
**Reasoning**: `src/setup/branch.ts:6` hardcodes `shoemakers/${shiftDate}` without reading the `branchPrefix` config value from `config.yaml`. The config key is loaded in `src/config/load-config.ts` and documented in invariants section 5.2, but never actually passed to or used by `ensureBranch()`. This means changing `branch-prefix` in config has zero effect — a clear spec-code inconsistency. Fix: pass `branchPrefix` from config into `ensureBranch()` and use it in the template string.

## 2. Improve world.test.ts health score (worst file at 89)
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` (453 lines, score 89) is the worst-scoring file. It contains many test groups (`readWorldState`, `getCurrentBranch`, `checkUnreviewedCommits`, `readWorkItemSkillType`, `checkHasWorkItem`, `checkHasCandidates`, `checkHasPartialWork`, `countInsights`, `hasUncommittedChanges`, `countUnresolvedCritiques`) all in one file. Splitting into focused test files (e.g., `world-branch.test.ts`, `world-state-files.test.ts`, `world-critiques.test.ts`) would improve the health score following the same pattern used in the prompts.test.ts split (commit `e416e31`).

## 3. Write finding for unspecified review-loop-breaker and process-patterns behaviour
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The behaviour tree in `src/tree/default-tree.ts` has two review-loop-breaker nodes (lines 31-34) and the shift log parser (`src/log/shift-log-parser.ts`) computes `reviewLoopCount`, `reactiveRatio`, and `innovationCycleCount` as `processPatterns`. These feed back into explore prompts via "process temperature" guidance (`src/prompts/explore.ts` lines 16-37) and cap innovation cycles. None of this self-monitoring loop is described in the invariants or wiki. A finding should document these for the human to add to the spec.

## 4. Improve setup.test.ts health score (second worst at 91)
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/setup.test.ts` (402 lines, score 91) is the second-worst file. Similar to the world.test.ts case, it likely contains multiple test groups that could be split into domain-focused files to reduce per-file complexity and improve the health score.

## 5. Write finding for unspecified partial-work / continue-work action
**Type**: doc-sync
**Impact**: low
**Reasoning**: The tree has a `partial-work` condition (`src/tree/default-tree.ts`) that checks for `.shoe-makers/state/partial-work.md` and routes to `continue-work`. The permission model for `continue-work` in `src/verify/permissions.ts` is unusually broad (same as `execute-work-item`). Neither the partial-work file, the continue-work action, nor its permissions are specified in the invariants. This should be documented as a finding for human review.
