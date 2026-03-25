# Candidates

## 1. Doc-sync: document new config keys in wiki and README
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The just-implemented config keys (`health-regression-threshold`, `review-loop-threshold`, `wikipedia-timeout`, `octoclean-timeout`) are not documented in the wiki (`wiki/pages/architecture.md` config section) or in the README's configuration example. The wiki is the source of truth per `wiki/pages/wiki-as-spec.md`, so new configurable behaviour should be reflected there. The README config example at line 107-117 also needs these keys added for discoverability.

## 2. Improve health score of config.test.ts
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: After adding new config tests, `src/__tests__/config.test.ts` is now one of the worst files (score 96/100). The file has 280+ lines of similar test patterns that could be more concise. Octoclean flagged it in the latest assessment. Extracting a helper to reduce boilerplate across the 20+ tests would improve its health score without changing test coverage.

## 3. Add CHANGELOG version sections
**Type**: doc-sync
**Impact**: low
**Reasoning**: The CHANGELOG has only an `[Unreleased]` section with ~40 entries. Invariant section 3.4 states "The CHANGELOG tracks user-facing changes in Keep a Changelog format." Keep a Changelog recommends versioned sections with dates. The configurable thresholds work just committed should be added and the existing entries grouped into a v0.1.0 release.

## 4. Test coverage for format-action and permission-setup edge cases
**Type**: test
**Impact**: medium
**Reasoning**: `src/scheduler/format-action.ts` formats the final elf prompt and `src/scheduler/permission-setup.ts` builds permission context — both on the critical path. These modules have thinner test coverage relative to their complexity. Edge cases like missing skill files, unknown action types, or empty permission sets would benefit from explicit tests.

## 5. README: document partial work and continue-work flow
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README's tree diagram shows the partial work node but doesn't explain what it means or how agents use it. Partial work is a resilience feature specified in `wiki/pages/pure-function-agents.md` and implemented across `src/state/world.ts`, `src/tree/default-tree.ts`, `src/prompts/reactive.ts`.
