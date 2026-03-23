# Candidates

## 1. Insight Lifecycle Test Coverage
**Type**: test
**Impact**: medium
**Reasoning**: `wiki/pages/creative-exploration.md` describes the full insight lifecycle: explore creates insights with Wikipedia lens, prioritise reads and promotes/reworks/dismisses them, promoted insights become work items. The Wikipedia fetch (`src/creative/wikipedia.ts`) and prompt integration (`src/prompts/three-phase.ts`) are implemented, but there are no tests verifying that the prioritise prompt correctly includes insight instructions or that insight files are read. This is a core feature with minimal test coverage on its lifecycle. Files: `src/prompts/three-phase.ts`, new `src/__tests__/insights.test.ts`.

## 2. Shift Log Summary Report — Richer Morning Review
**Type**: improve
**Impact**: high
**Reasoning**: The shift log records what happened but the dashboard description is still mechanical ("Improvements across 2 categories: fix, feature"). A richer `description` field could surface specific patterns: "Started reactive (2 test fixes), then stable exploration" or "3 explore/prioritise/execute cycles completed". This makes the morning review genuinely narrative instead of a stat dump. Files: `src/log/shift-summary.ts` (improve `description` generation in `summarizeShift`).

## 3. Prioritise Decision Rationale Capture
**Type**: improve
**Impact**: medium
**Reasoning**: When the prioritise elf picks a work item from candidates, the decision rationale is lost. Extending the prioritise prompt (`src/prompts/three-phase.ts:buildPrioritisePrompt`) to ask the elf to include a "## Decision Rationale" section in work-item.md would preserve this context for the morning review. Files: `src/prompts/three-phase.ts`.
