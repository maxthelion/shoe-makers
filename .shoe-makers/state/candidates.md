# Candidates

## 1. Sync verification.md wiki page with continue-work action
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The `continue-work` action exists in code (`src/tree/default-tree.ts:110`, `src/verify/permissions.ts:45`) with executor-level permissions and has tests (`src/__tests__/permissions.test.ts`), but `wiki/pages/verification.md` does not include it in the roles/permissions table. The table lists 12 actions but omits `continue-work`. This is a spec-code gap — the wiki should be the source of truth but is missing a documented action. The `wiki/pages/behaviour-tree.md` page does mention it, creating an inconsistency between wiki pages.

## 2. Add test coverage for prompt template builders (reactive.ts, three-phase.ts)
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` (6 exports) and `src/prompts/three-phase.ts` (6 exports) are prompt template builders that generate the action prompts for all tree actions. They are only tested indirectly through `src/__tests__/prompts.test.ts` which tests `generatePrompt()`. Direct tests would catch regressions in individual prompt builders (e.g., `buildExplorePrompt` receiving incorrect tier data, `buildCritiquePrompt` missing permission violation sections). These are critical path — every elf receives its instructions through these functions.

## 3. Add test coverage for action-classification constants
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/log/action-classification.ts` exports `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` sets that are consumed by `shift-log-parser.ts` and `shift-summary.ts`. There are no direct tests verifying these sets contain the correct actions. If a new action is added to the tree but not to these sets, the shift summary would silently misclassify it. A simple test asserting the sets match the actions defined in `default-tree.ts` would prevent this drift.

## 4. Invariant finding: stale invariants need human update (existing finding)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/findings/invariant-update-2026-03-25.md` already documents that two invariants ("commit or revert" and "Verification has already caught and reverted bad work") reference the removed verify model. These are human-only to update. This is noted here for completeness — the finding already exists and is actionable by the human. No elf work needed.

## 5. Creative lens (Dutch Auction): priority decay for stale candidates
**Type**: improve
**Impact**: low
**Reasoning**: The Dutch Auction concept — starting high and decreasing until someone bids — suggests an interesting pattern for candidate prioritisation. Currently, if an explore phase writes candidates and they aren't picked, they sit at the same priority indefinitely. A "Dutch Auction" approach would have candidates lose priority over multiple explore cycles if repeatedly not selected, eventually being archived. This prevents stale candidates from blocking fresh exploration. Implementation would be a small addition to the prioritise phase: track how many times a candidate has been passed over and discount its effective priority. This is speculative but could improve the system's ability to self-correct bad candidate lists.
