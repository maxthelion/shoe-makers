# Add tests for prompts/helpers.ts tier determination

skill-type: test

## What to test

Add unit tests for the untested functions in `src/prompts/helpers.ts`.

### Priority 1: `determineTier()` (line 120-125)

```typescript
export function determineTier(assessment: WorldState["blackboard"]["assessment"]): TierInfo {
  const inv = assessment?.invariants;
  const untestedCount = inv?.implementedUntested ?? 0;
  const specOnlyCount = inv?.specifiedOnly ?? 0;
  return { hasGaps: specOnlyCount > 0 || untestedCount >= 5, specOnlyCount, untestedCount };
}
```

Test cases:
- `null` assessment → `{ hasGaps: false, specOnlyCount: 0, untestedCount: 0 }`
- `null` invariants → same
- specifiedOnly=1, untestedCount=0 → hasGaps=true
- specifiedOnly=0, untestedCount=4 → hasGaps=false
- specifiedOnly=0, untestedCount=5 → hasGaps=true (boundary)
- specifiedOnly=0, untestedCount=0 → hasGaps=false
- specifiedOnly=3, untestedCount=10 → hasGaps=true (both non-zero)

### Priority 2: `isInnovationTier()` (line 132-134)

```typescript
export function isInnovationTier(assessment: WorldState["blackboard"]["assessment"]): boolean {
  if (!assessment) return false;
  return !determineTier(assessment).hasGaps;
}
```

Test cases:
- `null` assessment → false
- Has gaps → false
- No gaps → true

### Priority 3: `findSkillForAction()` (line 59-70)

Test cases:
- No skills map → undefined
- Empty skills map → undefined
- Action with no skill mapping (e.g. "critique") → undefined
- Action with mapping (e.g. "fix-tests" → "fix") → finds the skill
- Action with mapping but skill not in map → undefined

### Priority 4: `formatTopGaps()`, `formatCodebaseSnapshot()`, `formatSkillCatalog()` (helper formatters)

Test each with null/empty inputs and typical inputs.

## Where to add tests

Add to the existing `src/__tests__/prompts.test.ts` file. Import the functions being tested.

## Patterns to follow

Look at existing tests in `prompts.test.ts` — they use `makeState()` helper from test-utils and `freshAssessment`. Follow the same patterns.

## What NOT to change

- Do NOT modify `src/prompts/helpers.ts` or any other source files
- Do NOT modify `.shoe-makers/invariants.md`
- Only add tests

## Decision Rationale

The tier determination logic directly controls behaviour tree routing. `isInnovationTier()` is called at `src/tree/default-tree.ts:67` — if the boundary condition in `determineTier` is wrong, the system would route to `innovate` prematurely or never reach it. Direct unit tests for edge cases (especially the `untestedCount >= 5` boundary) add confidence.
