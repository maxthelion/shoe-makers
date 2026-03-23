# Candidates

## 1. Add tree trace to tick result for shift log visibility
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: The tick function in `src/scheduler/tick.ts` still uses the old `evaluate()` without trace. While setup now shows the trace in console output, the shift log (written by `src/shift.ts`) doesn't include why each tick chose its action. Adding the trace to `TickResult` and including it in the shift log's `formatTickLog` output would give the morning reviewer visibility into the decision chain for every tick, not just the initial setup. Files: `src/scheduler/tick.ts`, `src/log/shift-log.ts`.

## 2. Add retry with exponential backoff to shift push
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: The recently added git push in `src/shift.ts` does a single attempt and warns on failure. Network errors are transient — adding retry with exponential backoff (2s, 4s, 8s, 16s) as specified in CLAUDE.md's git operations section would make the push more reliable. The retry logic is simple: a for-loop with increasing sleep. Files: `src/shift.ts`.

## 3. Reduce shift-log.test.ts complexity with shared summary fixture
**Type**: health
**skill-type**: health
**Impact**: low
**Reasoning**: `src/__tests__/shift-log.test.ts` (score 95) defines the `summary` test fixture inside a describe block (line ~262) instead of at module level. The same summary shape is used across `formatDashboard` and `prependShiftDashboard` tests. Extracting it as a module-level constant would reduce duplication and slightly improve the health score. File: `src/__tests__/shift-log.test.ts`.
