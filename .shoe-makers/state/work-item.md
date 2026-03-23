# Work Item: Wire Wikipedia Creative Exploration into Explore Prompt

## Spec Reference

From `wiki/pages/creative-exploration.md`:

> During the explore phase, the system fetches a random Wikipedia article and presents it to the elf as a lens:
>
> *"Here is a random concept: [article summary]. Read the shoe-makers codebase. Does anything about this concept remind you of a pattern, approach, or problem in the codebase? Could any aspect of this concept inspire a better solution to something we're building? Think laterally — the connection might be abstract."*

From `.shoe-makers/invariants.md` section 2.5:

> - Some explore cycles include a random Wikipedia article as an analogical lens
> - Frequency is configurable via `insightFrequency` in config.yaml (default ~30% of explore cycles)

## Current State

- `src/creative/wikipedia.ts` has `fetchRandomArticle()` and `shouldIncludeLens(frequency)` — both complete, neither called.
- `src/prompts.ts:169-199` — the explore case returns a static prompt with no Wikipedia section.
- `src/setup.ts:220-228` — calls `generatePrompt(actionType, state, loadedSkills)` and wraps with "After exploring" footer.
- `src/config/load-config.ts` — does NOT currently parse `insightFrequency` from config.yaml.

## What to Build

### 1. Add `insightFrequency` to config loading

In `src/config/load-config.ts`, add `insightFrequency` to the Config type and parse it with default 0.3.

Follow the pattern used by `tickInterval` and `assessmentStaleAfter`:
- Add to the config object
- Parse from YAML with fallback to default
- Validate range (0.0 to 1.0)

### 2. Fetch Wikipedia article in `src/setup.ts`

In `setup.ts`, before generating the prompt for an explore action:
1. Call `shouldIncludeLens(config.insightFrequency)`
2. If true, call `await fetchRandomArticle()`
3. If article returned, pass it through to the prompt generator

Modify `generatePrompt` to accept an optional Wikipedia article parameter. When provided, append a creative lens section to the explore prompt:

```
## Creative Lens

A random concept for analogical thinking:

**{title}**

{summary}

If anything about this concept reminds you of a pattern, approach, or problem in the shoe-makers codebase, write an insight to `.shoe-makers/insights/YYYY-MM-DD-NNN.md` with:
- The Wikipedia article that prompted it
- The connection to the codebase
- A concrete proposal for what could change
- Why it would be better than the current approach

If no connection, move on — most creative prompts yield nothing, and that's fine.
```

### 3. Write tests

Add `src/__tests__/wikipedia.test.ts`:
- Test `shouldIncludeLens(0)` returns false, `shouldIncludeLens(1)` returns true
- Test `fetchRandomArticle()` returns null on network error (mock fetch to throw)
- Test `fetchRandomArticle()` returns null for stub articles (< 50 chars)
- Test `fetchRandomArticle()` returns `{ title, summary }` on success (mock both API calls)
- Test summary is truncated to 1000 chars

Add to `src/__tests__/prompts.test.ts`:
- Test explore prompt includes creative lens section when article provided
- Test explore prompt does NOT include lens section when no article

Add to `src/__tests__/config.test.ts`:
- Test `insightFrequency` defaults to 0.3
- Test `insightFrequency` is parsed from config.yaml
- Test invalid values are clamped/rejected

### Patterns to Follow

- `generatePrompt` signature: add optional parameter `article?: { title: string; summary: string }` — only used for explore action
- `setup.ts`: fetch happens in `main()`, passed down to `buildActionPrompt()`
- Config: follow exact pattern of `tickInterval` in `load-config.ts`
- Tests: follow patterns in existing `prompts.test.ts` and `config.test.ts`

### What NOT to Change

- Do NOT modify `wiki/pages/creative-exploration.md` — the spec is correct
- Do NOT modify `.shoe-makers/invariants.md` — only humans edit this
- Do NOT add LLM calls — this is deterministic (random + fetch)
- Do NOT make the Wikipedia fetch blocking — if it fails, skip the lens silently
- Do NOT change the explore prompt's existing 6-step survey instructions — append the lens section after them
