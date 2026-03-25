skill-type: implement

# Add review-loop circuit breaker to the behaviour tree

## Context

The behaviour tree's reactive zone can enter infinite loops: critique finds a blocking issue → fix-critique can't resolve it → critique fires again → repeat forever. The `processPatterns` on the assessment already track `reviewLoopCount` (detected in `src/log/shift-log-parser.ts` when critique/fix-critique alternate ≥3 times). But nothing in the tree uses this signal.

The process patterns are accessible at `state.blackboard.assessment?.processPatterns?.reviewLoopCount`.

## What to build

### File: `src/tree/default-tree.ts`

Add a new condition function:

```typescript
function inReviewLoop(state: WorldState): boolean {
  const loopCount = state.blackboard.assessment?.processPatterns?.reviewLoopCount ?? 0;
  return loopCount >= 3;
}
```

Add a new tree node that fires BEFORE the unresolved-critiques condition. When a review loop is detected, route to explore instead of continuing the critique/fix cycle:

```typescript
// In the defaultTree children array, insert after tests-failing:
makeConditionAction("review-loop-breaker", inReviewLoop, "explore"),
makeConditionAction("unresolved-critiques", hasUnresolvedCritiques, "fix-critique"),
```

This means: if we've been looping ≥3 times, break out and explore (which will produce new candidates and move the shift forward). The unresolved critiques will still be there on the next cycle, but the explore elf can surface them as candidates and the prioritise elf can write a more targeted work item.

### File: `src/__tests__/default-tree.test.ts`

Add tests:

1. When `processPatterns.reviewLoopCount >= 3` and `unresolvedCritiqueCount > 0`, the tree should select "explore" (circuit breaker fires before unresolved-critiques)
2. When `processPatterns.reviewLoopCount < 3` and `unresolvedCritiqueCount > 0`, the tree should select "fix-critique" (normal behaviour)
3. When `processPatterns.reviewLoopCount >= 3` but tests are failing, the tree should still select "fix-tests" (tests-failing has higher priority)

Follow existing test patterns — create a WorldState with the appropriate fields and call `evaluate(defaultTree, state)`.

## What NOT to change

- Do not modify `src/log/shift-log-parser.ts` — the review loop detection logic is already correct
- Do not modify `src/types.ts` — processPatterns is already on the Assessment type
- Do not modify `.shoe-makers/invariants.md`
- Do not modify the three-phase orchestration (explore→prioritise→execute) — the circuit breaker just routes to the existing explore action

## Decision Rationale

Candidate #1 was chosen because:
- **Highest impact**: An infinite review loop would waste an entire shift — the circuit breaker prevents this
- **Low risk**: Only adds a new condition before an existing one — doesn't change any existing conditions
- **Uses existing infrastructure**: processPatterns already exists, just not wired to the tree
- Candidate #2 (typecheck) is lower priority — null handling works correctly
- Candidate #3 (README) is documentation work that doesn't affect system behaviour
