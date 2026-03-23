# Work Item: Add wiki-authority and invariant-suggestion instructions to prompts

## What

Add two prompt-level instructions to resolve the final 2 specified-only invariants:

1. **Wiki-wins-over-code**: Tell elves in the execute prompt that when wiki and code diverge, the newer change wins — never revert the wiki.
2. **Suggest-invariants**: Tell elves in the explore prompt that when they find code without a matching invariant, they should write a finding suggesting a new invariant.

## Changes

### `src/prompts.ts` — execute-work-item case

Add to the instructions:

```
When wiki and code diverge, check which changed more recently. If the wiki is newer, change code to match — never revert the wiki. The wiki is always the source of truth.
```

### `src/prompts.ts` — explore case

After the insights instruction, add:

```
If you find code that works but has no matching invariant in `.shoe-makers/invariants.md`, write a finding suggesting a new invariant for the human to review.
```

### `.shoe-makers/claim-evidence.yaml`

Add evidence patterns for both invariants.

### Tests

- Test execute prompt contains "never revert the wiki"
- Test explore prompt contains "suggesting a new invariant"
