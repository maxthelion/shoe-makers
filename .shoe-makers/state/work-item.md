# Add tree evaluation trace to setup output

skill-type: implement

## What to build

Add a `evaluateWithTrace` function that wraps the existing `evaluate()` and records a human-readable trace of which conditions were checked and whether they passed or failed. Output this trace in setup's console log so both humans and agents can see *why* the tree chose a particular action.

## Context

The wiki spec (`wiki/pages/behaviour-tree.md`) describes the tree as deterministic — "re-evaluates from scratch each tick". Currently `evaluate()` in `src/tree/evaluate.ts` returns only `{ status, skill }`. There's no visibility into which conditions fired and which didn't.

The default tree (`src/tree/default-tree.ts:76-92`) has 9 condition-action pairs in a selector. Each `makeConditionAction` creates a sequence node with a condition check and an action.

## What to change

### 1. Add `evaluateWithTrace()` to `src/tree/evaluate.ts`

Create a new exported function alongside the existing `evaluate()`:

```typescript
export interface TraceEntry {
  condition: string;
  passed: boolean;
  skill: string;
}

export function evaluateWithTrace(
  node: TreeNode,
  state: WorldState
): { status: NodeStatus; skill: string | null; trace: TraceEntry[] } {
  // Walk the tree like evaluate(), but collect trace entries
  // For each sequence child of the root selector:
  //   - record the condition name
  //   - record whether the condition passed or failed
  //   - record the associated skill name
  // Return the full trace alongside the normal result
}
```

The trace should capture every condition-action pair in the root selector, showing the check result for each. Do NOT change the existing `evaluate()` function — add the new function alongside it.

### 2. Add `formatTrace()` helper

```typescript
export function formatTrace(trace: TraceEntry[]): string {
  // Format as:
  // ✗ tests-failing (testsPass=true)
  // ✗ unresolved-critiques (count=0)
  // ✓ candidates → prioritise
  // Use ✓ for the winning condition, ✗ for failed ones
  // Stop after the first ✓ (since selector stops at first success)
}
```

### 3. Update `src/setup.ts` to use the trace

In `main()`, change line 69 from:
```typescript
const { skill } = evaluate(defaultTree, state);
```
to:
```typescript
const { skill, trace } = evaluateWithTrace(defaultTree, state);
if (trace.length > 0) {
  console.log(`[setup] Tree trace:\n${formatTrace(trace)}`);
}
```

### 4. Write tests in `src/__tests__/evaluate.test.ts`

Add tests for `evaluateWithTrace`:
- Trace records all conditions up to and including the winning one
- Trace shows correct pass/fail for each condition
- `formatTrace` produces expected ✓/✗ output
- Trace works when the last (alwaysTrue) condition wins

## Patterns to follow

- The existing `evaluate()` function is the reference implementation — the trace version should produce identical `status` and `skill` results
- Keep it pure — no side effects in the trace function
- Use the existing `TreeNode` and `WorldState` types from `src/types.ts`

## What NOT to change

- Do NOT modify the existing `evaluate()` function
- Do NOT change `default-tree.ts`
- Do NOT change `types.ts` — put the `TraceEntry` type in `evaluate.ts`
- Do NOT modify wiki pages

## Tests to write

- `evaluateWithTrace` returns same skill as `evaluate` for all conditions
- Trace entries match the tree structure (9 entries for default tree when explore wins)
- `formatTrace` output contains ✓ and ✗ markers
- Trace stops recording after the winning condition
