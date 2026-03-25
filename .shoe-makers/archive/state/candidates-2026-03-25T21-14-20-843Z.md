# Candidates

## 1. Continue splitting remaining worst-scoring test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: Health is still 99/100. The new worst files are `src/__tests__/registry.test.ts` (95, 309 lines), `src/__tests__/wikipedia.test.ts` (95), and `src/__tests__/world.test.ts` (95). The registry test at 309 lines is the most obvious candidate for splitting — it tests skill loading, parsing, validation, and context interpolation in one file. Splitting these remaining 95-score files could push overall health to 100.

## 2. Add edge-case and error-path test coverage
**Type**: test
**Impact**: medium
**Reasoning**: Error paths are underexercised across the codebase. Key gaps: `src/creative/wikipedia.ts` error handling (empty corpus, malformed markdown files), `src/schedule.ts` edge cases (midnight wrap boundary conditions), `src/verify/detect-violations.ts` error recovery, and `src/scheduler/verification-gate.ts` revert failure paths. Adding targeted error-path tests would catch regressions in failure modes.

## 3. Add integration test for full tick lifecycle
**Type**: test
**Impact**: medium
**Reasoning**: Individual components (tree evaluation, state reading, prompt generation, verification gate) are well-tested in isolation, but there's no end-to-end test exercising a complete tick: read state -> evaluate tree -> generate prompt -> verify result. An integration test using temp directories and mock state would validate wiring between components. This aligns with wiki spec on testability of the tick loop (`wiki/pages/behaviour-tree.md`).

## 4. Reduce complexity in src/skills/assess.ts
**Type**: health
**Impact**: low
**Reasoning**: At 208 lines, `src/skills/assess.ts` is the only programmatic skill and handles many concerns: running tests, typecheck, health scan, invariant checking, git activity, plan counting, finding archival, and process pattern analysis. Extracting some of these into helper functions or a separate module would improve testability and readability. Currently scored above 95 but is a natural complexity hotspot.

## 5. Sync wiki pages with current tree structure
**Type**: doc-sync
**Impact**: low
**Reasoning**: The open finding `stale-invariants-skills-list` notes that `wiki/pages/behaviour-tree.md` and invariants section 2.2 don't fully match the actual tree in `src/tree/default-tree.ts`. While invariants.md is human-only, wiki pages could be updated by elves. Specifically, checking that `wiki/pages/behaviour-tree.md` accurately lists all reactive conditions including `uncommitted changes → review` and `dead-code work-item`.
