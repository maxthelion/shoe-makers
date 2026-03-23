# Consolidate freshAssessment in shift.test.ts

skill-type: health

## Context

Commit b95cc8e extracted shared test helpers to `src/__tests__/test-utils.ts`, but `shift.test.ts` still has a local `freshAssessment` (lines 11-30) identical to the shared one in `test-utils.ts:14-30`. The file already imports `emptyBlackboard` from `./test-utils`.

Note: `prompts.test.ts` also has a local `freshAssessment` but it's intentionally different (non-zero invariant counts, healthScore: 40, populated topSpecGaps). Do NOT touch that file.

## What to do

1. In `src/__tests__/shift.test.ts`:
   - Add `freshAssessment` to the existing import from `./test-utils` (line 7)
   - Delete the `const now` line (line 11) — it's only used by the local freshAssessment
   - Delete the local `const freshAssessment: Assessment = { ... }` block (lines 13-30)
   - Remove the now-unused `Assessment` type import if it's no longer needed directly

2. Run `bun test` to confirm all 496 tests still pass.

## Pattern to follow

See how `evaluate.test.ts` and `tick.test.ts` already import `freshAssessment` from `./test-utils`:
```typescript
import { emptyBlackboard, freshAssessment, makeState } from "./test-utils";
```

## What NOT to change

- `src/__tests__/prompts.test.ts` — its `freshAssessment` is intentionally different
- Any file outside `src/__tests__/shift.test.ts`
- No new tests needed — this is a mechanical refactor
