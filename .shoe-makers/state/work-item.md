# Persist Tree Traces to Shift Log and Enable Shift-Level Analysis

skill-type: improve

## Context

The behaviour tree evaluator (`src/tree/evaluate.ts`) already has `evaluateWithTrace()` and `formatTrace()` which produce structured trace data showing which conditions fired. Currently, `src/setup.ts` logs the trace to stdout during setup, but this data is ephemeral — it's not persisted anywhere.

The wiki spec (`wiki/pages/observability.md`) says:
> "The shift log is the primary interface between the elves and the human."
> "Patterns (what keeps failing, what's blocked, what's working) are invisible"

## What to Build

### 1. Persist trace data in shift log entries

In `src/log/shift-log.ts`, the `formatTickLog()` function already accepts an optional `trace?: string` parameter and includes it in the log entry. Verify this is being called with trace data from setup.ts. If not, wire it through.

### 2. Add trace accumulation to ShiftSummary

Extend `src/log/shift-summary.ts`:
- Add a `traces` field to `ShiftSummary` that collects all trace entries from the shift
- Add a `traceAnalysis` field with computed stats:
  - Which conditions fired and how many times
  - Average tree depth (how many conditions checked before finding work)
  - Whether reactive conditions (tests-failing, unresolved-critiques) ever fired

### 3. Include trace analysis in the shift dashboard

In `formatDashboard()` or `formatShiftSummary()` in `src/log/shift-log.ts`, append a "Tree Health" line showing:
- How many ticks reached the explore tier (depth > 4) vs. how many were handled reactively (depth <= 2)
- Example: `> Tree: 2 reactive, 6 routine, 2 explore`

### Patterns to Follow

- The `ShiftSummary` type is in `src/log/shift-summary.ts` — extend it there
- The `ShiftStep` type from `src/scheduler/shift.ts` is the input — check what trace data it carries
- Keep functions pure — `summarizeShift()` takes data in, returns summary out
- Follow existing formatting patterns in `formatDashboard()`

### Tests to Write

Add tests in `src/__tests__/shift-summary.test.ts` (or create it if needed):
- `summarizeShift` with steps that include trace data produces correct trace analysis
- `formatDashboard` includes tree health line when traces are present
- Edge case: empty traces, all reactive, all explore

### What NOT to Change

- Do NOT modify `src/tree/evaluate.ts` — the trace generation is fine as-is
- Do NOT modify wiki pages
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify the tree structure or conditions
- Keep the change scoped to shift-summary and shift-log formatting
