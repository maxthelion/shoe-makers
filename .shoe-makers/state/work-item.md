# Add dedicated test for inbox prompt with message count interpolation

## Context

The `inbox` prompt at `src/prompts.ts:116-119` dynamically interpolates `state.inboxCount`:

```typescript
case "inbox":
  return `# Inbox Messages\n\nThere are ${state.inboxCount} message(s) in \`.shoe-makers/inbox/\`. Read them, do what they ask, commit your work, then delete the message files.${OFF_LIMITS}`;
```

No dedicated test verifies that the count is correctly interpolated into the output.

## What to do

Add a test in `src/__tests__/prompts.test.ts` within the `generatePrompt` describe block:

```typescript
test("inbox prompt includes message count from state", () => {
  const state = makeState();
  state.inboxCount = 5;
  const prompt = generatePrompt("inbox", state);
  expect(prompt).toContain("5 message(s)");
});
```

Run `bun test` to confirm.

## What NOT to change

- Do not modify `src/prompts.ts`
- Do not modify existing tests
