# Add edge case test for readWikiOverview frontmatter stripping

skill-type: test

## What to build

Add a test to `src/__tests__/format-action.test.ts` (the file created earlier this shift) that covers the frontmatter stripping edge case in `readWikiOverview`.

### The code under test

`src/scheduler/format-action.ts:58`:
```typescript
const stripped = content.replace(/^---[\s\S]*?---\n*/, "");
```

### Test to add

Inside the existing `describe("readWikiOverview")` block, add:

```typescript
test("strips frontmatter but preserves content without frontmatter", async () => {
  // File with no frontmatter at all
  const pagesDir = join(tempDir, "wiki", "pages");
  await mkdir(pagesDir, { recursive: true });
  await writeFile(join(pagesDir, "architecture.md"), "# No Frontmatter\nJust content.");
  const result = await readWikiOverview(tempDir);
  expect(result).toContain("# No Frontmatter");
  expect(result).toContain("Just content.");
});
```

### What NOT to change

- Do not modify `src/scheduler/format-action.ts`
- Do not modify other test files
- Only add to the existing readWikiOverview describe block

## Decision Rationale

Candidate #2 is the most concrete and testable. Candidates #1 and #4 are about the insight file which the evaluate-insight action should handle. Candidate #3 is a process issue better documented in known-issues than coded.
