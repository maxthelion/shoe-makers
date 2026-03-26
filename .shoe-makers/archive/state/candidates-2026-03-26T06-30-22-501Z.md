# Candidates

## 1. Sync README.md behaviour tree with actual tree structure
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README's tree diagram (lines 12-24) is missing the `[partial work?] → Continue partial work` node that exists in the actual tree (`src/tree/default-tree.ts:112`) and is documented in the wiki (`wiki/pages/behaviour-tree.md:25`). The README also simplifies the two review-loop-breaker nodes into one line. Since README is the project's public face, it should accurately reflect the tree. The wiki page is correct; just the README needs updating.

## 2. Update TypeScript peer dependency to allow v6
**Type**: dependency-update
**Impact**: low
**Reasoning**: `package.json` specifies `"typescript": "^5"` as a peer dependency, but TypeScript 6.0.2 is now available (`bun outdated` shows 5.9.3 → 6.0.2). This is a major version bump so it needs careful testing — run `bun run typecheck` and `bun test` after updating. The `^5` semver constraint blocks the update, so `peerDependencies` would need to change to `"^5 || ^6"` or `">=5"`.

## 3. Write finding for wiki page `scheduled-tasks.md` vs actual scheduler implementation
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The wiki has a `wiki/pages/scheduled-tasks.md` page describing the scheduled task setup, and the behaviour tree page describes the tick model in detail. The actual scheduler implementation is in `src/` but it would be valuable to verify that `scheduled-tasks.md` accurately reflects the current implementation — particularly whether the setup/tick/shift scripts match what the page describes. If it's stale, a finding should be filed.

## 4. Add test coverage for prompt generation functions
**Type**: test
**Impact**: medium
**Reasoning**: There are 16 prompt files in `src/prompts/` (continue-work, critique, dead-code, evaluate-insight, execute, explore, fix-critique, fix-tests, inbox, innovate, prioritise, reactive, review, three-phase). While prompt builders are tested via integration tests, individual prompt functions could benefit from direct tests verifying they include expected context (e.g., that the explore prompt includes process temperature guidance when reactiveRatio is high, or that continue-work prompt includes the partial-work file content). This would catch regressions in prompt composition.

## 5. Consolidate duplicate archived candidate files
**Type**: health
**Impact**: low
**Reasoning**: `.shoe-makers/archive/state/` contains two identical candidate files (`candidates-2026-03-26T05-32-13-519Z.md` and `candidates-2026-03-26T05-33-29-860Z.md`) with byte-identical content. This suggests the setup script archived the same candidates twice in quick succession. While harmless, it adds noise to the archive. A small fix in `src/setup.ts` to deduplicate or skip archiving identical content would keep the archive clean.
