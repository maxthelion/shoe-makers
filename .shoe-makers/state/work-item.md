# Add test for prioritise prompt skill-type metadata guidance

## Context

Commit d26c4e5 added `skill-type: <type>` guidance to the prioritise prompt in `src/prompts.ts:165`. The existing test at `src/__tests__/prompts.test.ts` line ~153 checks that the prioritise prompt mentions candidates.md and work-item.md, but doesn't verify the new skill-type guidance.

## What to do

Add a test in `src/__tests__/prompts.test.ts` in the `generatePrompt` describe block:

```typescript
test("prioritise prompt mentions skill-type metadata", () => {
  const prompt = generatePrompt("prioritise", makeState());
  expect(prompt).toContain("skill-type:");
});
```

## What NOT to change

- Do not modify `src/prompts.ts`
- Do not modify existing tests
