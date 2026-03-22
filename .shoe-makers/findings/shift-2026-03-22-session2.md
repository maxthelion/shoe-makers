# Finding: Session 2026-03-22 — Review cycle bugs and code deduplication

## What happened

This session performed adversarial review and explore actions, discovering and fixing several bugs in the review cycle.

## Bugs found and fixed

1. **Critique prompt step ordering** (`src/prompts.ts`) — The critique prompt told reviewers to update `last-reviewed-commit` (step 7) before committing (step 8). Since the marker points to HEAD, this made it point to the commit *before* the review, causing the review commit itself to trigger another review. Additionally, the prompt told reviewers to commit the marker file, but it's gitignored. Fixed: commit first (step 7), then update marker on disk (step 8) with a note that it's gitignored.

2. **checkUnreviewedCommits false negative** (`src/state/world.ts`) — When no `last-reviewed-commit` marker file existed, `world.ts` caught the error and returned `false` (no unreviewed commits). Per the spec, if there's no marker, all commits should be considered unreviewed. `setup.ts` had the correct implementation. Fixed by aligning `world.ts` with the correct logic.

3. **Test side effects on review marker** (`src/__tests__/world.test.ts`) — The `checkUnreviewedCommits` tests wrote to the real repo's marker file without restoring it, corrupting the marker for subsequent setup runs. Fixed with beforeEach/afterEach save/restore.

## Refactoring done

4. **Deduplicated shared functions** — `checkUnreviewedCommits` and `countUnresolvedCritiques` were independently implemented in both `setup.ts` and `state/world.ts`. Exported them from `world.ts` and removed the duplicates from `setup.ts`. Single source of truth.

## Tests added

- 1 new prompt test (critique step ordering)
- 3 new world tests (marker at HEAD, marker behind HEAD, non-git directory)

Total tests: 246 → 250 (+4, -1 removed duplicate)

## Status

Complete.
