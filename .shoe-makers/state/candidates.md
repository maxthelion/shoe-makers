# Candidates

## 1. Insight Lifecycle Test Coverage
**Type**: test
**Impact**: medium
**Reasoning**: `wiki/pages/creative-exploration.md` describes the full insight lifecycle but there are no tests verifying the prioritise prompt includes insight-handling instructions or that the explore prompt includes the Wikipedia creative lens. Files: `src/prompts/three-phase.ts`, new `src/__tests__/insights.test.ts`.

## 2. Prioritise Decision Rationale Capture
**Type**: improve
**Impact**: medium
**Reasoning**: When the prioritise elf picks a work item from candidates, the decision rationale is lost. Adding a "## Decision Rationale" section instruction to the prioritise prompt in `src/prompts/three-phase.ts` would preserve this context. Low-risk change to prompt template. Files: `src/prompts/three-phase.ts`.

## 3. Export TraceAnalysis from shift-summary for External Consumers
**Type**: improve
**Impact**: low
**Reasoning**: The `TraceAnalysis` type in `src/log/shift-summary.ts` is not exported, making it unavailable to external code that might want to consume trace data (e.g. a future `bun run review:prepare` command). Simple one-word change. Files: `src/log/shift-summary.ts`.
