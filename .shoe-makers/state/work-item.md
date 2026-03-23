# Consolidate invariants.test.ts temp-dir helpers into a single function

skill-type: health

## What to build

Replace the 4 individual temp-dir binding functions in `src/__tests__/invariants.test.ts` (lines 23-34) with a cleaner pattern. The current helpers are one-line wrappers that bind `tempDir` — replace them with direct calls passing `tempDir` inline, or use a single object to hold the bound helpers.

## What to change

### Option A: Remove binding helpers, pass tempDir inline

Replace:
```typescript
function writeWikiPage(name: string, title: string, category: string, body?: string) {
  return _writeWikiPage(tempDir, name, title, category, body);
}
function writeSourceFile(path: string, content?: string) {
  return _writeSourceFile(tempDir, path, content);
}
function writeTestFile(path: string, content?: string) {
  return _writeTestFile(tempDir, path, content);
}
function writeClaimEvidence(yaml: string) {
  return _writeClaimEvidence(tempDir, yaml);
}
```

With direct usage throughout the file: `_writeWikiPage(tempDir, ...)`, `_writeSourceFile(tempDir, ...)`, etc.

Then rename the imports to drop the underscore prefix:
```typescript
import { writeWikiPage, writeSourceFile, writeTestFile, writeClaimEvidence } from "./test-utils";
```

## What NOT to change

- Do NOT change test logic or expectations
- Do NOT change `test-utils.ts`
- Do NOT change other test files
- Do NOT modify any non-test source files

## Tests to verify

- `bun test src/__tests__/invariants.test.ts` — same test count, all pass
- `bun test` — full suite passes
