# Update pure-function-agents.md scheduler section

skill-type: doc-sync

## Context

`wiki/pages/pure-function-agents.md` lines 41-51 describe the scheduler's job:

> After an agent exits, the scheduler handles all side effects:
> 1. Commit the agent's changes to the shoemakers branch
> 2. Run tests against the new state
> 3. If tests pass and the verification gate passes, create a PR or merge
> 4. If tests fail, revert the commit
> 5. Update the wiki with what happened

Steps 3 and 4 describe the old verification/revert model. The current system:
1. The elf commits directly during its invocation
2. Next tick, the behaviour tree detects unreviewed commits
3. A different elf performs adversarial review (critique action)
4. Critique findings must be resolved before new work starts

The branching-strategy.md has already been updated. This is the last wiki page referencing the old model.

## What to change

Replace lines 43-49 in `wiki/pages/pure-function-agents.md` with an accurate description of the current scheduler responsibilities:

```
After an agent exits, the scheduler handles all side effects:

1. Commit the agent's changes to the shoemakers branch
2. Push the branch to remote
3. Log what happened in the shift log
```

Remove references to "revert the commit", "verification gate", and "create a PR or merge" since these don't happen.

Also remove or update line 47-48 specifically. Keep it surgical — don't rewrite unrelated sections.

## Files to modify

- `wiki/pages/pure-function-agents.md` — update the scheduler section (lines 41-51)

## Files NOT to modify

- `.shoe-makers/invariants.md` — human only
- Any source files in `src/`

## Tests

No code changes, no tests needed. Run `bun test` to confirm nothing breaks.

## Decision Rationale

Chosen over permission tests (#2) and push (#3) because this directly addresses the stale verification model references documented in `invariant-update-2026-03-25.md`. This is the last wiki page needing the update.
