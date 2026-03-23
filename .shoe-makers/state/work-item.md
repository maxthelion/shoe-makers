# Reduce prompts.test.ts complexity — improve worst health score (88→95+)

skill-type: health

## Context

`src/__tests__/prompts.test.ts` (459 lines, score 88/100) is the worst-scoring file in the codebase. The main issue is repetitive `expect(prompt).toContain(...)` patterns — many tests follow the exact same structure:

```typescript
test("X contains Y", () => {
  const prompt = generatePrompt("action", makeState());
  expect(prompt).toContain("string1");
  expect(prompt).toContain("string2");
  expect(prompt).not.toContain("string3");
});
```

## What to do

1. **Extract a helper** at the top of the test file:

```typescript
function expectPromptContains(
  action: ActionType,
  state: WorldState,
  contains: string[],
  notContains: string[] = [],
  skills?: Map<string, SkillDefinition>,
) {
  const prompt = generatePrompt(action, state, skills);
  for (const s of contains) expect(prompt).toContain(s);
  for (const s of notContains) expect(prompt).not.toContain(s);
  return prompt; // allow further assertions if needed
}
```

2. **Refactor the simplest tests first** — ones that are just `generatePrompt` + multiple `toContain` calls. For example, in the `describe("generatePrompt")` block (lines 60-200), many tests can become one-liners:

```typescript
// Before:
test("fix-tests prompt includes instructions", () => {
  const prompt = generatePrompt("fix-tests", makeState());
  expect(prompt).toContain("Fix Failing Tests");
  expect(prompt).toContain("bun test");
});

// After:
test("fix-tests prompt includes instructions", () => {
  expectPromptContains("fix-tests", makeState(), ["Fix Failing Tests", "bun test"]);
});
```

3. **Don't refactor tests that have complex setup or multi-step logic** — e.g. the `makeStateWithGaps` tests or the skill catalog tests that create custom skill maps. Those are fine as-is.

4. **Target**: reduce from 459 lines to ~350 lines while keeping all 520 tests passing.

## Patterns to follow

- Keep all existing `describe` blocks — don't merge test groups
- Keep all test names exactly the same — only change the body
- The helper should be in the test file, not a shared utility

## Tests to verify

Run `bun test` — all 520 tests must still pass. No new tests needed.

## What NOT to change

- Do not change `src/prompts.ts`
- Do not change test names or descriptions
- Do not remove any test cases
- Do not change the assertion logic (what's checked), only reduce the boilerplate
- Do not modify wiki, invariants, or other test files
