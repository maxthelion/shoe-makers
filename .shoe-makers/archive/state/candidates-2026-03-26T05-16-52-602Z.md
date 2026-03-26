# Candidates

## 1. Split world.test.ts to improve health score (worst file at 89)
**Type**: health
**Impact**: high
**Reasoning**: `src/__tests__/world.test.ts` (453 lines, 52 test/describe blocks, score 89) is the worst-scoring file in the codebase. It tests 10 different functions from `src/state/world.ts` all in one file: `readWorldState`, `getCurrentBranch`, `checkUnreviewedCommits`, `readWorkItemSkillType`, `checkHasWorkItem`, `checkHasCandidates`, `checkHasPartialWork`, `countInsights`, `hasUncommittedChanges`, `countUnresolvedCritiques`. Splitting into 3 focused files (e.g., `world-state.test.ts`, `world-git.test.ts`, `world-files.test.ts`) would follow the precedent set by the `prompts.test.ts` split (commit `e416e31`) and directly improve the health score.

## 2. Split setup.test.ts to improve health score (second worst at 91)
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/setup.test.ts` (402 lines, 39 test/describe blocks, score 91) is the second-worst file. It tests `logAssessment`, `readInboxMessages`, `formatAction`, and `readNotes`. These could be split by domain (assessment logging, inbox, action formatting, notes) to reduce per-file complexity.

## 3. Write finding for unspecified process-patterns self-monitoring loop
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `src/log/shift-log-parser.ts` computes `reviewLoopCount`, `reactiveRatio`, and `innovationCycleCount` as `processPatterns`. These feed into explore prompts via "process temperature" guidance (`src/prompts/explore.ts` lines 16-37), cap innovation cycles (`src/tree/default-tree.ts` lines 73-77), and drive two review-loop-breaker tree nodes (lines 31-34). None of this self-monitoring architecture is described in the invariants (sections 2.2, 2.3, 3.4) or wiki pages. A finding would document this for human review to update the spec.

## 4. Write finding for unspecified partial-work / continue-work action
**Type**: doc-sync
**Impact**: low
**Reasoning**: The tree has a `partial-work` condition in `src/tree/default-tree.ts` that checks for `.shoe-makers/state/partial-work.md` and routes to `continue-work`. Its permission model in `src/verify/permissions.ts` is as broad as `execute-work-item`. Neither the partial-work mechanism nor its permissions appear in the invariants or wiki. This should be documented for spec alignment.

## 5. Improve prompt-builders.test.ts health score (third worst at 93)
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/prompt-builders.test.ts` (363 lines, score 93) is the third-worst file. While score 93 is less urgent, splitting or reducing its complexity would move the health floor closer to 100.
