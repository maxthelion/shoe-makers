# Wire insight counting into world state

skill-type: implement

## Context

`src/setup.ts:208` hardcodes `insightCount: 0`. The insights directory (`.shoe-makers/insights/`) can contain insight files written during creative exploration, but the system never counts them. The `buildPrioritisePrompt` in `src/prompts.ts` already tells elves to read insights — but the world state doesn't reflect their existence.

## What to build

### 1. Add `countInsights()` to `src/state/world.ts`

Add a function similar to `countUnresolvedCritiques()`:

```typescript
export async function countInsights(repoRoot: string): Promise<number> {
  const insightsDir = join(repoRoot, ".shoe-makers", "insights");
  let count = 0;
  try {
    const files = await readdir(insightsDir);
    for (const file of files) {
      if (file.endsWith(".md")) count++;
    }
  } catch {}
  return count;
}
```

### 2. Wire it into `buildWorldState()` in `src/setup.ts`

- Import `countInsights` from `./state/world`
- Add `countInsights(repoRoot)` to the `Promise.all` array (line 183)
- Replace `insightCount: 0` (line 208) with the actual count

### 3. Tests

In `src/__tests__/` (new file or added to existing world state tests):

1. Test `countInsights` returns 0 for empty/missing directory
2. Test `countInsights` returns correct count when `.md` files exist
3. Test it ignores non-`.md` files

Use temp directories for isolation.

## What NOT to change

- Don't modify the behaviour tree — insight count is already in `WorldState`, it just needs to be populated
- Don't modify `buildPrioritisePrompt` — it already tells elves to read insights
- Don't add tree routing for insights — that's a separate future task
