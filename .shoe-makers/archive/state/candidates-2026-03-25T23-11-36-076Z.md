# Candidates

## 1. Extract hardcoded thresholds to config.yaml
**Type**: health
**Impact**: medium
**Reasoning**: Several thresholds are hardcoded across the codebase rather than read from config.yaml: health regression tolerance (2 points in `src/verify/health-regression.ts`), review loop breaker threshold (3 in `src/tree/default-tree.ts` and `src/log/shift-summary.ts`), Wikipedia fetch timeout (10s in `src/creative/wikipedia.ts`), octoclean timeout (120s in `src/skills/health-scan.ts`). The wiki spec (`wiki/pages/architecture.md`) emphasises configurability via config.yaml, and invariant section 5.2 specifies config with sensible defaults. Making these configurable reduces the need for code changes when tuning behaviour, and aligns with the existing pattern where `max-ticks-per-shift`, `max-innovation-cycles`, and `insight-frequency` are already configurable.

## 2. Add CHANGELOG version sections
**Type**: doc-sync
**Impact**: low
**Reasoning**: The CHANGELOG currently has only an `[Unreleased]` section with ~40 entries covering the entire project history. Invariant section 3.4 states "The CHANGELOG tracks user-facing changes in Keep a Changelog format." The Keep a Changelog format recommends versioned sections with dates. Grouping completed work into a v0.1.0 release and keeping `[Unreleased]` for new changes would improve readability for human reviewers and establish a release cadence. This is a low-risk documentation improvement.

## 3. README: document partial work and continue-work flow
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README thoroughly documents the behaviour tree, three-phase orchestration, and innovation tier, but does not mention the partial work mechanism. Partial work is a significant resilience feature (wiki spec `wiki/pages/pure-function-agents.md` specifies it, code implements it in `src/state/world.ts`, `src/tree/default-tree.ts`, `src/prompts/reactive.ts`). The README's tree diagram correctly shows the node but doesn't explain what partial work means or how agents use it. A brief paragraph under the "How it works" section would help new users understand this capability.

## 4. Test coverage for format-action and permission-setup edge cases
**Type**: test
**Impact**: medium
**Reasoning**: The codebase has 902 tests with excellent overall coverage. Two modules have thinner coverage relative to their complexity: `src/scheduler/format-action.ts` (formats the final elf prompt with skill sections, permission context, and validation patterns) and `src/scheduler/permission-setup.ts` (builds permission context for the current action). These are on the critical path — format-action produces the actual prompt the elf reads, and permission-setup enforces role boundaries. Edge cases like missing skill files, unknown action types, or empty permission sets could benefit from explicit test coverage to prevent regressions.

## 5. Stale invariants documentation (blocked - requires human)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `stale-invariants-skills-list.md` documents that invariants.md has stale skill lists (section 3.2), missing reactive conditions (section 2.2), and duplicate section numbering (1.6, 3.4). This is blocked because elves cannot modify invariants.md — included here for completeness and to surface it during prioritisation. The human should address this to prevent invariants from diverging further from reality.
