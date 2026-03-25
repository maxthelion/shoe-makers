# Work Item: Add drift-prevention test for shift-log-parser TITLE_TO_ACTION consistency

skill-type: test

## What to build

A test that verifies the shift-log-parser's `TITLE_TO_ACTION` recognizes all action titles that `generatePrompt` produces. This catches the exact class of bug where `continue-work` was missing from the parser.

## How it works

1. For each `ActionType`, generate the prompt using `generatePrompt(action, state)`
2. Extract the title (first line starting with `#`)
3. Format it as a shift log entry: `"- Action: <title without #>"`
4. Pass it through `parseShiftLogActions`
5. Assert the parser recognizes it and returns the correct action name

## Relevant code

- `src/prompts/index.ts:15-55` — `generatePrompt` produces prompts for all 12 action types
- `src/log/shift-log-parser.ts:6-18` — `TITLE_TO_ACTION` mapping for the parser
- `src/log/shift-log-parser.ts:29-46` — `parseShiftLogActions` function
- `src/prompts/helpers.ts:15-28` — the other `TITLE_TO_ACTION` mapping
- `src/__tests__/test-utils.ts` — `makeState` helper for building test states

## Where to add the test

Add to `src/__tests__/shift-log-parser.test.ts`, in a new describe block:

```typescript
describe("TITLE_TO_ACTION drift prevention", () => {
  test("parseShiftLogActions recognizes all prompt titles", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      const title = prompt.split("\n")[0].replace(/^#\s*/, "");
      const logEntry = `- Action: ${title}`;
      const parsed = parseShiftLogActions(logEntry);
      expect(parsed.length).toBe(1);
    }
  });
});
```

You'll need to:
1. Import `generatePrompt` from `"../prompts"`
2. Import `makeState` from `"./test-utils"`
3. Define `allActions` (or import the list — check how other test files handle this)

Also combine with candidate #2: add a test for multiple non-contiguous review loops:

```typescript
test("counts multiple non-contiguous review loops", () => {
  const patterns = computeProcessPatterns([
    "critique", "fix-critique", "critique",
    "explore",
    "critique", "fix-critique", "critique",
  ]);
  expect(patterns.reviewLoopCount).toBe(2);
});
```

## What NOT to change

- Do not modify any source files
- Do not modify `src/prompts/helpers.ts` or `src/log/shift-log-parser.ts`
- Only add tests

## Decision Rationale

This test directly prevents the class of bug we fixed twice (continue-work missing from parser). It verifies end-to-end: prompt title → log entry → parser recognition. Combined with the review loop edge case test since both are small additions to the same test file.
