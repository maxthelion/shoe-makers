# Reduce prompts.test.ts complexity — improve health score

skill-type: octoclean-fix

## Context

`src/__tests__/prompts.test.ts` has the lowest health score (93/100) in the codebase. The file is 367 lines with many single-assertion tests that follow identical patterns.

## What to change

In the `generatePrompt` describe block (lines 70–187), there are ~20 individual tests that all follow the same pattern: call `expectPromptContains(action, makeState(), [...strings])`. These can be consolidated into a data-driven table, similar to what was already done for `tierCases` in the tier-switching section (lines 319–338).

### Pattern to follow

The `tierCases` array on line 319 is the model:
```typescript
const tierCases: [string, ActionType, () => WorldState, string[], string[]][] = [
  ["label", "action", () => state, ["contains"], ["not-contains"]],
  ...
];
for (const [label, action, stateFactory, contains, notContains] of tierCases) {
  test(label, () => { expectPromptContains(action, stateFactory(), contains, notContains); });
}
```

### Specifically

1. Convert the simple `expectPromptContains` tests in `generatePrompt` describe (lines 80–178) into a data-driven array
2. Keep tests that have custom logic (like the ordering test on line 119–126, the inbox count test on line 108–113, and the loop tests on lines 180–186) as standalone tests
3. Preserve all test names exactly — the data-driven format should produce the same test names

### Tests that can be consolidated (all use `expectPromptContains` with `makeState()`):
- fix-critique tests (lines 80-93): 4 tests
- review tests (lines 96-106): 3 tests
- critique test (line 115-117): 1 test
- execute-work-item test (line 128-130): 1 test
- prioritise tests (lines 132-138): 2 tests
- explore tests (lines 140-154): 4 tests
- execute test (line 156-158): 1 test
- dead-code tests (lines 160-174): 4 tests
- prioritise insights test (line 176-178): 1 test

### What NOT to change

- Do not change any test assertions or expected strings
- Do not change the `expectPromptContains` helper
- Do not modify other describe blocks (skill content, creative lens, tier switching, skill catalog)
- Do not change `makeState`, `makeSkill`, `makeSkillMap`, or `freshAssessment`
- Do not change files outside `src/__tests__/prompts.test.ts`

## Verification

- `bun test src/__tests__/prompts.test.ts` must pass with the same number of tests
- The file should be shorter (target: under 320 lines)
