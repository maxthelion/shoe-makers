# Export TraceAnalysis Type

skill-type: improve

## Context

The `TraceAnalysis` interface in `src/log/shift-summary.ts` (line 8) is not exported. External code that wants to type-check against trace analysis data (e.g. shift.ts, future review tooling) cannot import the type.

## What to Change

Add `export` to the `TraceAnalysis` interface declaration in `src/log/shift-summary.ts` line 8.

Change:
```typescript
export interface TraceAnalysis {
```

## Tests

Run `bun test` to confirm nothing breaks. No new tests needed — this is a type-only change.

## What NOT to Change

- Do NOT modify any other files
- Do NOT modify wiki pages or invariants

## Decision Rationale

Smallest useful change remaining. Dead code audit and config tests are lower priority and would take more time for less impact. This unblocks future tooling while being zero-risk.
