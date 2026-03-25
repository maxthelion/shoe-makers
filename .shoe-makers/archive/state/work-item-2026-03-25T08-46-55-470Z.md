# Add config edge case tests for enabled-skills parsing

skill-type: test-coverage

## What to do

Add tests for `enabled-skills` parsing edge cases in `src/__tests__/config.test.ts`. The `.filter(Boolean)` call handles most edge cases, but we should verify this with explicit tests.

## Relevant code

From `src/config/load-config.ts:102-104`:
```typescript
enabledSkills: raw["enabled-skills"]
  ? raw["enabled-skills"].split(",").map((s) => s.trim()).filter(Boolean)
  : null,
```

## Tests to add

Add to the existing `describe("loadConfig", ...)` block in `src/__tests__/config.test.ts`:

1. **Trailing comma**: `"enabled-skills: fix-tests,implement,"` → should give `["fix-tests", "implement"]` (trailing comma filtered)
2. **Extra whitespace**: `"enabled-skills:   fix-tests ,  implement  "` → should give `["fix-tests", "implement"]`
3. **Single skill**: `"enabled-skills: fix-tests"` → should give `["fix-tests"]`

## Patterns to follow

Look at the existing config test structure: each test creates a temp dir, writes a config file, calls `loadConfig()`, asserts the result. Use the same `tempDir` variable and `beforeEach`/`afterEach` pattern.

## What NOT to change

- Do NOT modify `src/config/load-config.ts`
- Do NOT modify `.shoe-makers/invariants.md`

## Decision Rationale

Simple, focused tests that verify parsing correctness. Low risk, adds confidence. Chosen over schedule tests (already well-covered) and CHANGELOG check (low impact).
