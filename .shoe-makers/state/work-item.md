# Fix readWorkItemSkillType false-positive routing

## Context

`src/state/world.ts:141-150` contains `readWorkItemSkillType()` which detects whether a work item should be routed as a dead-code removal task. Currently it uses naive keyword matching:

```typescript
const header = content.split("\n").slice(0, 5).join("\n").toLowerCase();
if (header.includes("dead-code") || header.includes("dead code")) return "dead-code";
```

This causes false positives: a work item titled "Add tests for the dead-code prompt" gets routed as dead-code removal instead of execute-work-item.

## What to build

Replace the keyword matching with a structured approach. The work item should contain a `skill-type:` metadata line that explicitly declares which skill type it maps to.

### Changes to `src/state/world.ts`

Replace lines 141-150 with a function that looks for a `skill-type: dead-code` line in the work item's first 10 lines:

```typescript
export async function readWorkItemSkillType(repoRoot: string): Promise<string | null> {
  try {
    const content = await readFile(join(repoRoot, ".shoe-makers", "state", "work-item.md"), "utf-8");
    const lines = content.split("\n").slice(0, 10);
    for (const line of lines) {
      const match = line.match(/^skill-type:\s*(.+)$/i);
      if (match) return match[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}
```

### Changes to `src/prompts.ts`

In the `prioritise` prompt (around line 163), add guidance for the prioritiser elf to include `skill-type:` metadata in work items when the work maps to a specific skill:

After the line about writing `.shoe-makers/state/work-item.md`, add:
```
   - If the work maps to a specific skill type (e.g. dead-code, implement, fix), add `skill-type: <type>` on a line by itself near the top
```

### Tests to write

Add tests to `src/__tests__/world.test.ts`:

1. `readWorkItemSkillType returns "dead-code" when skill-type: dead-code is present`
2. `readWorkItemSkillType returns null when no skill-type line exists`
3. `readWorkItemSkillType does not false-positive on keyword "dead-code" in title`

### Patterns to follow

- Follow existing test patterns in `world.test.ts` (use `mkdtemp` for temp dirs, write files, call function)
- Keep the function simple — just regex matching, no complex parsing

## What NOT to change

- Do not change `src/tree/default-tree.ts` — the tree routing is correct, only the skill type detection is wrong
- Do not modify wiki pages or invariants
- Do not change existing passing tests
