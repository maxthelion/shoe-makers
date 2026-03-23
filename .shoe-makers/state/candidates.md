# Candidates

## 1. Shift Log Summary Report — Make Morning Review Delightful
**Type**: improve
**Impact**: high
**Reasoning**: Currently, humans must read 10-20 commit messages and scan shift logs to understand what happened overnight. The shift log (`src/log/shift-log.ts`) records *what happened* but not *why it matters*. A generated summary section at the end of each shift — categorizing commits by type, highlighting decisions made by prioritise elves, and surfacing patterns ("3 health improvements, 2 succeeded") — would make morning review 50% faster. `wiki/pages/observability.md` describes shift logs but doesn't specify human-friendly summarization. Files: `src/log/shift-log.ts`, new `src/log/shift-summary.ts`.

## 2. Insight Lifecycle Test Coverage
**Type**: test
**Impact**: medium
**Reasoning**: `wiki/pages/creative-exploration.md` describes the full insight lifecycle: explore creates insights with Wikipedia lens, prioritise reads and promotes/reworks/dismisses them, promoted insights become work items. The Wikipedia fetch (`src/creative/wikipedia.ts`) and prompt integration (`src/prompts/three-phase.ts`) are implemented, but there are **no tests** verifying that insights flow correctly through the promote/rework/dismiss cycle. This is a core feature with zero test coverage on its lifecycle. Files: new `src/__tests__/insights.test.ts`.

## 3. Prioritise Decision Rationale Capture
**Type**: improve
**Impact**: medium
**Reasoning**: When the prioritise elf picks a work item from candidates, the *decision rationale* is lost — which candidates were considered, why this one was chosen, what trade-offs were made. Extending `work-item.md` to include a reasoning section (and surfacing it in the shift log) would let humans and future elves understand prioritisation patterns. This enables tuning the prioritise prompt over time based on evidence rather than guessing. Files: `src/prompts/three-phase.ts` (buildPrioritisePrompt), `src/scheduler/run-skill.ts`.

## 4. Tree Trace Persistence and Analysis
**Type**: improve
**Impact**: medium
**Reasoning**: `src/tree/evaluate.ts` has `evaluateWithTrace` which is logged during setup, but trace data is ephemeral — there's no persistent record. Over a shift, humans can't see patterns like "reactive tier never fires" (good) or "stuck in explore loop" (bad). Persisting traces and generating a simple analysis would let humans tune the tree and verify it's operating healthily. Files: `src/tree/evaluate.ts`, new `src/tree/analyze.ts`.

## 5. Prompts Test Consolidation (Health: 93/100)
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/prompts.test.ts` (363 lines) is the lowest-health file at 93/100. Lines 70-243 test `generatePrompt` with many similar cases that could be refactored into a data-driven test matrix using `describe.each`. This reduces duplication and makes test maintenance easier. Pure refactor, no behaviour change.
