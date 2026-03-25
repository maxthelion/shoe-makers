# Work Item: Add generatePrompt switch exhaustiveness test and innovation tier boundary tests

skill-type: test

## What to build

Two small test additions:

### 1. `generatePrompt` drift test in `src/__tests__/prompts.test.ts`

Verify that `generatePrompt` returns a non-empty string for all tree skills. The existing `allActions` array in this file already has all 12 types — just add a test:

```typescript
test("generatePrompt returns non-empty string for all actions", () => {
  const state = makeState();
  for (const action of allActions) {
    const prompt = generatePrompt(action, state);
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain("#"); // all prompts start with a heading
  }
});
```

### 2. `isInnovationTier` boundary test in `src/__tests__/prompts.test.ts`

The `determineTier` function uses `untestedCount >= 5` as a threshold. Test the boundary:

```typescript
test("innovation tier boundary: 4 untested is innovation, 5 is not", () => {
  const makeAssessment = (untested: number) => ({
    ...freshAssessment,
    invariants: { ...freshAssessment.invariants, implementedUntested: untested, specifiedOnly: 0 },
  });

  expect(isInnovationTier(makeAssessment(4))).toBe(true);
  expect(isInnovationTier(makeAssessment(5))).toBe(false);
});
```

You'll need to import `isInnovationTier` from `"../prompts/helpers"` if not already imported.

## What NOT to change

- Do not modify any source files
- Only add tests to `src/__tests__/prompts.test.ts`

## Decision Rationale

Candidate #1 is most impactful since typecheck isn't available in this environment, making runtime exhaustiveness verification important. Combined with candidate #3 (boundary test) since both are small additions to the same file. Candidate #2 deferred as lower priority.
