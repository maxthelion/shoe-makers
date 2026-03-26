skill-type: health

# Consolidate duplicated process-pattern computation into shared function

## Wiki Spec

`wiki/pages/observability.md` lines 19-30 describe the shift log and process patterns. The spec defines `computeProcessPatterns()` as extracting `reviewLoopCount`, `reactiveRatio`, and `innovationCycleCount` from shift logs. There's no spec requirement for two separate implementations.

## Current Code

Two functions compute the same metrics with identical logic:

1. `src/log/shift-summary.ts:256-285` — `analyzeProcessPatterns(steps: ShiftStep[])`: extracts action strings from `step.tick.action`, classifies reactive/proactive using `REACTIVE_ACTIONS`/`PROACTIVE_ACTIONS`, detects review loops (>=3 consecutive critique/fix-critique), returns `ProcessPatterns` (missing `innovationCycleCount`).

2. `src/log/shift-log-parser.ts:52-81` — `computeProcessPatterns(actions: string[])`: identical logic but operates on `string[]` instead of `ShiftStep[]`. Also counts `innovationCycleCount`.

Both import `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` from `src/log/action-classification.ts:1-5`.

The return types differ slightly:
- `shift-summary.ts` returns `ProcessPatterns` (has `reactiveTicks`, `proactiveTicks`, `reactiveRatio`, `reviewLoopCount` — no `innovationCycleCount`)
- `shift-log-parser.ts` returns `{ reactiveRatio, reviewLoopCount, innovationCycleCount }`

## What to Build

1. **Refactor `analyzeProcessPatterns` in `shift-summary.ts`** to extract action strings from steps first, then delegate to `computeProcessPatterns` from `shift-log-parser.ts`:
   ```typescript
   function analyzeProcessPatterns(steps: ShiftStep[]): ProcessPatterns {
     const actions = steps
       .map(s => s.tick.action)
       .filter((a): a is string => !!a);
     const patterns = computeProcessPatterns(actions);
     return {
       reactiveTicks: patterns.reactiveTicks ?? /* compute from actions */,
       proactiveTicks: patterns.proactiveTicks ?? /* compute from actions */,
       reactiveRatio: patterns.reactiveRatio,
       reviewLoopCount: patterns.reviewLoopCount,
     };
   }
   ```

2. **Extend `computeProcessPatterns` return type** in `shift-log-parser.ts` to also return `reactiveTicks` and `proactiveTicks` (it already computes them internally at lines 53-59, just doesn't return them).

3. **Update the `ProcessPatterns` type** in `shift-summary.ts:43-52` to include `innovationCycleCount` for consistency, or keep it separate if the `summarizeShift` caller doesn't need it.

4. **Remove the duplicated loop-counting and ratio logic** from `shift-summary.ts:256-285` so there's only one place to maintain the review-loop threshold.

## Patterns to Follow

- `src/log/action-classification.ts` already extracts shared constants — follow the same pattern of centralising shared logic
- `computeProcessPatterns` in `shift-log-parser.ts` is the more complete version (has `innovationCycleCount`), so it should be the canonical implementation
- Keep `analyzeProcessPatterns` as a thin adapter that maps `ShiftStep[]` → `string[]` → delegates
- The existing tests in `src/__tests__/shift-log-parser.test.ts` (20+ tests) and `src/__tests__/shift-summary.test.ts` (lines 223-294) must all continue to pass

## Tests to Write

No new tests needed — existing tests in both test files cover the behaviour. After refactoring, all existing tests should pass unchanged because the observable behaviour is identical. Run `bun test` to confirm.

If the `ProcessPatterns` type gains `innovationCycleCount`, add one test in `shift-summary.test.ts` confirming it's populated.

## What NOT to Change

- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any wiki pages
- Do NOT change the `computeProcessPatterns` logic itself — only centralise where it lives
- Do NOT change the review-loop threshold (>=3) — that's a separate design decision
- Do NOT change the `REACTIVE_ACTIONS` or `PROACTIVE_ACTIONS` sets
- Do NOT break the `getShiftProcessPatterns` function or its callers

## Decision Rationale

Candidate #1 (process-pattern tests) was invalidated — both functions already have comprehensive test coverage. Candidate #2 (`as any` casts) is cosmetic health with no functional impact. Candidate #3 addresses a real DRY violation: the review-loop detection logic (which is actively causing issues per `.shoe-makers/findings/review-loop-blocks-execution.md`) exists in two places. Consolidating means one place to understand, test, and eventually tune the threshold. This is a genuine improvement that makes the system more maintainable.
