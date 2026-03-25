# Remove dead `skills/verify.ts` module

skill-type: dead-code

## What to remove

**`src/skills/verify.ts`** (84 lines) — a `verify()` function that is never called by any production code.

**`src/__tests__/verify.test.ts`** — tests for the dead module.

## Evidence this is dead code

`skills/verify.ts` is only imported in one place:
- `src/__tests__/verify.test.ts:5` — its own test file

No production code imports it. Not `setup.ts`, not `shift.ts`, not `tick.ts`, not any other module.

The system's actual verification mechanism is the adversarial review cycle in the behaviour tree (`unreviewed-commits → critique → fix-critique`), which is fully implemented and working.

## What NOT to remove

Keep these — they're part of the blackboard data layer and may be needed in the future:
- `Verification` type in `src/types.ts:124`
- `writeVerification()` in `src/state/blackboard.ts:87`
- `clearCurrentTask()` in `src/state/blackboard.ts:108`
- `clearPriorities()` in `src/state/blackboard.ts:115`
- Tests for these blackboard functions in `src/__tests__/blackboard.test.ts`

## Steps

1. Delete `src/skills/verify.ts`
2. Delete `src/__tests__/verify.test.ts`
3. Run `bun test` to confirm all remaining tests pass
4. Commit

## What NOT to change

- Do NOT modify `src/types.ts`
- Do NOT modify `src/state/blackboard.ts`
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any other source files

## Decision Rationale

Chose dead-code removal over test coverage candidates because:
- The guidance says "prefer improvement over tests" when invariants are met
- Dead code creates confusion about the verification architecture
- This is a clean, safe removal with no risk of breaking anything
- The module is definitively dead — zero production imports
