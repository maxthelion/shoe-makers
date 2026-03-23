# Work Item: Add insight lifecycle to explore and prioritise prompts

## What

Update the explore and prioritise prompts in `src/prompts.ts` to handle the insight lifecycle:
1. Explore prompt: already tells elves to write insights (from the creative lens section). Add a note that insights go to `.shoe-makers/insights/YYYY-MM-DD-NNN.md` in ALL explore runs, not just creative lens ones.
2. Prioritise prompt: tell the elf to read `.shoe-makers/insights/` and for each insight, decide: promote (create a candidate), defer (leave it), or dismiss (delete with a note in shift log).

## Why

Resolves 4 specified-only invariants:
- `creative-exploration.the-elf-reads-the-codebase-through-the-lens-and-writes-an-insight`
- `creative-exploration.insights-go-to-shoemakersinsights-separate-from-findings`
- `creative-exploration.insights-are-reviewed-by-a-future-prioritise-elf`
- `creative-exploration.the-separation-between-generating-insights-and-acting-on-them`

## What to Change

### `src/prompts.ts` — explore case

After step 7 (README check), add:

```
If you discover a creative insight — a non-obvious connection or a fundamentally better approach — write it to `.shoe-makers/insights/YYYY-MM-DD-NNN.md`. Insights are different from findings: they're proposals, not problems.
```

### `src/prompts.ts` — prioritise case

After step 2 ("read the relevant wiki pages"), add:

```
2b. Read `.shoe-makers/insights/` — for each insight, decide:
   - **Promote**: worth doing now → include as a candidate
   - **Defer**: interesting but not a priority → leave it
   - **Dismiss**: not applicable → delete it and note why in the shift log
```

### `.shoe-makers/claim-evidence.yaml`

Add evidence patterns for the 4 invariants using patterns that match the prompt text.

### Tests

Add to `src/__tests__/prompts.test.ts`:
- Test explore prompt mentions insights directory
- Test prioritise prompt mentions insights review (promote/defer/dismiss)

## What NOT to Change

- Do NOT modify wiki pages
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT add code that reads insight files programmatically (the elf reads them via the prompt)
