# Finding: Stale invariants reference removed verify model

## Issue

Two invariants in `.shoe-makers/invariants.md` are now specified-only (no matching code):

1. **"commit or revert"** (architecture group) — claims the system commits or reverts based on a verification result
2. **"Verification has already caught and reverted bad work"** (what-a-user-can-do group) — claims verification catches and reverts bad work

## Why they're stale

These invariants described the old tick-type model where a dedicated `verify` skill would:
- Check if tests pass after work
- Return a `Verification` result with `action: "commit" | "revert"`
- The scheduler would then commit or revert based on this result

The `Verification` type, `PriorityList` type, and `skills/verify.ts` were removed as dead code (they were never called by production code). The system's actual quality gate is:

1. The elf commits directly
2. The behaviour tree detects unreviewed commits on the next tick
3. A different elf performs adversarial review (critique action)
4. Critique findings block new work until the issues are fixed

There is no automated commit/revert — review happens after the fact through the critique cycle.

## Suggested updates

The human should update these invariants to match the current architecture. Possible replacements:

- "commit or revert" → "Unreviewed commits trigger adversarial review on the next tick"
- "Verification has caught and reverted bad work" → "Cross-elf adversarial review catches quality issues through the critique/fix-critique cycle"

## Note

`.shoe-makers/invariants.md` is human-only — elves cannot modify it directly. This finding surfaces the gap for human review.

## Status

Resolved.
