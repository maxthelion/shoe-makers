skill-type: bug-fix

# Fix getFrontmatterField to strip YAML quotes

## Wiki Spec

From `wiki/pages/wiki-as-spec.md`: Wiki pages use YAML frontmatter for metadata. The frontmatter parser should correctly handle standard YAML formatting including quoted strings.

## Current Code

`src/utils/frontmatter.ts:16` — `getFrontmatterField()` returns the raw value after the colon, including surrounding YAML quotes:
```typescript
const match = frontmatter.match(new RegExp(`^${escaped}:\\s*(.+)$`, "m"));
return match?.[1]?.trim();
```

If a YAML field uses quotes like `title: "Hello World"`, the function returns `"Hello World"` (with quotes) instead of `Hello World`.

This was discovered during the frontmatter deduplication in `src/creative/wikipedia.ts` — the `readLocalCorpus()` function had to add a manual `.replace(/^["']|["']$/g, "")` workaround because the utility doesn't strip quotes.

Current callers:
- `src/skills/assess.ts` — `category` and `status` fields (typically unquoted, no issue)
- `src/verify/extract-claims.ts` — `title` and `category` (typically unquoted, no issue)
- `src/creative/wikipedia.ts` — `title` and `used` (quotes cause issues, manually stripped)

## What to Build

1. Update `getFrontmatterField()` in `src/utils/frontmatter.ts` to strip surrounding single or double quotes from the returned value
2. Remove the manual quote-stripping workaround in `src/creative/wikipedia.ts:33`
3. Add a test in `src/__tests__/frontmatter.test.ts` for quoted values
4. Run `bun test` to confirm nothing breaks

## Patterns to Follow

The existing quote-stripping pattern from the old wikipedia.ts local parser: `.replace(/^["']|["']$/g, "")`

## Tests to Write

In `src/__tests__/frontmatter.test.ts`:
- `getFrontmatterField` returns unquoted value for `title: "Hello World"` → `Hello World`
- `getFrontmatterField` returns unquoted value for `title: 'Hello World'` → `Hello World`
- `getFrontmatterField` still works for unquoted values (existing test)

## What NOT to Change

- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any files outside `src/utils/frontmatter.ts`, `src/creative/wikipedia.ts`, and `src/__tests__/frontmatter.test.ts`

## Decision Rationale

This is a genuine bug — the YAML frontmatter parser doesn't handle quoted strings correctly. While it hasn't caused issues in most callers (wiki pages typically use unquoted values), it did cause test failures when the creative corpus was switched to use the shared utility. Fixing it at the source is better than requiring every caller to strip quotes.
