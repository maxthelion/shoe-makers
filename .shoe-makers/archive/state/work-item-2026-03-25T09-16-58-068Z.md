# Work Item: Fix missing `continue-work` in tick.ts and shift-log-parser, add drift tests

skill-type: bug-fix

## The bug

`src/scheduler/tick.ts:17-29` defines `SKILL_TO_ACTION` — a mapping from skill names (strings from the tree) to `ActionType` values. It is missing `"continue-work"`.

When the tree routes to `continue-work` (line 110 of `default-tree.ts`), `tick()` returns `action: null` because:
```typescript
const action = skill ? (SKILL_TO_ACTION[skill] ?? null) : null;
```

The shift runner (`src/scheduler/shift.ts:65`) then treats `action: null` as "sleep" and exits, silently dropping the continue-work action.

Similarly, `src/log/shift-log-parser.ts:6-18` has its own `TITLE_TO_ACTION` mapping that is missing `"Continue Partial Work"` → `"continue-work"`. The prompt title is "Continue Partial Work" (per `src/prompts/reactive.ts:72`).

Also check: `src/log/shift-log-parser.ts` may be missing `"Review Uncommitted Work"` → `"review"`. The prompt is at `src/prompts/reactive.ts` — check the exact title.

## Exact changes

### 1. Fix `src/scheduler/tick.ts`

Add `"continue-work": "continue-work"` to the `SKILL_TO_ACTION` map (after the `critique` entry, matching the order in `ActionType`):

```typescript
const SKILL_TO_ACTION: Record<string, ActionType> = {
  "fix-tests": "fix-tests",
  "fix-critique": "fix-critique",
  critique: "critique",
  "continue-work": "continue-work",  // ← ADD THIS
  review: "review",
  // ... rest unchanged
};
```

### 2. Fix `src/log/shift-log-parser.ts`

Add the missing entry to `TITLE_TO_ACTION`:

```typescript
[/Continue Partial Work/i, "continue-work"],
```

Also check if `"Review Uncommitted Work"` is already present. The prompts module generates a title starting with "Review Uncommitted Work" for the `review` action. If missing, add it too.

### 3. Add drift-prevention test in `src/__tests__/tick.test.ts`

Add a describe block that verifies `SKILL_TO_ACTION` covers all skills in the default tree. You'll need to export `SKILL_TO_ACTION` from `tick.ts` or test it indirectly.

**Indirect approach (preferred — no export changes needed):**
```typescript
test("tick returns non-null action for every skill in the tree", () => {
  // For each tree skill, construct a state that triggers it and verify action is non-null
});
```

The test in `tick.test.ts` at line 67-69 shows the `continue-work` case is NOT tested — add it:
```typescript
test("returns continue-work when hasPartialWork is true", () => {
  const result = tick(makeState({ hasPartialWork: true }));
  expect(result.action).toBe("continue-work");
  expect(result.skill).toBe("continue-work");
});
```

### 4. Add drift-prevention test in `src/__tests__/shift-log-parser.test.ts`

The `parseShiftLogActions` test at lines 40-60 ("handles all action types") should include a `"Continue Partial Work"` entry. Add it to the input and expected output.

## Patterns to follow

- See `src/__tests__/action-classification.test.ts` for the `extractSkills` helper pattern
- See `src/__tests__/permissions.test.ts` for the drift-prevention test pattern
- Keep tests focused — one assertion per test where possible

## What NOT to change

- Do not modify `src/tree/default-tree.ts`
- Do not modify `src/verify/permissions.ts`
- Do not modify `src/prompts/helpers.ts` (it already has the correct mapping)

## Decision Rationale

Candidates #1 and #3 are combined because the bug fix without drift prevention would leave the same class of bug possible in the future. Candidate #2 (shift-log-parser) is included as it's the same root cause. Candidate #4 (CHANGELOG) is deferred as lower priority.
