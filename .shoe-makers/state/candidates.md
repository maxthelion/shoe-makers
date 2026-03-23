# Candidates

## 1. Export TraceAnalysis Type for External Consumers
**Type**: improve
**Impact**: low
**Reasoning**: The `TraceAnalysis` interface in `src/log/shift-summary.ts` (line 8) is not exported, making it unavailable to code outside the module. Any future tooling (e.g. a `bun run review:prepare` command) that wants to work with trace data can't type-check against it. Simple one-word change — add `export` to the interface. Files: `src/log/shift-summary.ts`.

## 2. Dead Code Audit — Check for Unused Exports
**Type**: dead-code
**Impact**: low
**Reasoning**: With recent refactoring and feature additions, there may be exports no longer imported anywhere. A quick audit of `src/` for unused exports would keep the codebase lean. Files: all `src/*.ts` files.

## 3. Config Validation Test Coverage
**Type**: test
**Impact**: low
**Reasoning**: The config module (`src/config.ts`) handles reading `.shoe-makers/config.yaml` and validating values. The test file `src/__tests__/config.test.ts` exists but may not cover all edge cases — boundary values, missing config file, malformed YAML. Files: `src/config.ts`, `src/__tests__/config.test.ts`.
