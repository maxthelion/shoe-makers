# Candidates

## 1. Fix missing `continue-work` in tick.ts SKILL_TO_ACTION map
**Type**: bug-fix
**Impact**: high
**Reasoning**: `src/scheduler/tick.ts:17-29` defines `SKILL_TO_ACTION` mapping skill names to `ActionType` values. It's missing `"continue-work"`. When the behaviour tree routes to `continue-work` (via `hasPartialWork` in `default-tree.ts:110`), `tick()` returns `action: null` (line 39: `SKILL_TO_ACTION[skill] ?? null`). The shift runner (`src/scheduler/shift.ts:65`) treats `action: null` as "sleep" and exits immediately — silently dropping the continue-work action. This is a real bug: partial work would never be continued when using `bun run shift` or `bun run tick`. The `bun run setup` path is unaffected because it uses `evaluateWithTrace` directly. Fix: add `"continue-work": "continue-work"` to the map.

## 2. Fix missing `continue-work` in shift-log-parser TITLE_TO_ACTION
**Type**: bug-fix
**Impact**: medium
**Reasoning**: `src/log/shift-log-parser.ts:6-18` has its own `TITLE_TO_ACTION` mapping that's separate from `src/prompts/helpers.ts:15-28`. The shift-log-parser version is missing `"Continue Partial Work"` → `"continue-work"`. This means: (a) `parseShiftLogActions` won't count continue-work actions in the shift log, (b) `computeProcessPatterns` won't include them in reactive ratio calculations, and (c) the process pattern counts used by the behaviour tree's `inReviewLoop` check may be slightly off. The prompts version in `helpers.ts` already has this mapping (line 19). Fix: add `[/Continue Partial Work/i, "continue-work"]` to the parser's list, and add `"continue-work"` to the `REACTIVE_ACTIONS` set in `action-classification.ts` if not already present, and add `"Review Uncommitted Work"` if also missing from the parser.

## 3. Add drift-prevention test for tick.ts SKILL_TO_ACTION
**Type**: test-coverage
**Impact**: high
**Reasoning**: The root cause of candidate #1 is that `SKILL_TO_ACTION` in `tick.ts` has no test ensuring it covers all skills in the default tree. A drift-prevention test (like those in `action-classification.test.ts` and `permissions.test.ts`) would catch future omissions. This test should verify that every skill in the default tree has a corresponding entry in `SKILL_TO_ACTION`, and vice versa. Similarly, the shift-log-parser `TITLE_TO_ACTION` should have a drift test against the prompts `TITLE_TO_ACTION`.

## 4. Sync CHANGELOG.md with continue-work feature addition
**Type**: doc-sync
**Impact**: low
**Reasoning**: The `continue-work` action type and `hasPartialWork` world state field were added but not reflected in CHANGELOG.md under [Unreleased]. Per invariant 3.5, "The CHANGELOG tracks user-facing changes in Keep a Changelog format." The addition of partial work detection and continuation is a user-visible behaviour change worth documenting.
