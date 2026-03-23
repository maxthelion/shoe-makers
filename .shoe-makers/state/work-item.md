# Reduce prompts.test.ts complexity with data-driven tier tests

skill-type: health

## What to build

Refactor the "explore and prioritise tier switching" describe block in `src/__tests__/prompts.test.ts` (lines 296-376) to use data-driven test cases. Convert the 12 individual tests into a parameterised loop to reduce repetition.

## What to change

### Replace individual tier tests with data-driven approach

Replace the individual test calls (lines 319-375) with a data-driven pattern:

```typescript
const tierCases: [string, ActionType, WorldState, string[], string[]][] = [
  ["explore shows Innovation tier when no gaps", "explore", makeStateWithGaps(0, 0), ["Innovation", "improvement-finding"], []],
  ["explore shows Hygiene/Implementation tier when spec gaps exist", "explore", makeStateWithGaps(5, 0), ["Hygiene / Implementation", "unimplemented spec claim"], []],
  // ... etc
];

for (const [label, action, state, contains, notContains] of tierCases) {
  test(label, () => {
    expectPromptContains(action, state, contains, notContains);
  });
}
```

Keep these tests that use different patterns and can't be easily parameterised:
- `"explore uses specifiedOnly count to determine tier"` (lines 351-359) — uses two prompts in one test
- `"prioritise prompt includes insight evaluation"` and `"prioritise prompt asks evaluator to engage critically"` — these use `makeState()` not `makeStateWithGaps()`

The goal is to reduce line count by ~30-40 lines while keeping the same test coverage and readability.

## Patterns to follow

- Use the existing `expectPromptContains` helper (defined at line 57)
- Keep test descriptions identical so test output is unchanged
- Use `for...of` loop pattern (already used in the file, e.g., line 71-77)

## What NOT to change

- Do NOT change any prompt generation code in `src/prompts.ts`
- Do NOT change test logic or expectations — only restructure the tests
- Do NOT remove any tests — test count must stay the same
- Do NOT modify `test-utils.ts`
- Do NOT change other test files

## Tests to verify

- Run `bun test src/__tests__/prompts.test.ts` — same number of tests must pass
- Run `bun test` — full suite must pass
