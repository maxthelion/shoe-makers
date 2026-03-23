# Test Insight Lifecycle in Prompts

skill-type: test

## Context

The insight lifecycle is a core feature described in `wiki/pages/creative-exploration.md`:
1. Explore elf creates insights in `.shoe-makers/insights/` using a Wikipedia creative lens
2. Prioritise elf reads insights and decides: Promote, Rework, or Dismiss
3. Promoted insights become work item candidates

The prompts for this are in `src/prompts/three-phase.ts`:
- `buildExplorePrompt()` includes a "Creative Lens" section with Wikipedia article (line 15-25)
- `buildExplorePrompt()` mentions writing insights to `.shoe-makers/insights/`
- `buildPrioritisePrompt()` includes insight evaluation instructions with Promote/Rework/Dismiss (line 113-118)

## What to Build

Add tests in `src/__tests__/prompts.test.ts` that verify the insight lifecycle paths are consistent:

1. Explore prompt with a Wikipedia article includes the article title and summary in "Creative Lens" section
2. Explore prompt without an article omits the Creative Lens section
3. Explore and prioritise prompts reference the same insight path (`.shoe-makers/insights/`)
4. The insight file naming format `YYYY-MM-DD-NNN.md` is mentioned in the explore prompt

## Patterns to Follow

Look at the existing test structure in `src/__tests__/prompts.test.ts`:
- The `generatePrompt` function dispatches to the right builder
- Tests use `[label, action, contains[]]` tuples for data-driven testing (lines 70-110)
- For state-dependent tests, see the "explore and prioritise tier switching" describe block (line 243+)

For testing the Wikipedia article parameter, you'll need to look at how `buildExplorePrompt` is called — it takes `(state, skills, article)`. The `generatePrompt` function in `src/prompts/generate.ts` passes the article through.

## Tests to Write

Add to the existing data-driven test array (around line 93-95 where explore tests are):
- `["explore prompt includes creative lens with Wikipedia article", "explore-with-lens", [...]]` — but this needs the article parameter, so it may need a separate test block

Or add a new describe block:
```typescript
describe("insight lifecycle in prompts", () => {
  test("explore prompt includes creative lens when article provided", () => { ... });
  test("explore prompt omits creative lens when no article", () => { ... });
  test("explore and prioritise reference same insight path", () => { ... });
});
```

## What NOT to Change

- Do NOT modify source code — only add tests
- Do NOT modify wiki pages or invariants
- Do NOT modify the prompt templates
- Keep tests focused on verifying existing behavior
