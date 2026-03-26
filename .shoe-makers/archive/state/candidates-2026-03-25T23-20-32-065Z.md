# Candidates

## 1. Test coverage for format-action and permission-setup
**Type**: test
**Impact**: medium
**Reasoning**: `src/scheduler/format-action.ts` and `src/scheduler/permission-setup.ts` are on the critical path — they produce the elf's prompt and enforce role boundaries. These modules have thinner test coverage than other critical-path modules. Edge cases like missing skill files, unknown action types, empty permission sets, and malformed skill metadata would benefit from explicit tests. Per `wiki/pages/verification.md`, TDD enforcement is a core quality guarantee.

## 2. Add CHANGELOG version sections
**Type**: doc-sync
**Impact**: low
**Reasoning**: The CHANGELOG has only an `[Unreleased]` section with 40+ entries. Keep a Changelog format recommends versioned sections. Grouping the initial implementation into v0.1.0 and the configurable thresholds into the unreleased section would improve readability for the human morning review workflow described in `wiki/pages/integration.md`.

## 3. README: document partial work and continue-work flow
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README tree diagram shows the partial work node but doesn't explain what it means. Partial work is a resilience feature specified in `wiki/pages/pure-function-agents.md` and implemented across `src/state/world.ts`, `src/tree/default-tree.ts`, `src/prompts/reactive.ts`. A brief paragraph would help new users understand this capability.
