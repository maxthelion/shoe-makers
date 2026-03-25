# Candidates

## 1. Reduce complexity of setup.ts (octoclean score 91)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/setup.ts` is 408 lines with health score 91 — second worst in the codebase. The `main()` function (lines 33-148) is ~115 lines doing branch setup, assessment, config loading, tree evaluation, Wikipedia fetch, permission detection, state archiving, prompt generation, and logging. This could be split into smaller focused functions (e.g., `runAssessment()`, `prepareCreativeContext()`, `writeActionFile()`). The `autoCommitHousekeeping()` function (lines 174-221) also does multiple things: reads status, checks markers, stages, commits, and conditionally advances the marker. Splitting these would improve readability and testability without changing behaviour.

## 2. Reduce complexity of prompts.test.ts (octoclean score 87)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is the worst-scoring file at 87 with 755 lines. Test files scoring low often indicate repeated test setup or deeply nested describe blocks. Extracting shared fixtures and reducing duplication could bring the score up. This is the single biggest drag on the 99/100 health score.

## 3. Reduce complexity of world.test.ts (octoclean score 93)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/world.test.ts` is 350 lines with score 93. This is the third worst file. Likely has repeated setup logic that could use shared helpers from `test-utils.ts`. Lower impact since the score is already close to target, but would help push overall health toward 100.

## 4. Doc-sync: README accuracy check
**Type**: doc-sync
**Impact**: low
**Reasoning**: Invariant 3.5 says "The README reflects current capabilities as described by the invariants — not aspirational, not stale." The README mentions `bun run tick` but the behaviour tree section and configuration section should be verified against the actual current implementation. The `bun run init` command should be verified to match the actual init workflow. Minor drift risk since the codebase has evolved significantly.

## 5. Surface stale invariants finding to human
**Type**: doc-sync
**Impact**: low
**Reasoning**: The 2 specified-only invariants ("commit or revert" and "Verification has caught and reverted bad work") are stale — they describe an old verify model that was removed. A finding already exists at `.shoe-makers/findings/invariant-update-2026-03-25.md` documenting this for human review. No elf action is possible since `.shoe-makers/invariants.md` is human-only. Including here for completeness — the human should update the invariants on next merge review.
