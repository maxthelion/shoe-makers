# Add insight count to WorldState

## Context

Wiki spec `creative-exploration.md` describes an insights workflow where explore writes insights to `.shoe-makers/insights/` and prioritise reviews them. The prompts already instruct this behaviour, but the world state doesn't surface whether insights exist. Adding an `insightCount` field enables future tree conditions or assessment reporting.

## What to change

### 1. `src/types.ts` — Add field to WorldState (after line 148)

```typescript
  /** Number of insight files in .shoe-makers/insights/ */
  insightCount: number;
```

### 2. `src/state/world.ts` — Add countInsights function and wire into readWorldState

Add this function (pattern: follow `countInboxMessages` on lines 32-39):

```typescript
async function countInsights(repoRoot: string): Promise<number> {
  try {
    const files = await readdir(join(repoRoot, ".shoe-makers", "insights"));
    return files.filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
}
```

Wire it into the `Promise.all` on line 144 and add `insightCount` to the return object on line 157.

### 3. Tests — Update `src/__tests__/world.test.ts`

Add a test that:
- Creates a temp dir with `.shoe-makers/insights/` containing a few `.md` files
- Calls the counting function (or `readWorldState`) and verifies the count
- Verifies 0 when directory is empty or doesn't exist

Also update any `makeWorldState()` helpers in test files that construct WorldState objects to include `insightCount: 0`.

### 4. Update `src/__tests__/setup.test.ts` and `src/__tests__/evaluate.test.ts`

Any `makeWorldState()` or `makeState()` helper that constructs a full WorldState needs `insightCount: 0` added.

## Pattern to follow

Follow the exact pattern used for `countInboxMessages` (lines 32-39 of `src/state/world.ts`) — same structure, same error handling. For the WorldState type, follow the pattern of existing number fields like `inboxCount` and `unresolvedCritiqueCount`.

## What NOT to change

- Do NOT add insight-based conditions to the behaviour tree yet
- Do NOT modify prompts.ts
- Do NOT modify wiki pages or invariants
- Keep it minimal: just add the data field, wire it in, and test it
