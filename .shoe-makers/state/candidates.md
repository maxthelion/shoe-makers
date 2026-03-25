# Candidates

## 1. Fix incomplete skill list assertion in init.test.ts
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/__tests__/init.test.ts:62` tests "scaffolds all core skills" but only checks 5 of the 9 skill files that `src/init.ts:52-66` scaffolds. Missing from the assertion: `octoclean-fix.md`, `bug-fix.md`, `dead-code.md`, `dependency-update.md`. The test name is misleading. Also, `src/__tests__/init.test.ts:73` "scaffolded skills have valid frontmatter" only checks the same 5 skills. Fix: expand both tests to check all 9 skill files. The fix is data-driven: extract the expected skill list from the init module or define the complete list in the test.

## 2. Refactor setup.ts to reduce size (408 lines)
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is the largest file at 408 lines and mixes multiple concerns: branch management, housekeeping commits, wiki reading, inbox reading, assessment logging, action formatting, and world state building. Extract branch management (`ensureBranch`, `checkoutOrCreateBranch`) and housekeeping (`autoCommitHousekeeping`, `isAllHousekeeping`) into separate modules under `src/scheduler/`. This aligns with the project structure in CLAUDE.md which already lists `src/scheduler/` as the home for these concerns.

## 3. Stale invariants finding needs human attention (informational)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `invariant-update-2026-03-25.md` documents two specified-only invariants referencing the removed verify model. Only humans can update `.shoe-makers/invariants.md`. No elf action possible.
