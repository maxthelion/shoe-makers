# Add timeout to Wikipedia API fetch requests

skill-type: bug-fix

## Problem

`src/creative/wikipedia.ts` makes two sequential HTTP requests to the Wikipedia API in `fetchRandomArticle()` (lines 96-117) without any timeout. If Wikipedia becomes slow or unresponsive, the function hangs indefinitely, blocking the setup script and wasting the elf's shift time. The function already handles failures gracefully (falls back to `getRandomFallbackConcept()`), so a timeout just needs to trigger the existing error path.

## What to do

### 1. Add `AbortSignal.timeout()` to both fetch calls (src/creative/wikipedia.ts)

Line 96-98 — first fetch:
```typescript
const randomRes = await fetch(
  "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json",
  { signal: AbortSignal.timeout(10_000) }
);
```

Line 105-107 — second fetch:
```typescript
const extractRes = await fetch(
  `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json`,
  { signal: AbortSignal.timeout(10_000) }
);
```

Use 10 seconds as the timeout — generous enough for a normal response, short enough to not waste shift time.

### 2. Verify existing error handling covers timeout

The `catch` block at line 118-120 already catches any error and returns `getRandomFallbackConcept()`. An `AbortError` from timeout will be caught by this. No changes needed to error handling.

### 3. Run tests

Run `bun test src/__tests__/wikipedia.test.ts` and then `bun test` to verify all tests pass. The existing tests mock `globalThis.fetch` so the timeout signal won't affect them.

## What NOT to change

- Do not modify the fallback concepts corpus
- Do not change the Wikipedia API endpoints
- Do not add retry logic (the fallback is sufficient)
- Do not change `shouldIncludeLens()` or `getRandomFallbackConcept()`

## Decision Rationale

Candidate #1 (Wikipedia timeout) was chosen over #2 (init test gaps) because a hung fetch is an operational issue that affects production runs. The init test gap is a test accuracy issue that doesn't affect runtime behavior.
