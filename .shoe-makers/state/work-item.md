skill-type: octoclean-fix

# Reduce duplication in prompts.test.ts (health score 87 → target 95+)

## Context

`src/__tests__/prompts.test.ts` is the worst-scoring file at 87/100. It has 4 near-identical factory functions that each spread `freshAssessment` with minor overrides:

1. `makeStateWithProcessPatterns(reactiveRatio, reviewLoopCount)` at line 253 — creates state with processPatterns
2. `makeStateWithGaps(specifiedOnly, implementedUntested)` at line 298 — creates state with invariant counts
3. `makeAssessmentWithInvariants(specifiedOnly, implementedUntested)` at line 570 — creates assessment with invariant counts
4. `makeAssessmentWithUntested(untested)` at line 752 — creates assessment with untested count

Functions #2 and #3 do the same thing but at different nesting levels (state vs assessment). Function #4 is a subset of #3.

Also, `implementSkill`/`fixTestsSkill` are defined as skill objects in two separate places.

## What to change

### 1. Create one `makeAssessment` helper replacing #3 and #4

```typescript
function makeAssessment(overrides: Partial<Assessment["invariants"]> = {}): Assessment {
  return {
    ...freshAssessment,
    invariants: {
      ...freshAssessment.invariants!,
      ...overrides,
    },
  };
}
```

Replace:
- `makeAssessmentWithInvariants(x, y)` → `makeAssessment({ specifiedOnly: x, implementedUntested: y })`
- `makeAssessmentWithUntested(n)` → `makeAssessment({ implementedUntested: n, specifiedOnly: 0 })`

### 2. Create one `makeStateWith` helper replacing #1 and #2

```typescript
function makeStateWith(assessmentOverrides: Partial<Assessment> = {}): WorldState {
  return {
    ...makeState(),
    blackboard: {
      ...emptyBlackboard(),
      assessment: { ...freshAssessment, ...assessmentOverrides },
    },
  };
}
```

Replace:
- `makeStateWithProcessPatterns(ratio, loops)` → `makeStateWith({ processPatterns: { reactiveRatio: ratio, reviewLoopCount: loops, innovationCycleCount: 0 } })`
- `makeStateWithGaps(spec, untested)` → `makeStateWith({ invariants: { ...freshAssessment.invariants!, specifiedOnly: spec, implementedUntested: untested } })`

### 3. Deduplicate skill objects

Move `implementSkill` and `fixTestsSkill` to top-level constants (they're defined around lines 163-175 and again near 621-624). Keep one definition, reference it everywhere.

## Patterns to follow

- Look at `src/__tests__/test-utils.ts` for how `emptyBlackboard()` and `makeState()` work — follow the same convention
- Keep the new helpers in `prompts.test.ts` (they use `freshAssessment` which is local to that file)

## Tests

No new tests needed — this is pure refactoring. Run `bun test` to confirm nothing breaks. Run `bunx tsc --noEmit` to confirm types. The test count must stay the same (885).

## What NOT to change

- Do not move tests to different files (that's a separate structural-modularity task)
- Do not change test logic or assertions
- Do not delete or rename any `describe`/`test` blocks
- Do not modify source files — only `src/__tests__/prompts.test.ts`

## Decision Rationale

Candidate #1 chosen because:
- It's the most direct octoclean improvement (worst file at 87)
- Low risk — pure test refactoring, no source changes
- Candidates #2 is already partially addressed by the setup.ts split done in the structural-modularity inbox task
- Candidates #3 and #4 require human action (invariants.md is off-limits)
