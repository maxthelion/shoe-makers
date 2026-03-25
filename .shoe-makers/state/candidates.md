# Candidates

## 1. Add permission enforcement tests for continue-work action
**Type**: test
**Impact**: medium
**Reasoning**: `src/verify/permissions.ts` now has a `continue-work` entry with executor-level permissions, but `src/__tests__/permissions.test.ts` may not cover it. Adding explicit tests for `isFileAllowed("continue-work", ...)` ensures the permission configuration is verified. This is the last untested aspect of the ContinueAgent feature.

## 2. Update invariants.md line 32 (human nudge finding)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/invariants.md` line 32 says "Verification has already caught and reverted bad work — what's on the branch passed checks." All wiki references to the old model have been updated (branching-strategy.md, pure-function-agents.md), but the invariants.md claim itself is human-only. The existing finding (`invariant-update-2026-03-25.md`) already suggests updates. A fresh, more specific finding could help the human prioritise this. However, the elf cannot modify invariants.md — only surface the issue.

## 3. Add JSDoc to new continue-work functions
**Type**: health
**Impact**: low
**Reasoning**: The new `hasPartialWork` condition in `default-tree.ts`, `checkHasPartialWork` in `world.ts`, and `buildContinueWorkPrompt` in `reactive.ts` all have minimal or no JSDoc. Adding brief JSDoc descriptions would match the documentation style of adjacent functions. Low priority since the function names are self-descriptive.
