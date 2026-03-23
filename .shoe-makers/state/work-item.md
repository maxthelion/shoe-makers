# Add test verifying default-tree.ts JSDoc matches actual tree

## Context

We just fixed stale JSDoc in `src/tree/default-tree.ts` (commit 374cacf). To prevent future drift, add a test that reads the source file, extracts the skill names from the tree, and verifies each appears in the JSDoc comment.

## What to change

Add a test to `src/__tests__/default-tree.test.ts`:

```typescript
test("JSDoc comment lists all tree nodes", () => {
  // Read the source file to get the JSDoc
  const source = require("fs").readFileSync(
    require("path").join(__dirname, "../tree/default-tree.ts"),
    "utf-8"
  );
  const jsdocMatch = source.match(/\/\*\*[\s\S]*?\*\//);
  expect(jsdocMatch).not.toBeNull();
  const jsdoc = jsdocMatch![0];

  // Each tree child's name should appear in the JSDoc
  for (const child of defaultTree.children!) {
    expect(jsdoc).toContain(child.name);
  }
});
```

## Pattern to follow

Follow existing test style in `default-tree.test.ts` — import `defaultTree`, test structural properties.

## What NOT to change

- Do NOT modify `default-tree.ts` itself
- Do NOT modify any other test files
- Keep it simple — just verify node names appear in the JSDoc
