# Add missing test coverage for dead-code action in prompts.ts

## Context

The `generatePrompt` function in `src/prompts.ts` handles 9 action types. The test file `src/__tests__/prompts.test.ts` has an `allActions` array (line 53-62) used to verify all actions have off-limits notices and produce non-empty prompts. However, the `dead-code` action type is **missing from this array**, meaning:

1. It's not tested for the off-limits notice
2. It has no dedicated test asserting its content
3. The `ACTION_TO_SKILL_TYPE` mapping for `dead-code` → `"dead-code"` (line 15) is tested via the disk-based skill test but not via direct prompt generation

## Wiki reference

From `wiki/pages/verification.md`: role-based permissions exist for `dead-code-remover` (see `src/verify/permissions.ts:57`). The dead-code prompt (`src/prompts.ts:137-149`) tells the elf to read work-item.md, verify each candidate is truly dead, remove source AND stale test files, run tests, and commit.

## What to do

1. Add `"dead-code"` to the `allActions` array in `src/__tests__/prompts.test.ts` at line 62 (before the closing bracket)
2. Add dedicated tests for the `dead-code` prompt:
   - It mentions reading `work-item.md`
   - It mentions verifying dead code via grep
   - It permits deleting test files (`You ARE permitted to delete test files`)
   - It mentions running `bun test`
3. Add a test for the `dead-code` skill integration (like the existing `fix-tests` and `execute-work-item` skill tests):
   - Create a dead-code skill in the test with `mapsTo: "dead-code"`
   - Verify the prompt includes the skill section

## Patterns to follow

Follow the existing test patterns in the file:
- Use `makeState()` for WorldState
- Use `makeSkill()` and `makeSkillMap()` for skill definitions
- Use `expect(prompt).toContain(...)` for assertions
- Group related tests in `describe` blocks

## What NOT to change

- Do not modify `src/prompts.ts` — only add tests
- Do not modify any wiki pages or invariants
- Do not change existing passing tests

## Tests to write

Add these to `src/__tests__/prompts.test.ts`:

```typescript
// In the allActions array, add "dead-code"

// New tests:
test("dead-code prompt tells elf to read work-item.md", () => { ... });
test("dead-code prompt tells elf to verify with grep", () => { ... });
test("dead-code prompt permits deleting test files", () => { ... });
test("dead-code prompt includes dead-code skill body when provided", () => { ... });
```

Run `bun test` to confirm all tests pass.
