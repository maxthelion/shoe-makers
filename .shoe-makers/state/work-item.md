# Richer Shift Summary Description — Narrative Instead of Stats

skill-type: improve

## Context

The `summarizeShift()` function in `src/log/shift-summary.ts` (line 87-89) generates a description that's purely mechanical:
```typescript
const description = categories.length > 0
  ? `Improvements across ${categories.length} categories: ${categories.join(", ")}`
  : "No improvement actions taken";
```

This produces: "Improvements across 2 categories: fix, feature" — which tells you nothing about what actually happened. The shift dashboard and summary use this description directly.

## What to Build

Replace the `description` generation with a function that produces a narrative summary. It should describe the **arc** of the shift, not just list categories.

### Examples of good descriptions:
- "Started with 2 test fixes, then completed a feature implementation and review"
- "Focused entirely on fixing — 3 test fixes and 1 critique resolution"
- "Clean shift: 1 explore/prioritise/execute cycle completed successfully"
- "Productive shift: balanced work across fix, feature, and review"

### Implementation

Create a `buildDescription(steps, categories, traceAnalysis)` function in `src/log/shift-summary.ts` that:

1. Lists what happened in order: count actions by type ("2 test fixes", "1 feature implementation", "1 review")
2. Notes the arc if the shift started reactive then became stable (using traceAnalysis if available)
3. Mentions errors if any occurred ("1 error during prioritise")
4. Keeps it to one sentence, max two

Call it from `summarizeShift()` instead of the current inline description.

### Patterns to Follow

- Keep it pure — function takes data, returns string
- Follow the existing code style in `src/log/shift-summary.ts`
- The description is used in `formatDashboard()` and `formatShiftSummary()` in `src/log/shift-log.ts` — it appears after `>` in the dashboard blockquote

### Tests to Write

Update tests in `src/__tests__/shift-summary.test.ts`:
- The existing "produces a human-readable description" test should be updated to check for the new narrative format
- Add tests for different shift patterns: all-fix, mixed, empty, with errors

### What NOT to Change

- Do NOT modify `src/log/shift-log.ts` — the description field feeds into it automatically
- Do NOT modify the `ShiftSummary` interface — keep the same `description: string` field
- Do NOT modify wiki pages or invariants
- Do NOT modify test framework or config
