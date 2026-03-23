# Make ACTION_TO_SKILL_TYPE exhaustive with Record<ActionType, string | undefined>

skill-type: improve

## Problem

`src/prompts.ts` line 12 defines `ACTION_TO_SKILL_TYPE` as `Partial<Record<ActionType, string>>`. If a new action type is added to the `ActionType` union in `src/types.ts`, TypeScript won't flag that it's missing from this map. Changing to `Record<ActionType, string | undefined>` with explicit entries for all 9 action types makes the mapping exhaustive and type-safe.

## Exactly what to change

In `src/prompts.ts` lines 12-16, change:

```typescript
export const ACTION_TO_SKILL_TYPE: Partial<Record<ActionType, string>> = {
  "fix-tests": "fix",
  "execute-work-item": "implement",
  "dead-code": "dead-code",
};
```

To:

```typescript
export const ACTION_TO_SKILL_TYPE: Record<ActionType, string | undefined> = {
  "fix-tests": "fix",
  "execute-work-item": "implement",
  "dead-code": "dead-code",
  "fix-critique": undefined,
  "critique": undefined,
  "review": undefined,
  "inbox": undefined,
  "prioritise": undefined,
  "explore": undefined,
};
```

## What tests to write

No new tests needed — existing tests cover all action types. Run `bun test` and `npx tsc --noEmit` to confirm.

## What NOT to change

- Do NOT modify `src/types.ts`
- Do NOT modify test files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the runtime behaviour — only the type annotation
