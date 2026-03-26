skill-type: test-coverage

# Add direct tests for explore prompt process-temperature guidance

## Wiki Spec

`wiki/pages/behaviour-tree.md` (lines 53-54) describes the explore phase: "The elf reads everything: wiki, code, findings, invariants, health scores. It produces `.shoe-makers/state/candidates.md`."

The process temperature guidance (adjusting explore focus based on reactiveRatio) is documented in finding `unspecified-process-patterns.md` but not yet in the wiki spec.

## Current Code

`src/prompts/explore.ts` generates the explore prompt. Lines 16-37 inject process temperature guidance based on `reactiveRatio`:
- High ratio (> 0.6): suggests looking at proactive improvements
- Low ratio (< 0.3): suggests checking for reactive needs

`src/__tests__/prompts-core.test.ts` and `src/__tests__/prompt-builders-proactive.test.ts` test prompt builders but don't verify the process temperature guidance specifically.

## What to Build

Add tests in a new file `src/__tests__/explore-prompt.test.ts` that verify:

1. When `reactiveRatio > 0.6`, the explore prompt includes guidance about proactive improvements
2. When `reactiveRatio < 0.3`, the explore prompt includes guidance about reactive needs
3. When `reactiveRatio` is in the middle range (0.3-0.6), no special guidance is added
4. When `processPatterns` is undefined/null, the prompt still generates correctly without errors

Import the explore prompt function and call it with mocked assessment data containing different `processPatterns.reactiveRatio` values.

## Patterns to Follow

Follow the existing test patterns in `src/__tests__/prompts-core.test.ts`:
- Use `describe`/`it` blocks
- Mock the assessment data with the relevant fields
- Use `expect(prompt).toContain(...)` for string matching
- Keep test data minimal — only set the fields needed for the test

## Tests to Write

See "What to Build" above — the tests ARE the deliverable.

## What NOT to Change

- Do NOT modify `src/prompts/explore.ts` or any other source files
- Do NOT modify `.shoe-makers/invariants.md`
- Only create the test file

## Decision Rationale

Candidates #1 (README sync) and #2 (TypeScript constraint) were already completed in previous cycles. Candidate #3 (scheduled-tasks.md) was investigated and found to be accurate — no finding needed. Candidate #5 (duplicate archives) is trivial cleanup. Candidate #4 (prompt tests) is the remaining option with meaningful value — it specifically tests the process-temperature feature which is undocumented in the spec (finding exists) and would catch regressions in this subtle behaviour.
