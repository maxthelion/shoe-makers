# Add unit tests for world state utility functions

skill-type: test

## Context

`src/state/world.ts` exports several utility functions that the behaviour tree depends on for routing decisions. These functions are only tested indirectly through `readWorldState()` integration test. Direct unit tests ensure each function works correctly in isolation.

## What to build

Add tests to `src/__tests__/world.test.ts` for these functions:

### 1. `checkHasWorkItem(repoRoot)` (line 124)
Delegates to `fileExists()`. Test:
- Returns `true` when `.shoe-makers/state/work-item.md` exists
- Returns `false` when the file doesn't exist

### 2. `checkHasCandidates(repoRoot)` (line 131)
Same pattern. Test:
- Returns `true` when `.shoe-makers/state/candidates.md` exists
- Returns `false` when the file doesn't exist

### 3. `countInsights(repoRoot)` (line 46)
Counts `.md` files in `.shoe-makers/insights/`. Test:
- Returns 0 when insights directory doesn't exist
- Returns 0 when insights directory is empty
- Returns count of .md files only (ignores non-.md files)
- Returns correct count with multiple insight files

### 4. `hasUncommittedChanges(repoRoot)` (line 23)
Uses `git status --porcelain`. Test in a temp git repo:
- Returns `false` for a clean repo
- Returns `true` when a file is modified but not staged
- Returns `true` when a file is staged but not committed

## Patterns to follow

Use the existing test patterns in `world.test.ts`:
- `mkdtemp` + `rm` for temp directories (lines 103-110)
- `mkdir` recursive for creating nested state directories (line 118)
- `writeFile` to create test files
- For git-dependent tests, init a temp repo: `execSync("git init", { cwd: tempDir })` then `execSync("git add . && git commit -m init", ...)` — this pattern is used in many test files

Import the functions: add `checkHasWorkItem, checkHasCandidates, countInsights, hasUncommittedChanges` to the import on line 6.

## What NOT to change

- Do not modify `src/state/world.ts` (source under test)
- Do not modify other test files
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 was chosen because these functions are the decision-making foundation of the behaviour tree. If `checkHasWorkItem` returns a false positive, the tree skips to execute-work-item when it shouldn't. Direct tests catch this class of bug. The other candidates (renaming a test title, consolidating test helpers, reactive prompt tests, doc-sync) are lower impact or cosmetic. World state reader correctness is a hygiene priority per the spec.
