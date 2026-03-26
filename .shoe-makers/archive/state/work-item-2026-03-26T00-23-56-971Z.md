skill-type: implement

# Smart review-loop-breaker: route to prioritise when candidates exist

## Original Insight

"Quorum sensing" — the review-loop-breaker currently routes unconditionally to `explore`, which creates a stuck state when `candidates.md` already exists. When candidates exist but the system is in a review loop, the correct action is `prioritise` (consume the candidates) rather than `explore` (create new ones, overwriting existing).

## What to change

### 1. Split the review-loop-breaker into two nodes in `src/tree/default-tree.ts`

Replace the single `review-loop-breaker` node:
```typescript
makeConditionAction("review-loop-breaker", inReviewLoop, "explore"),
```

With two nodes in a sequence:
```typescript
// Review loop breaker: if in a review loop AND candidates exist, prioritise them
// otherwise if in a review loop, explore fresh
makeConditionAction("review-loop-with-candidates", (s) => inReviewLoop(s) && s.hasCandidates, "prioritise"),
makeConditionAction("review-loop-breaker", inReviewLoop, "explore"),
```

This preserves the breaker's priority (before unresolved-critiques) but routes more intelligently.

### 2. Update tests in `src/__tests__/default-tree.test.ts`

Add tests:
- When `reviewLoopCount >= 3` AND `hasCandidates: true`: tree selects `prioritise`
- When `reviewLoopCount >= 3` AND `hasCandidates: false`: tree selects `explore` (existing behaviour)
- When `reviewLoopCount < 3`: neither breaker node fires (existing behaviour)

### 3. Update tests in `src/__tests__/evaluate.test.ts`

Check existing test cases for the review-loop-breaker and ensure they still pass. Add a case for the new `review-loop-with-candidates` node.

## Patterns to follow

- Look at how other condition→action pairs work in `src/tree/default-tree.ts`
- The `makeConditionAction` helper creates a sequence of condition + action nodes
- Follow the existing test pattern in `src/__tests__/default-tree.test.ts` for tree evaluation tests

## What NOT to change

- Do not modify the tree evaluator (`src/tree/evaluate.ts`)
- Do not modify types
- Do not change the priority order of other tree nodes
- Do not add graduated thresholds (keep it simple — just check `hasCandidates`)
