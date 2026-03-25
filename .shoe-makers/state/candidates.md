# Candidates

## 1. Extract shared action classification constants from shift-log-parser.ts and shift-summary.ts
**Type**: health
**Impact**: medium
**Reasoning**: Both `src/log/shift-log-parser.ts:5` and `src/log/shift-summary.ts:54` define identical `REACTIVE_ACTIONS` sets (`["fix-tests", "fix-critique", "critique", "review", "inbox"]`). Similarly, `shift-log-parser.ts:8` defines `PROACTIVE_ACTIONS` which is the complement of the same set. If a new action type is added to the behaviour tree, both files must be updated independently or they'll drift. A shared constant (e.g., in `src/log/action-classification.ts` or `src/types.ts`) would eliminate this duplication. The invariant that reactive conditions have fixed priority (spec section 2.2) depends on consistent classification.

## 2. Refactor setup.ts to reduce size (408 lines)
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is the largest file at 408 lines and mixes multiple concerns: branch management (`ensureBranch`, `checkoutOrCreateBranch`), housekeeping (`autoCommitHousekeeping`, `isAllHousekeeping`), wiki reading (`readWikiOverview`), inbox reading (`readInboxMessages`), assessment logging (`logAssessment`), action formatting (`formatAction`), and world state building (`buildWorldState`). The wiki page `architecture.md` specifies the setup script should "ensure branch, run assessment, evaluate tree, write prompt" — the current file does more than that. Extracting branch management and housekeeping into `src/scheduler/` modules would improve maintainability and align with the project structure in CLAUDE.md.

## 3. Stale invariants finding needs human attention (informational)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `invariant-update-2026-03-25.md` documents two specified-only invariants ("commit or revert" and "Verification has already caught and reverted bad work") referencing the removed verify model. Only humans can update `.shoe-makers/invariants.md`. No elf action possible.
