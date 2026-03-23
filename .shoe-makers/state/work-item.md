# Add dedicated tests for fix-critique and review prompts

## Context

`src/__tests__/prompts.test.ts` has dedicated tests for most action types (fix-tests, critique, execute-work-item, dead-code, explore, prioritise, inbox) but `fix-critique` and `review` only have coverage via the `allActions` loop which checks off-limits notice and non-empty output.

## What to do

Add dedicated tests in `src/__tests__/prompts.test.ts` within the existing `generatePrompt` describe block:

### fix-critique tests
The prompt is at `src/prompts.ts:64-76`. Test that it:
- Mentions reading critique findings in `.shoe-makers/findings/`
- Mentions adding `## Status` with `Resolved.` to mark critiques as resolved
- Mentions running `bun test`
- Says NOT to delete critique files

### review tests
The prompt is at `src/prompts.ts:104-114`. Test that it:
- Mentions running `git diff`
- Mentions checking correctness, tests, and spec alignment
- Mentions committing if changes are good

## Patterns to follow

Follow existing test patterns:
```typescript
test("fix-critique prompt tells elf to mark findings resolved", () => {
  const prompt = generatePrompt("fix-critique", makeState());
  expect(prompt).toContain("Resolved");
});
```

## What NOT to change

- Do not modify `src/prompts.ts`
- Do not modify existing tests
- Do not modify wiki pages or invariants
