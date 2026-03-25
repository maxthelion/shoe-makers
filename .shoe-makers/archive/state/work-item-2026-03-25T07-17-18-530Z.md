# Update branching-strategy.md to match current verification model

skill-type: doc-sync

## Context

The wiki page `wiki/pages/branching-strategy.md` line 37 says:

> → verification gates reject bad commits (revert)

This describes the old verification model where a dedicated `verify` skill would check tests and revert bad commits. That model was removed — the system now uses a cross-elf adversarial review cycle:

1. One elf commits work
2. Next tick, behaviour tree detects unreviewed commits
3. A different elf performs adversarial review (critique action)
4. If critique finds blocking issues, they must be fixed before new work starts

The finding at `.shoe-makers/findings/invariant-update-2026-03-25.md` documents this gap.

## What to change

In `wiki/pages/branching-strategy.md`, update line 37 from:

```
  → verification gates reject bad commits (revert)
```

to something like:

```
  → cross-elf adversarial review catches issues (critique cycle)
```

This should be a minimal, surgical change — just update the one line in the branch lifecycle diagram that references the old model. Do NOT rewrite the whole page.

## Files to modify

- `wiki/pages/branching-strategy.md` — update line 37

## Files NOT to modify

- `.shoe-makers/invariants.md` — human only
- `.shoe-makers/claim-evidence.yaml` — human only
- Any source files in `src/`

## Tests

No code changes, so no new tests needed. Run `bun test` to confirm nothing breaks.

## Why this matters

This is the wiki-side fix for the `verification.commit-or-revert` specified-only invariant. The claim-evidence.yaml maps this claim to source code containing `"commit"` and `"revert"` — once the wiki no longer describes commit-or-revert behaviour, the claim extraction pipeline should stop generating this claim. (Though the claim-evidence.yaml mapping itself may also need human updates.)

## Decision Rationale

Chose this over other candidates because:
- The two specified-only invariants are the highest-priority gaps flagged by the behaviour tree
- Candidates #2, #3, and #4 were already resolved by previous elves
- Candidate #5 (graph colouring insight) is speculative
- This is a concrete, low-risk doc change that brings the spec closer to matching the code
