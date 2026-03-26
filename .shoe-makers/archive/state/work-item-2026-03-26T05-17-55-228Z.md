skill-type: health

# Split world.test.ts into focused test files for health improvement

## Wiki Spec

No specific wiki requirement for test file structure, but the project convention (demonstrated by the prompts.test.ts split in commit `e416e31`) is to keep test files focused on a single domain.

## Current Code

`src/__tests__/world.test.ts` (453 lines, score 89) is the worst-scoring file. It tests 10 functions across 4 unrelated domains:

1. **Git state** (lines 8-81): `readWorldState`, `getCurrentBranch`, `hasUncommittedChanges`
2. **Commit review** (lines 83-156): `checkUnreviewedCommits` (uses isolated temp git repos)
3. **State file checks** (lines 158-336): `readWorkItemSkillType`, `checkHasWorkItem`, `checkHasCandidates`, `checkHasPartialWork`, `countInsights`
4. **Critique counting** (lines 338-445): `countUnresolvedCritiques`

All functions are imported from `src/state/world.ts`.

## What to Build

Split `src/__tests__/world.test.ts` into 3 files:

1. **`src/__tests__/world-git.test.ts`** — Tests for `readWorldState`, `getCurrentBranch`, `hasUncommittedChanges`, and `checkUnreviewedCommits`. These all need git repos (temp or real). (~156 lines)

2. **`src/__tests__/world-state-files.test.ts`** — Tests for `readWorkItemSkillType`, `checkHasWorkItem`, `checkHasCandidates`, `checkHasPartialWork`, `countInsights`. These only need temp directories with files. (~178 lines)

3. **`src/__tests__/world-critiques.test.ts`** — Tests for `countUnresolvedCritiques`. This is the largest group (108 lines) testing the resolved pattern matching. (~108 lines)

4. **Delete** `src/__tests__/world.test.ts` after the split.

Each file should:
- Import only the functions it tests from `../state/world`
- Include its own `beforeEach`/`afterEach` for temp dir setup/teardown
- Keep the exact same test cases — no changes to test logic

## Patterns to Follow

Follow the exact pattern from the `prompts.test.ts` split (commit `e416e31`):
- `src/__tests__/prompts-core.test.ts`
- `src/__tests__/prompts-creative.test.ts`
- `src/__tests__/prompts-reactive.test.ts`

Each split file is self-contained with its own imports and setup.

## Tests to Write

No new tests needed — this is a pure refactor. All existing 22 tests from `world.test.ts` must pass after the split. Run `bun test` to verify the count doesn't change.

## What NOT to Change

- Do NOT modify any test logic or assertions
- Do NOT modify `src/state/world.ts`
- Do NOT add or remove any test cases
- Do NOT modify `.shoe-makers/invariants.md`
- The total test count (950) must remain the same after the split

## Decision Rationale

Chosen over candidate 2 (setup.test.ts split) because world.test.ts has the worst score (89 vs 91) and would have the largest health impact. Health improvements compound — fixing the worst file first maximizes the overall score improvement.
