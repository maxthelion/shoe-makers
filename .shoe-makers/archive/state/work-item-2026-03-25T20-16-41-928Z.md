# Deduplicate mock fetch helpers in wikipedia.test.ts

skill-type: octoclean-fix

## Context

`src/__tests__/wikipedia.test.ts` (328 lines) is one of the three worst-scoring files at 94/100. It has duplicated mock infrastructure:
- `originalFetch` saved at line 56 and line 139
- `mockFetch()` defined identically at lines 62-64 and 145-147 (with trivial `as any` difference)
- `afterEach` restore blocks at lines 58-60 and 141-143

## What to do

1. Hoist the shared mock infrastructure to file level, above the first `describe` block:

```ts
const originalFetch = globalThis.fetch;

function mockFetch(fn: (...args: Parameters<typeof fetch>) => Promise<Response> | never): void {
  globalThis.fetch = Object.assign(fn, { preconnect: originalFetch.preconnect }) as typeof fetch;
}

function mockSuccessfulFetch(): void {
  const longSummary = "A".repeat(200);
  let callCount = 0;
  mockFetch(async () => {
    callCount++;
    if (callCount === 1) {
      return new Response(JSON.stringify({
        query: { random: [{ title: "Mock Article" }] },
      }));
    }
    return new Response(JSON.stringify({
      query: { pages: { "1": { extract: longSummary } } },
    }));
  });
}
```

2. In the `fetchRandomArticle` describe block:
   - Remove the local `const originalFetch`, `mockFetch`, and `afterEach` — use the hoisted versions
   - Keep the `afterEach(() => { globalThis.fetch = originalFetch; })` in each describe that uses mocks

3. In the `fetchArticleForAction` describe block:
   - Remove the local `const originalFetch`, `mockFetch`, `mockSuccessfulFetch`, and `afterEach` — use the hoisted versions

4. Both describe blocks still need their own `afterEach` to restore fetch, but they can share the `originalFetch` reference and `mockFetch` function.

## Tests to verify

Run `bun test` — all 888 tests must pass unchanged.

## What NOT to change

- Do not modify any other test files
- Do not modify any production source files
- Do not modify `.shoe-makers/invariants.md`
- Do not change the test logic or assertions — only the mock infrastructure

## Decision Rationale

Chosen over candidate #1 (prompt-builders/prompts-features improvements) because this file has the most concrete, self-contained duplication that can be fixed in a single pass. The duplicate `mockFetch` definitions are a clear code smell that directly impacts the health score.
