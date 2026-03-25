# Add missing action cases to run-skill dispatcher + shift orchestrator test coverage

skill-type: test

## Context

### Bug: run-skill.ts missing action cases

`src/scheduler/run-skill.ts` handles a switch over `ActionType` but is missing two cases that exist in the type definition (`src/types.ts:27-38`):

- `innovate` — should return a descriptive message like the other non-explore cases
- `evaluate-insight` — should return a descriptive message

These fall through to the `default` case returning "Unknown action: innovate" and "Unknown action: evaluate-insight", which is incorrect since they are valid, defined action types.

### Gap: shift orchestrator missing test coverage

`src/__tests__/shift.test.ts` has only 3 tests covering: action outcome, explore-then-action loop, and error outcome. Missing:

- **max-ticks outcome**: when explore keeps running and hits the maxTicks limit
- **sleep outcome**: when the tree returns no action (null action)
- **onTick callback**: verify it's called for each step

### Relevant code

**`src/scheduler/run-skill.ts`** — add cases for `innovate` and `evaluate-insight` after the existing `dead-code` case (line 39), before the `default` case (line 45). Follow the same pattern as existing cases:
```typescript
case "innovate":
  return "Action: innovate — elf should write a creative insight connecting a random concept to the system.";

case "evaluate-insight":
  return "Action: evaluate-insight — elf should read insight files and evaluate them constructively.";
```

**`src/__tests__/run-skill.test.ts`** — add two tests matching the existing pattern (lines 18-61):
```typescript
test("returns descriptive message for innovate", async () => {
  const result = await runSkill(tempDir, "innovate");
  expect(result).toContain("innovate");
});

test("returns descriptive message for evaluate-insight", async () => {
  const result = await runSkill(tempDir, "evaluate-insight");
  expect(result).toContain("evaluate-insight");
});
```

**`src/__tests__/shift.test.ts`** — add tests using the existing `mockStateSequence` and `noopLog` helpers, and the `emptyBlackboard`/`freshAssessment` test utils from `test-utils.ts`.

For max-ticks: create a state where tree always returns "explore", mock runSkill to succeed, set maxTicks to 2, verify outcome is "max-ticks" and steps.length is 2.

For sleep: mock the tree to return no action by providing a state that causes the tree to evaluate to null. Since the default tree always falls through to explore, you'll need to use a custom state or mock. Actually — looking at the shift code (line 65), `result.action` being falsy triggers the sleep path. The tick function returns `{ action: null }` when no tree node matches. Since the default tree has `explore` as always-true fallback, sleep can't happen in practice. Still worth testing with a mock.

For onTick: verify the callback receives each ShiftStep.

### What to build

1. Add `innovate` and `evaluate-insight` cases to `src/scheduler/run-skill.ts`
2. Add corresponding tests to `src/__tests__/run-skill.test.ts`
3. Add max-ticks, sleep, and onTick tests to `src/__tests__/shift.test.ts`
4. Run `bun test` to confirm all pass

### What NOT to change

- Do not modify the tree definition or types
- Do not modify any other source files
- Do not modify `.shoe-makers/invariants.md`
- Do not modify `.shoe-makers/state/` files (except this work-item)

## Decision Rationale

The missing `innovate` and `evaluate-insight` cases in run-skill.ts are a bug — valid action types silently falling to "Unknown action". This is higher priority than the other candidates (README doc-sync, etc.) because it affects correctness of the innovation pipeline. Combining it with shift test coverage maximises the impact of a single work item, since both are in the scheduler module and closely related. The other candidates (Wikipedia tests, health-regression tests, README sync) all turned out to already have good coverage when investigated.
