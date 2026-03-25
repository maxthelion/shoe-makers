# Candidates

## 1. Improve code health of oversized test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: The three worst-scoring files are all test files at 94-95 health: `src/__tests__/prompt-builders.test.ts` (94), `src/__tests__/prompts-features.test.ts` (94), `src/__tests__/invariants.test.ts` (95). These are 300+ line monolithic test files. Splitting them by semantic concern (e.g., reactive vs three-phase prompt tests) or extracting shared setup would improve readability and raise the overall health score toward 100. This is the most direct path to improving the health metric.

## 2. Add edge-case and error-path test coverage
**Type**: test
**Impact**: medium
**Reasoning**: While test file coverage is good (46 test files for 55 source files), error paths are underexercised. Key gaps: `src/creative/wikipedia.ts` error handling (empty corpus, malformed files), `src/schedule.ts` edge cases (midnight wrap, missing file), `src/verify/detect-violations.ts` error recovery, and `src/scheduler/verification-gate.ts` revert failure paths. Adding targeted error-path tests would catch regressions in failure modes and improve robustness.

## 3. Sync README with invariants finding
**Type**: doc-sync
**Impact**: low
**Reasoning**: The open finding `.shoe-makers/findings/stale-invariants-skills-list.md` documents that invariants.md section 3.2 lists some skills as "planned" when all 9 are now implemented, section 2.2 is missing reactive conditions, and there's duplicate section numbering. While the invariants file itself is human-only, the README could be checked for any similar staleness. Currently the README is accurate, but a doc-sync pass would confirm alignment and potentially add any missing details about the innovation tier or creative exploration features.

## 4. Reduce complexity in src/setup.ts
**Type**: health
**Impact**: low
**Reasoning**: At 282 lines, `src/setup.ts` is the largest non-test source file and handles multiple concerns: working hours check, assessment orchestration, tree evaluation, action formatting, and logging. While it uses helper functions internally, extracting some phases into separate modules (e.g., `src/setup/format-action.ts`) could improve maintainability and make each concern independently testable. The file is functional but is a natural candidate for health improvement.

## 5. Add integration test for full tick lifecycle
**Type**: test
**Impact**: medium
**Reasoning**: Individual components (tree evaluation, state reading, prompt generation, verification gate) are well-tested in isolation, but there's no end-to-end test that exercises a complete tick: read state -> evaluate tree -> generate prompt -> verify result. An integration test using temp directories and mock state would catch wiring issues between components and validate the scheduler's orchestration logic. This aligns with wiki spec section on testability of the tick loop.
