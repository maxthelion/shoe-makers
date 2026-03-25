# Work Item: Fix missing `continue-work` in run-skill.ts + add drift test + deduplicate extractSkills

skill-type: bug-fix

## The bugs

### Bug: `run-skill.ts` missing `continue-work` case

`src/scheduler/run-skill.ts:15-53` has a switch on `ActionType` that is missing `"continue-work"`. Falls through to `default: return "Unknown action: continue-work"`.

### Code smell: `extractSkills` duplicated in 3 test files

`extractSkills(node: TreeNode): Set<string>` is duplicated in:
- `src/__tests__/action-classification.test.ts`
- `src/__tests__/permissions.test.ts`
- `src/__tests__/tick.test.ts`

Should be in `src/__tests__/test-utils.ts` alongside `makeState` and `emptyBlackboard`.

## Exact changes

### 1. Fix `src/scheduler/run-skill.ts`

Add after the `case "review":` block (around line 31):

```typescript
case "continue-work":
  return "Action: continue-work — elf should read partial-work.md and resume where the previous elf left off.";
```

### 2. Extract `extractSkills` to `src/__tests__/test-utils.ts`

Add to test-utils.ts:

```typescript
import type { TreeNode } from "../types";

/** Recursively extract all unique skill names from a tree node */
export function extractSkills(node: TreeNode): Set<string> {
  const skills = new Set<string>();
  if (node.type === "action" && node.skill) {
    skills.add(node.skill);
  }
  if (node.children) {
    for (const child of node.children) {
      for (const s of extractSkills(child)) {
        skills.add(s);
      }
    }
  }
  return skills;
}
```

Then update the 3 test files to import from test-utils instead of defining locally.

### 3. Add test + drift prevention in `src/__tests__/run-skill.test.ts`

Add a test for continue-work:
```typescript
test("returns descriptive message for continue-work", async () => {
  const result = await runSkill(tempDir, "continue-work");
  expect(result).toContain("continue-work");
  expect(result).toContain("partial-work");
});
```

Add a drift-prevention test:
```typescript
test("returns non-Unknown message for every tree skill", async () => {
  // Set up minimal structure
  await mkdir(join(tempDir, "wiki", "pages"), { recursive: true });
  await mkdir(join(tempDir, "src"), { recursive: true });
  await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
  await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });

  const treeSkills = extractSkills(defaultTree);
  for (const skill of treeSkills) {
    const result = await runSkill(tempDir, skill);
    expect(result).not.toContain("Unknown action");
  }
});
```

## What NOT to change

- Do not modify `src/tree/default-tree.ts`
- Do not modify `src/verify/permissions.ts`
- Do not modify `src/scheduler/tick.ts` (already fixed)

## Decision Rationale

Candidates #1 and #2 combined as same root cause. Candidate #3 included because extractSkills is used in the new drift test and should be in test-utils for all consumers.
