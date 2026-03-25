# Candidates

## 1. Implement graduated review-loop-breaker from insight
**Type**: implement
**Impact**: high
**Reasoning**: The existing insight `2026-03-25-001.md` (Quorum Sensing for Shift Progress) identifies a real bug: when `candidates.md` already exists and the review-loop-breaker fires, the system routes to `explore` unconditionally, creating a stuck state that burns through the tick budget on redundant exploration. The fix is to check `hasCandidates` in the breaker node and route to `prioritise` instead of `explore` when candidates exist. This affects `src/tree/default-tree.ts` and needs corresponding test updates in `src/__tests__/default-tree.test.ts`. The wiki page `wiki/pages/behaviour-tree.md` specifies the breaker but doesn't specify this graduated behaviour, so the wiki should be updated too.

## 2. Add tests for format-action.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/scheduler/format-action.ts` has two exported functions (`formatAction` and `readWikiOverview`) that are only indirectly tested through `setup.test.ts`. The `formatAction` function has 3 branches (inbox, skill, nothing-to-do) and `readWikiOverview` has fallback behaviour when wiki files are missing. These deserve dedicated unit tests. Direct tests would catch regressions in prompt formatting without needing to trace through the full setup flow.

## 3. Add tests for permission-setup.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/scheduler/permission-setup.ts` handles role context setup for the verification gate. While the permission system itself is well-tested (272 lines in `permissions.test.ts`), the setup/wiring layer that connects permissions to the scheduler tick loop has no dedicated tests. A regression here could silently disable permission enforcement.

## 4. Doc-sync README with schedule and observability features
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README mentions `schedule.md` briefly in the config section but doesn't explain what it does (working hours, setup exits outside schedule). It also doesn't mention the shift summary dashboard, process pattern tracking (reactive ratio, review loops, innovation cycles), or the creative insight evaluation pipeline in any detail. These are implemented features that users would benefit from knowing about. Affects `README.md` and potentially `wiki/pages/observability.md`.

## 5. Pareto efficiency insight: diminishing returns detection
**Type**: implement
**Impact**: low
**Reasoning**: Through the Pareto efficiency lens: the system currently has health=100, 888 passing tests, 0 invariant gaps. It may be at a Pareto frontier where further work in any dimension yields diminishing returns. The explore action could detect this state (all metrics maxed, no findings, no gaps) and explicitly log it rather than generating candidates that produce marginal improvements. This would reduce wasted ticks when the codebase is already in excellent shape. Could be implemented as a condition in the explore prompt or as a new tree node.
