# Candidates

## 1. Update wiki verification.md to describe current critique-cycle model
**Type**: doc-sync
**Impact**: high
**Reasoning**: The invariant `spec.review-and-merge-with-confidence.verification-has-already-caught-and-reverted-bad-work-whats-` references `.shoe-makers/invariants.md` line 32: "Verification has already caught and reverted bad work — what's on the branch passed checks." This describes the old revert model. The invariant text in `invariants.md` is human-only, but we can update the wiki spec (`wiki/pages/verification.md`) to describe the current model more precisely, and the invariant claim text in section 1.3 of `invariants.md` to be updated by the human. The `branching-strategy.md` was already updated — this is the companion update.

## 2. Implement partial work resumption (ContinueAgent)
**Type**: implement
**Impact**: high
**Reasoning**: `wiki/pages/pure-function-agents.md` specifies that agents can return `status: "partial"` and the behaviour tree should detect "unfinished work" and invoke a ContinueAgent. This is a spec-only gap: `src/types.ts:141` defines `AgentResult.status: "done" | "partial" | "failed"` but the tree (`src/tree/default-tree.ts`) has no condition for partial work. The `hasUncommittedChanges` condition exists but routes to "review" not "continue". Implementing this requires: a new tree condition, a continuation prompt builder, and wiring in the tree. This is foundational architecture specified but not built.

## 3. Add tests for prompt builders (reactive.ts, three-phase.ts)
**Type**: test
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` (75 lines, 5 builders) and `src/prompts/three-phase.ts` (249 lines, 6 builders) have no dedicated test file — they're tested indirectly through `prompts.test.ts` which tests the `generatePrompt` dispatcher. Direct unit tests for individual builders would verify edge cases: e.g. `buildCritiquePrompt` with/without permission violations, `buildExplorePrompt` with/without article, `buildInnovatePrompt` with/without wiki summary. These are the largest untested-by-name files.

## 4. Verify README accuracy and add architecture diagram reference
**Type**: doc-sync
**Impact**: low
**Reasoning**: The explore instructions say to check README accuracy. README.md looks current but could reference the wiki pages more prominently. Low priority — cosmetic improvement only.
