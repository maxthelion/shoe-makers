# Replace inline `as any` Assessment objects with makeAssessment() in prompt-helpers.test.ts

skill-type: octoclean-fix

## Context

The three worst-scoring files (all 94/100) are test files. `src/__tests__/prompt-helpers.test.ts` contains 15+ inline Assessment object literals cast with `as any`, even though `src/__tests__/test-utils.ts` already exports a `makeAssessment()` helper that creates properly typed Assessment objects.

## What to do

In `src/__tests__/prompt-helpers.test.ts`:

1. Replace every inline `{ testsPass: true, openPlans: [], ... } as any` Assessment object with a call to `makeAssessment()` from `test-utils.ts`.

2. The `makeAssessment()` function signature is:
   ```ts
   function makeAssessment(
     invariantOverrides: Partial<NonNullable<Assessment["invariants"]>> = {},
     extra: Partial<Assessment> = {},
   ): Assessment
   ```

3. For example, replace:
   ```ts
   const assessment = {
     testsPass: true,
     openPlans: [],
     findings: [],
     worstFiles: [],
     healthScore: 100,
     invariants: { specifiedOnly: 0, implementedUntested: 0, unspecified: 0, topSpecGaps: [] },
   } as any;
   ```
   with:
   ```ts
   const assessment = makeAssessment();
   ```

4. When invariant overrides are needed:
   ```ts
   const assessment = makeAssessment({ specifiedOnly: 3 });
   ```

5. When extra top-level fields are needed (like `healthScore: null`, `worstFiles`, `findings`):
   ```ts
   const assessment = makeAssessment({}, { healthScore: null });
   ```
   or:
   ```ts
   const assessment = makeAssessment({}, {
     findings: [{ file: "f.md", severity: "low" }],
     worstFiles: [{ path: "src/big.ts", score: 40 }],
     healthScore: 75,
   });
   ```

6. For the special case where `invariants: null`:
   ```ts
   const assessment = makeAssessment({}, { invariants: null });
   ```

7. The `makeAssessment` import is already available — `test-utils.ts` is imported at line 12:
   ```ts
   import { makeAssessment } from "./test-utils";
   ```
   Wait — check the current import. It may only import some helpers. Add `makeAssessment` to the import if missing.

## Which functions to target

The `as any` casts appear in tests for:
- `determineTier` (lines 23-102) — 7 occurrences
- `isInnovationTier` (lines 105-157) — 5 occurrences
- `formatTopGaps` (lines 159-208) — 3 occurrences
- `formatCodebaseSnapshot` (lines 210-241) — 3 occurrences

Each test creates a nearly identical Assessment object with minor field variations.

## Tests to verify

Run `bun test` — all 888 tests must pass. No test behavior should change; only the way test data is constructed changes.

## What NOT to change

- Do not modify `src/__tests__/prompt-builders.test.ts` or `src/__tests__/prompts-features.test.ts` in this work item — focus on one file for a clean, reviewable diff
- Do not modify `src/__tests__/test-utils.ts` unless the existing `makeAssessment` helper needs a minor tweak to support `invariants: null` (it should work via the `extra` parameter)
- Do not modify any production source files
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chosen over candidate #1 (split setup.ts) because setup.ts is already well-organized with clear function boundaries — splitting it into multiple files would be mostly cosmetic and higher risk for the orchestration entry point. The `as any` cleanup directly targets the worst-scoring file with a concrete, low-risk transformation that improves type safety.
