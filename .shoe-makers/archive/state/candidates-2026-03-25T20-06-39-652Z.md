# Candidates

## 1. Improve health of worst-scoring test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: The three worst-scoring files (all at 94/100) are `src/__tests__/prompt-builders.test.ts`, `src/__tests__/prompt-helpers.test.ts`, and `src/__tests__/prompts-features.test.ts`. These files use 20+ `as any` type assertions for test fixtures instead of properly typed test builders. Creating shared typed fixture factories in `src/__tests__/test-utils.ts` would improve type safety and reduce repetition, raising health scores. The test-utils file already exists and exports some helpers — extending it with typed Assessment/WorldState builders would be a focused improvement.

## 2. Extract FALLBACK_CONCEPTS from wikipedia.ts to a data file
**Type**: health
**Impact**: medium
**Reasoning**: `src/creative/wikipedia.ts` (286 lines) embeds 170+ fallback concept entries inline, inflating the module's complexity score. Extracting these to a separate `src/creative/fallback-concepts.ts` (or JSON data file) would reduce the module's size and improve readability. The fetch/selection logic in wikipedia.ts is clean and would benefit from being easier to read without scrolling past a large data block. Referenced by `wiki/pages/creative-exploration.md`.

## 3. Split setup.ts into focused modules
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is the largest file at 342 lines with multiple responsibilities: running assessment, evaluating the behaviour tree, writing the action file, and logging. Extracting phases into `src/scheduler/assess.ts`, `src/scheduler/write-action.ts` etc. would improve maintainability and bring the file's health score up. The architecture wiki page (`wiki/pages/architecture.md`) describes clean separation of concerns — the setup file is the main area where this principle could be better applied.

## 4. Split shift-summary.ts into focused helpers
**Type**: health
**Impact**: low
**Reasoning**: `src/log/shift-summary.ts` (286 lines) contains trace analysis, process pattern detection, and narrative generation in one file. Extracting `analyzeTraces()` and `buildDescription()` into separate modules would reduce complexity. Lower priority than the above since the file is internally well-structured, but it's the second-largest non-data file.

## 5. Add finding: stale invariants skills list needs human update
**Type**: doc-sync
**Impact**: low
**Reasoning**: A finding already exists (`stale-invariants-skills-list.md`) documenting that invariants section 3.2 lists octoclean-fix, bug-fix, dependency-update, and dead-code as "planned" when they're all implemented. Section 2.2 also misses the "uncommitted changes" and "dead-code work-item" reactive nodes. Since elves cannot modify invariants.md, this is a reminder for the human. No new finding needed — the existing one covers it. Candidate included for completeness but no action required from elves.
