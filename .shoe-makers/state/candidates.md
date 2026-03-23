# Candidates

## 1. Insight Lifecycle Test Coverage
**Type**: test
**Impact**: medium
**Reasoning**: `wiki/pages/creative-exploration.md` specifies that insights are created during explore, evaluated during prioritise (promote/rework/dismiss), and optionally converted to work items. The explore prompt (`src/prompts/three-phase.ts:buildExplorePrompt`) includes the Wikipedia creative lens, and the prioritise prompt includes insight evaluation instructions. However, there are no tests verifying that the insight-related sections of these prompts are coherent — e.g. that explore mentions writing insights to the correct path, and prioritise mentions reading from the same path. Files: `src/prompts/three-phase.ts`, `src/__tests__/prompts.test.ts`.

## 2. Export TraceAnalysis Type
**Type**: improve
**Impact**: low
**Reasoning**: The `TraceAnalysis` interface in `src/log/shift-summary.ts` is not exported, making it unavailable to external consumers. If a future `bun run review:prepare` command or other tooling wants to type-check against trace data, they can't import the type. Simple `export` keyword addition. Files: `src/log/shift-summary.ts`.

## 3. Dead Code Audit — Check for Unused Exports
**Type**: dead-code
**Impact**: low
**Reasoning**: With all the recent refactoring and feature additions, there may be exports that are no longer imported anywhere. A quick audit of `src/` for unused exports would keep the codebase lean. This is housekeeping but prevents accumulation. Files: all `src/*.ts` files.
