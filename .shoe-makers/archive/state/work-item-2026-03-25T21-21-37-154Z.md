# Add integration test for tick lifecycle

skill-type: test

## Context

The `tick()` function in `src/scheduler/tick.ts` is the core orchestration point — it takes a `WorldState`, evaluates the behaviour tree, and returns a `TickResult` with the chosen action. While the tree evaluator and individual prompts are well-tested, there's no test that exercises `tick()` itself with various world states.

## What to do

Create `src/__tests__/tick.test.ts` that tests the `tick()` function from `src/scheduler/tick.ts`.

### Tests to write

1. **Default state routes to explore** — A clean world state with no flags set should route to the `explore` action (the tree's fallback).

2. **Failing tests route to fix-tests** — When `assessment.testsPass` is false, the tick should route to `fix-tests` (highest priority reactive condition).

3. **Unresolved critiques route to fix-critique** — When `unresolvedCritiqueCount > 0` and tests pass, should route to `fix-critique`.

4. **Work item exists routes to execute-work-item** — When `hasWorkItem` is true (and no reactive conditions), should route to `execute-work-item`.

5. **Candidates exist routes to prioritise** — When `hasCandidates` is true (and no work item), should route to `prioritise`.

6. **Inbox messages route to inbox** — When `inboxCount > 0` (and no higher-priority reactive conditions), should route to `inbox`.

7. **Dead-code work-item routes to dead-code** — When `hasWorkItem` is true AND `workItemSkillType` is "dead-code", should route to `dead-code` (before generic work-item).

8. **Tick result has correct shape** — Every tick result should have `timestamp`, `branch`, `skill`, `action`, and `trace` fields.

9. **Trace captures all condition checks** — The trace should have entries for each condition the tree evaluated, showing which passed and which failed.

### Patterns to follow

Use the existing `makeState` helper from `./test-utils` to construct world states:
```typescript
import { tick } from "../scheduler/tick";
import { makeState, makeAssessment, makeStateWithAssessment } from "./test-utils";
```

Example test:
```typescript
test("default state routes to explore", () => {
  const state = makeState();
  const result = tick(state);
  expect(result.action).toBe("explore");
  expect(result.skill).toBe("explore");
  expect(result.trace.length).toBeGreaterThan(0);
});
```

For failing tests, use `makeStateWithAssessment`:
```typescript
const state = makeStateWithAssessment(makeAssessment({}, { testsPass: false }));
```

### What NOT to change

- Do NOT modify `src/scheduler/tick.ts` or any source files
- Do NOT touch `.shoe-makers/invariants.md`
- Do NOT modify existing test files
- Only create `src/__tests__/tick.test.ts`

## Decision Rationale

Chose candidate #2 (integration test for tick lifecycle) over error-path tests (#1) and doc-sync (#3) because: the tick function is the core orchestration point and testing it validates the entire tree->action pipeline end-to-end. This is the highest-value test gap — it ensures that changes to the default tree, state reading, or skill mapping don't silently break routing. Health is at 100 and the prompt encourages creative/improvement work — testing the core pipeline is more impactful than edge cases in wikipedia.ts.
