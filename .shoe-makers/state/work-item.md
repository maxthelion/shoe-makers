# Add drift-prevention test: action-classification sets vs default-tree actions

skill-type: test-coverage

## What to do

Add a test that verifies `REACTIVE_ACTIONS` + `PROACTIVE_ACTIONS` from `src/log/action-classification.ts` cover exactly the set of all action types used in the default behaviour tree. This prevents silent drift when new actions are added.

## Relevant code

### Action classification (`src/log/action-classification.ts`)
```typescript
export const REACTIVE_ACTIONS = new Set(["fix-tests", "fix-critique", "critique", "continue-work", "review", "inbox"]);
export const PROACTIVE_ACTIONS = new Set(["explore", "prioritise", "execute-work-item", "dead-code", "innovate", "evaluate-insight"]);
```

### Default tree skills (`src/tree/default-tree.ts:107-121`)
The tree defines these skills: `fix-tests`, `explore`, `fix-critique`, `continue-work`, `critique`, `review`, `inbox`, `dead-code`, `execute-work-item`, `prioritise`, `evaluate-insight`, `innovate`, `explore`.

Note: `explore` appears twice (review-loop-breaker fallback + default). Only unique skills matter.

### ActionType (`src/types.ts:27-39`)
All 12 action types are defined as a union type.

## Exact test to write

Add to `src/__tests__/shift-summary.test.ts` (or create a new file `src/__tests__/action-classification.test.ts` if cleaner). The test should:

1. Import `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` from `../log/action-classification`
2. Import `defaultTree` from `../tree/default-tree`
3. Extract all unique skill names from the default tree (walk the tree recursively, collect `action.name` from all action nodes)
4. Assert the union of `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` equals the set of tree skills
5. Assert there's no overlap between `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS`

### Helper to extract skills from tree

```typescript
import type { TreeNode } from "../types";

function extractSkills(node: TreeNode): Set<string> {
  const skills = new Set<string>();
  if (node.type === "action") {
    skills.add(node.name);
  }
  if ("children" in node && node.children) {
    for (const child of node.children) {
      for (const s of extractSkills(child)) {
        skills.add(s);
      }
    }
  }
  return skills;
}
```

### Pattern to follow

Look at existing tests in `src/__tests__/shift-summary.test.ts` or `src/__tests__/default-tree.test.ts` for import/describe patterns. Use `describe`/`test`/`expect` as in other test files.

## What NOT to change

- Do NOT modify `src/log/action-classification.ts` — the constants are correct
- Do NOT modify `src/tree/default-tree.ts`
- Do NOT modify `src/types.ts`
- Do NOT modify `.shoe-makers/invariants.md`

## Decision Rationale

Chosen over candidate 2 (prompt builder tests) because it's smaller, more focused, and prevents a specific class of bug (action misclassification). Candidate 3 (doc-sync) is low-impact prose refinement.
