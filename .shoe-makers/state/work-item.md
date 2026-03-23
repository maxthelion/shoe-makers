# Fix stale JSDoc in default-tree.ts

## Context

`src/tree/default-tree.ts` lines 3-16 have a JSDoc comment showing the behaviour tree structure. The actual tree (lines 75-91) has 9 condition-action pairs, but the JSDoc only shows 8 — it's missing the `dead-code-work` node that was added between `inbox-messages` and `work-item`.

## Actual tree structure (lines 75-91)

```
Selector
├── [tests failing?] → fix-tests
├── [unresolved critiques?] → fix-critique
├── [unreviewed commits?] → critique
├── [uncommitted changes?] → review
├── [inbox messages?] → inbox
├── [dead-code work-item?] → dead-code       ← MISSING FROM JSDOC
├── [work-item.md exists?] → execute-work-item
├── [candidates.md exists?] → prioritise
└── [always true] → explore
```

## What to change

Edit `src/tree/default-tree.ts`, lines 3-16. Update the JSDoc comment to add the missing dead-code line and adjust formatting:

```typescript
/**
 * The behaviour tree — reactive conditions for urgent work,
 * three-phase orchestration for proactive work.
 *
 * Selector
 * ├── [tests failing?] → Fix tests
 * ├── [unresolved critiques?] → Fix critiques
 * ├── [unreviewed commits?] → Review adversarially
 * ├── [uncommitted changes?] → Review before committing
 * ├── [inbox messages?] → Handle inbox
 * ├── [dead-code work-item?] → Remove dead code
 * ├── [work-item.md exists?] → Execute the work item
 * ├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
 * └── [always true] → Explore: write candidates.md
 */
```

## What NOT to change

- Do NOT modify any tree logic (the `makeConditionAction` calls)
- Do NOT modify any condition functions
- Do NOT modify any test files
- This is a comment-only change
