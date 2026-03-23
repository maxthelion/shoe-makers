# Candidates

## 1. Doc-sync: Update observability.md to Document Tree Trace Analysis
**Type**: doc-sync
**Impact**: medium
**Reasoning**: We just added tree trace analysis to `ShiftSummary` (TraceAnalysis type with reactive/routine/explore classification, condition fire counts, average depth). The wiki page `wiki/pages/observability.md` describes the shift log and dashboard but doesn't mention tree trace persistence or analysis. The spec should reflect this new capability so future elves know it exists. Files: `wiki/pages/observability.md`.

## 2. Insight Lifecycle Test Coverage
**Type**: test
**Impact**: medium
**Reasoning**: `wiki/pages/creative-exploration.md` describes the full insight lifecycle: explore creates insights with Wikipedia lens, prioritise reads and promotes/reworks/dismisses them, promoted insights become work items. The Wikipedia fetch (`src/creative/wikipedia.ts`) and prompt integration (`src/prompts/three-phase.ts`) are implemented, but there are no tests verifying that insights flow correctly through the promote/rework/dismiss cycle. This is a core feature with zero test coverage on its lifecycle. Files: new `src/__tests__/insights.test.ts`.

## 3. Shift Log Summary Report — Richer Morning Review
**Type**: improve
**Impact**: high
**Reasoning**: The shift log records what happened but not why it matters. The `ShiftSummary` now includes trace analysis, but the dashboard text is still mechanical ("Improvements across 2 categories: fix, feature"). A richer summary could categorize commits by type, highlight decisions made by prioritise elves, and surface patterns like "3 ticks spent reactive, then stable" — making the morning review genuinely informative. Files: `src/log/shift-log.ts`, `src/log/shift-summary.ts`.

## 4. Prioritise Decision Rationale Capture
**Type**: improve
**Impact**: medium
**Reasoning**: When the prioritise elf picks a work item from candidates, the decision rationale is lost — which candidates were considered, why this one was chosen, what trade-offs were made. Extending `work-item.md` to include a reasoning section (and surfacing it in the shift log) would let humans and future elves understand prioritisation patterns. This enables tuning the prioritise prompt over time based on evidence rather than guessing. Files: `src/prompts/three-phase.ts` (buildPrioritisePrompt).
