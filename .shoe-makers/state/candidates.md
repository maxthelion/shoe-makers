# Candidates

## 1. Refactor prompts.ts — extract explore/prioritise prompt builders
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/prompts.ts` (309 lines, health 95/100) has a massive `generatePrompt()` switch with the explore case spanning ~80 lines (228-307) and prioritise spanning ~40 lines (183-226). Tier-detection logic is duplicated between the two. Extracting `buildExplorePrompt()`, `buildPrioritisePrompt()`, and a shared `determineTier()` utility would cut the file to ~150 lines and make each prompt independently testable. Files: `src/prompts.ts`, `src/__tests__/prompts.test.ts`.

## 2. Shift log metrics — add weekly velocity and work-type aggregation
**Type**: implement
**Impact**: medium
**Reasoning**: Daily shift logs in `.shoe-makers/log/` are narrative markdown with no structured aggregation. Adding a `src/log/shift-metrics.ts` module that parses logs and produces a weekly summary (actions by type, success/error rates, lines changed) would make the morning review delightful instead of just informative. The spec's creative-exploration page envisions insights feeding back into priorities — metrics give the same feedback loop for productivity. New feature, no wiki page yet, but aligns with the "make the morning review delightful" innovation tier question.

## 3. Refactor prompts.test.ts — use snapshot testing for prompt content
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` (312 lines, health 95/100) uses 50+ manual `toContain` assertions on prompt strings. Any prompt wording change breaks many tests. Converting to Bun snapshot tests (`expect(prompt).toMatchSnapshot()`) would reduce test maintenance, keep the file under 100 lines, and still catch unintended prompt changes. The current tests don't verify logic — they verify exact text, which is what snapshots are designed for. Files: `src/__tests__/prompts.test.ts`.
