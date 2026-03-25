# Candidates

## 1. Sync CHANGELOG.md with recent work
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Per invariant 3.5, "The CHANGELOG tracks user-facing changes in Keep a Changelog format." The CHANGELOG is missing several user-facing changes from recent sessions:
- **Added**: `continue-work` action type — partial work detection and continuation
- **Added**: `innovate` and `evaluate-insight` actions for creative exploration (per wiki spec `creative-exploration.md`)
- **Added**: `bun run setup` command for setup-based workflow
- **Added**: Review-loop breaker in behaviour tree
- **Added**: Innovation cycle cap (`max-innovation-cycles` config)
- **Added**: `insight-frequency` config for probabilistic creative lens during explore
- **Fixed**: Missing `continue-work` in `SKILL_TO_ACTION` (tick.ts) and `TITLE_TO_ACTION` (shift-log-parser.ts)
- **Fixed**: Missing `continue-work` in `runSkill` switch (run-skill.ts)
These are user-visible changes — new behaviour tree nodes, new config options, and bug fixes.

## 2. Add drift-prevention test for shift-log-parser TITLE_TO_ACTION
**Type**: test-coverage
**Impact**: medium
**Reasoning**: There are two separate `TITLE_TO_ACTION` mappings: one in `src/prompts/helpers.ts` (for parsing action types from prompts) and one in `src/log/shift-log-parser.ts` (for parsing actions from shift logs). Both map regex patterns to action names but can drift independently — as demonstrated by the `continue-work` bug where `helpers.ts` had it but `shift-log-parser.ts` didn't. A drift test should verify that every action recognized by `helpers.ts` is also recognized by `shift-log-parser.ts`, and that both match the tree's skill set.

## 3. Add test for `computeProcessPatterns` with multiple review loops
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/log/shift-log-parser.ts:51-79` has a `computeProcessPatterns` function that counts review loops. The existing tests (lines 63-102 of `shift-log-parser.test.ts`) cover basic cases but don't test multiple non-contiguous review loops in a single shift (e.g. `[critique, fix-critique, critique, explore, critique, fix-critique, critique]` should count as 2 review loops). This edge case matters because the review-loop-breaker in the tree (line 108 of `default-tree.ts`) fires at count >= 3.
