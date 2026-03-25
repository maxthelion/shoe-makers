# Add drift-prevention test: parseActionTypeFromPrompt covers all action types

skill-type: test-coverage

## What to do

Add a test that verifies `parseActionTypeFromPrompt()` can parse a prompt title for every ActionType. This ensures `TITLE_TO_ACTION` stays in sync with the ActionType union.

## Relevant code

### `src/prompts/helpers.ts`
- `TITLE_TO_ACTION` (not exported): array of `[RegExp, ActionType]` tuples mapping prompt titles to actions
- `parseActionTypeFromPrompt(promptText)`: parses the first line of a prompt to extract the ActionType
- `ACTION_TO_SKILL_TYPE` (exported): `Record<ActionType, string | undefined>` — already enforced by TypeScript

### `src/prompts/index.ts`
- `generatePrompt(action, state, ...)`: generates the full prompt for each action
- Each prompt starts with a title like `# Fix Failing Tests`, `# Explore — Survey and Write Candidates`, etc.

## Strategy

Since `TITLE_TO_ACTION` is not exported, test through the public API:
1. For each action type, generate a prompt using `generatePrompt()`
2. Parse the generated prompt with `parseActionTypeFromPrompt()`
3. Assert the parsed action matches the original action type

This tests the round-trip: generatePrompt → parseActionTypeFromPrompt. If any action is missing from `TITLE_TO_ACTION`, the parse will return null and the test will fail.

## Test code

Add to `src/__tests__/prompts.test.ts` (where prompt helpers are already tested). Use `makeState()` and `freshAssessment` from `test-utils.ts` to create a valid WorldState.

```typescript
import { generatePrompt, parseActionTypeFromPrompt } from "../prompts";

const ALL_ACTIONS: ActionType[] = [
  "fix-tests", "fix-critique", "critique", "continue-work",
  "review", "inbox", "execute-work-item", "dead-code",
  "prioritise", "innovate", "evaluate-insight", "explore",
];

describe("prompt round-trip: generate then parse", () => {
  const state = makeState(/* with assessment */);

  for (const action of ALL_ACTIONS) {
    test(`parseActionTypeFromPrompt recognises ${action} prompt`, () => {
      const prompt = generatePrompt(action, state);
      const parsed = parseActionTypeFromPrompt(prompt);
      expect(parsed).toBe(action);
    });
  }
});
```

Note: The state needs a valid assessment for `generatePrompt` to work. Use `makeState` from test-utils and ensure the blackboard has an assessment (use `freshAssessment` from test-utils).

## Patterns to follow

Look at existing tests in `src/__tests__/prompts.test.ts` for the import pattern and how `makeState`/`freshAssessment` are used.

## What NOT to change

- Do NOT modify `src/prompts/helpers.ts`
- Do NOT modify `src/prompts/index.ts`
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT export `TITLE_TO_ACTION` — test through the public API

## Decision Rationale

Chosen over candidate 2 (explore prompt tier tests) because it prevents a broader class of bug: any action missing from the title-to-action mapping silently breaks permission enforcement. Candidate 3 (pattern language insight) is speculative.
