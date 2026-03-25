# Write finding: stale invariants reference old verify model

skill-type: doc-sync

## Context

Two invariants are now specified-only after the `Verification` type and `skills/verify.ts` were removed:
1. "commit or revert" (architecture group) — claims the system commits or reverts based on verification result
2. "Verification has already caught and reverted bad work" (what-a-user-can-do group) — claims verification catches bad work

These reference the old tick-type model where a dedicated verify skill would check work and return commit/revert. The current system uses the behaviour tree's adversarial review cycle: unreviewed commits trigger a critique action, critique findings block new work until fixed. There is no automated commit/revert — the elf commits directly, and the reviewer catches issues.

## What to do

Write a finding file at `.shoe-makers/findings/invariant-update-2026-03-25.md` suggesting the human update these invariants to match the current architecture. The finding should:

1. Explain which invariants are stale and why
2. Suggest updated claims that match the current critique/review cycle
3. Note that `.shoe-makers/invariants.md` is human-only — the elf cannot modify it

## What NOT to change

- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any `src/` files
- Do NOT modify wiki pages

## Decision Rationale

Addressing the specified-only invariant gap is the highest priority per the hierarchy of needs (Tier 1 hygiene). Since the elf can't modify invariants directly, writing a finding is the correct action to surface this for human review.
